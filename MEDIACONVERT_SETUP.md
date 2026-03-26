# MediaConvert Setup Guide

This guide walks you through setting up AWS MediaConvert for automatic video transcoding.

## Prerequisites

- AWS CLI installed and configured with your credentials
- Your S3 bucket already created (`optimizepilot-demo` in `us-east-2`)

## Step 1: Get Your MediaConvert Endpoint

Run the helper script:

```bash
./scripts/get-mediaconvert-endpoint.sh
```

Or manually:

```bash
aws mediaconvert describe-endpoints --region us-east-2
```

Copy the endpoint URL (e.g., `https://abc12345.mediaconvert.us-east-2.amazonaws.com`) and paste it into `.env.local` as `MEDIACONVERT_ENDPOINT`.

## Step 2: Create IAM Role for MediaConvert

MediaConvert needs an IAM role to access your S3 bucket. Create `mediaconvert-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "mediaconvert.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create the role:

```bash
aws iam create-role \
  --role-name MediaConvertRole \
  --assume-role-policy-document file://mediaconvert-trust-policy.json
```

Attach the S3 access policy:

```bash
aws iam put-role-policy \
  --role-name MediaConvertRole \
  --policy-name MediaConvertS3Access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject"
        ],
        "Resource": "arn:aws:s3:::optimizepilot-demo/*"
      }
    ]
  }'
```

Get the role ARN:

```bash
aws iam get-role --role-name MediaConvertRole --query 'Role.Arn' --output text
```

Copy the ARN (e.g., `arn:aws:iam::123456789012:role/MediaConvertRole`) into `.env.local` as `MEDIACONVERT_ROLE_ARN`.

## Step 3: Set Webhook Secret

Generate a random secret for webhook authentication:

```bash
openssl rand -hex 32
```

Paste it into `.env.local` as `TRANSCODE_WEBHOOK_SECRET`.

## Step 4: Configure S3 Bucket URL

Your S3 bucket URL should be:

```
https://optimizepilot-demo.s3.us-east-2.amazonaws.com
```

Update `S3_BUCKET_URL` in `.env.local`.

## Step 5: Set Up EventBridge (Optional but Recommended)

For production, you want MediaConvert to automatically call your webhook when jobs complete.

### Option A: Polling (Simpler for Development)

Just use the manual check endpoint:

```bash
curl -X POST http://localhost:3000/api/transcode/check \
  -H "Cookie: your-session-cookie"
```

You can set up a cron job (Vercel Cron, GitHub Actions, etc.) to hit this endpoint every few minutes.

### Option B: EventBridge → Webhook (Production)

1. Create an EventBridge rule that matches MediaConvert job state changes:

```bash
aws events put-rule \
  --name mediaconvert-job-complete \
  --event-pattern '{
    "source": ["aws.mediaconvert"],
    "detail-type": ["MediaConvert Job State Change"],
    "detail": {
      "status": ["COMPLETE", "ERROR"]
    }
  }' \
  --region us-east-2
```

2. Add a Lambda target that calls your webhook:

Create `webhook-lambda.js`:

```javascript
const https = require('https');

exports.handler = async (event) => {
  const detail = event.detail;

  const payload = {
    secret: process.env.WEBHOOK_SECRET,
    jobId: detail.jobId,
    status: detail.status,
    outputKey: detail.outputGroupDetails?.[0]?.outputDetails?.[0]?.outputFilePaths?.[0]?.replace('s3://optimizepilot-demo/', ''),
  };

  const options = {
    hostname: 'your-app.vercel.app', // or your production domain
    path: '/api/transcode/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      resolve({ statusCode: res.statusCode });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
};
```

3. Deploy the Lambda and configure the EventBridge target.

## Testing

1. Start your Next.js dev server: `npm run dev`
2. Record a video via `/dashboard/record`
3. The transcoding should automatically trigger
4. Check status: `POST /api/transcode/check` (manual) or wait for the webhook
5. The pitch page URL stays the same - it'll seamlessly switch from .webm to .mp4

## Troubleshooting

- **"No job ID returned"**: Check your IAM role has the right permissions
- **"Failed to start transcoding"**: Verify `MEDIACONVERT_ENDPOINT` is correct for your region
- **Webhook not firing**: Use the manual check endpoint as fallback
- **Video still .webm after hours**: Check MediaConvert console for job errors
