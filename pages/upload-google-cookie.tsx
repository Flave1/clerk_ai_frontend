import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CloudArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { useUIStore } from '@/store';

export default function UploadGoogleCookie() {
  const router = useRouter();
  const { theme } = useUIStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        toast.error('Please select a JSON file');
        return;
      }
      setFile(selectedFile);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      
      // Read file as text
      const fileContent = await file.text();
      
      // Parse to validate JSON
      let authState;
      try {
        authState = JSON.parse(fileContent);
      } catch (parseError) {
        toast.error('Invalid JSON file. Please check the file format.');
        setUploading(false);
        return;
      }

      // Validate structure
      if (!authState.cookies || !Array.isArray(authState.cookies)) {
        toast.error('Invalid auth state format. File must contain a cookies array.');
        setUploading(false);
        return;
      }

      // Upload via API
      const result = await apiClient.uploadGoogleAuthState(authState);
      
      if (result.ok) {
        setUploadSuccess(true);
        toast.success('Google auth state uploaded successfully!');
        // Reset file input
        setFile(null);
        // Reset file input element
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to upload auth state');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Upload Google Cookie - Aurray</title>
      </Head>

      <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#0D1117] transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Upload Google Cookie
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Upload your Google authentication state file to enable automatic Google Meet login
            </p>
          </div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8"
          >
            <div className="space-y-6">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select JSON File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-input"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-input"
                          name="file-input"
                          type="file"
                          accept=".json,application/json"
                          className="sr-only"
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JSON files only
                    </p>
                  </div>
                </div>
                {file && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Selected:</span> {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Size: {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading || uploadSuccess}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Uploaded
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>

              {/* Success Message */}
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Google auth state uploaded successfully! The bot can now use this for Google Meet authentication.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Instructions */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  How to get your Google auth state file:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Run the login script: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">node browser_bot/scripts/login_and_save_state.js</code></li>
                  <li>Complete the Google login in the opened browser window</li>
                  <li>Wait for the script to save the auth state file</li>
                  <li>Upload the generated JSON file here</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

