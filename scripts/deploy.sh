#!/bin/bash

# Frontend Deployment Script
# This script builds the Next.js static export and deploys it to S3 with CloudFront invalidation

set -e  # Exit on any error
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
S3_BUCKET="${S3_BUCKET:-auray-ui-frontend}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-E3THNFH4OD7KQ4}"
CLOUDFRONT_DISTRIBUTION_ID_AURAY="${CLOUDFRONT_DISTRIBUTION_ID_AURAY:-E105BONOLYJNM}"  # auray.net (without www)

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${GREEN}🚀 Starting frontend deployment...${NC}"
echo ""

# Step 1: Build the static export
echo -e "${YELLOW}📦 Building Next.js static export...${NC}"
cd "$FRONTEND_DIR"
npm run build

if [ ! -d "out" ]; then
    echo -e "${RED}❌ Error: 'out' directory not found after build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"
echo ""

# Step 2: Sync to S3
echo -e "${YELLOW}☁️  Syncing files to S3 bucket: ${S3_BUCKET}...${NC}"
aws s3 sync ./out s3://${S3_BUCKET} --delete

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to sync files to S3${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Files synced to S3 successfully${NC}"
echo ""

# Step 3: Invalidate CloudFront cache for both distributions
echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"

# Invalidate www.auray.net
echo -e "${YELLOW}   Invalidating www.auray.net (Distribution: ${CLOUDFRONT_DISTRIBUTION_ID})...${NC}"
INVALIDATION_ID_WWW=$(aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create CloudFront invalidation for www.auray.net${NC}"
    exit 1
fi

# Invalidate auray.net (without www)
echo -e "${YELLOW}   Invalidating auray.net (Distribution: ${CLOUDFRONT_DISTRIBUTION_ID_AURAY})...${NC}"
INVALIDATION_ID_AURAY=$(aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID_AURAY} \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create CloudFront invalidation for auray.net${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CloudFront invalidations created successfully${NC}"
echo "   www.auray.net: ${INVALIDATION_ID_WWW}"
echo "   auray.net: ${INVALIDATION_ID_AURAY}"
echo "   Note: It may take a few minutes for the invalidations to complete"
echo ""

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "Summary:"
echo "  - Built static export: ✅"
echo "  - Synced to S3: ✅"
echo "  - CloudFront invalidation: ✅ (ID: ${INVALIDATION_ID})"

