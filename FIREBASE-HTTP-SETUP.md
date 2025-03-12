# Firebase HTTP Functions Setup

This document explains how to set up the Firebase Functions to work with your Vercel-deployed Next.js application.

## Architecture Overview

Instead of using the Firebase Functions SDK in your frontend (which causes issues with Vercel builds), we're using a cleaner approach:

1. Firebase Functions are deployed separately as HTTP endpoints
2. The frontend makes standard HTTP requests to these endpoints
3. Authentication is handled via Firebase Auth tokens

## Deployment Steps

### 1. Deploy Firebase Functions

Deploy the Firebase Functions to Firebase (not Vercel):

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

After deployment, Firebase will provide URLs for your functions, such as:
```
https://us-central1-agencystrategy-95d3d.cloudfunctions.net/generateResearchInsightsHttp
```

### 2. Update the Base URL

In `/src/services/ai-http.ts`, update the `FUNCTIONS_BASE_URL` constant with your Firebase project's functions URL:

```typescript
const FUNCTIONS_BASE_URL = 'https://us-central1-your-project-id.cloudfunctions.net';
```

### 3. Use HTTP Services in Your Components

Import the HTTP service functions instead of the SDK versions:

```typescript
// Instead of this:
import { generateInsights } from '@/services/ai';

// Use this:
import { generateInsightsHttp } from '@/services/ai-http';

// Then in your component:
const insights = await generateInsightsHttp(researchId, 5);
```

## Security

- The HTTP functions verify Firebase Auth tokens
- CORS is configured to allow requests from any origin
- All data is sent via HTTPS

## Troubleshooting

- If functions return 401 errors, check that the user is authenticated
- If functions return 404 errors, check that the function URLs are correct
- If functions return 500 errors, check the Firebase Functions logs

## Benefits of This Approach

1. **Clean Separation**: Frontend and backend are clearly separated
2. **Simpler Deployments**: No issues with Vercel builds
3. **Better Performance**: Direct HTTP calls without SDK overhead
4. **Improved Maintainability**: Easier to troubleshoot issues