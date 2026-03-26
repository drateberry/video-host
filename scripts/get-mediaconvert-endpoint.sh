#!/bin/bash

# Get MediaConvert endpoint for your AWS account
# Usage: ./scripts/get-mediaconvert-endpoint.sh

REGION="${AWS_REGION:-us-east-2}"

echo "Fetching MediaConvert endpoint for region: $REGION"
echo ""

aws mediaconvert describe-endpoints --region "$REGION" --query 'Endpoints[0].Url' --output text
