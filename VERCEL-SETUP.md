# Setting Up Environment Variables on Vercel

For your Vercel deployment to work correctly, you need to set up the following environment variables in your Vercel project settings:

## Required Environment Variables

Add the following variables from your `.env.local` file to your Vercel project:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

NEXT_PUBLIC_OPENAI_API_KEY

NEXT_PUBLIC_PINECONE_API_KEY
NEXT_PUBLIC_PINECONE_INDEX
```

**Important: Copy the values from your local `.env.local` file, not from this guide.**

## Steps to Add Environment Variables to Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Click on the "Settings" tab
4. Select "Environment Variables" from the left sidebar
5. Add each variable with its value
6. Click "Save" to apply the changes
7. Deploy your project again

## Important Notes

- Make sure to add ALL the environment variables listed above
- The Firebase errors you're seeing are due to missing or incorrect environment variables
- You may need to redeploy after adding the environment variables