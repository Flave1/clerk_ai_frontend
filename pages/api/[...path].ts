import type { NextApiRequest, NextApiResponse } from 'next';

// Remove trailing slash from BACKEND_URL to avoid double slashes
const BACKEND_URL = (process.env.BACKEND_URL || 'http://3.235.168.161:8000').replace(/\/$/, '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // Get the path from the URL (everything after /api/)
  const path = Array.isArray(req.query.path) 
    ? req.query.path.join('/') 
    : req.query.path || '';

  // Debug logging (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API Proxy] ${req.method} /api/${path}`);
  }

  // Handle special webhook paths like /api/v1/api.auray.net/*
  // These should go to /v1/api.auray.net/* on backend
  let backendPath: string;
  if (path.startsWith('v1/')) {
    // Already has v1 prefix, use as-is (e.g., v1/api.auray.net/join_meeting)
    backendPath = path;
  } else {
    // Regular API path, add api/v1 prefix
    backendPath = `api/v1/${path}`;
  }
  
  // Construct target URL (ensure single slash between base URL and path)
  const targetUrl = `${BACKEND_URL}/${backendPath}`;
  
  // Debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API Proxy] Forwarding to: ${targetUrl}`);
  }

  try {
    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        // Forward authorization header if present
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      // Forward body for POST, PUT, PATCH requests
      ...(req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS' && {
        body: JSON.stringify(req.body),
      }),
    });

    // Get response data
    const data = await response.json().catch(() => null);
    
    // Forward status and headers
    res.status(response.status);
    
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the response
    if (data) {
      res.json(data);
    } else {
      res.end();
    }
  } catch (error: any) {
    console.error('[API Proxy] Error:', error);
    console.error('[API Proxy] Target URL was:', targetUrl);
    console.error('[API Proxy] Request method:', req.method);
    console.error('[API Proxy] Request path:', path);
    
    res.status(500).json({ 
      detail: error.message || 'Failed to proxy request to backend',
      error: 'ProxyError',
      targetUrl: targetUrl,
      path: path
    });
  }
}

// Handle OPTIONS requests for CORS
export const config = {
  api: {
    externalResolver: true,
  },
};
