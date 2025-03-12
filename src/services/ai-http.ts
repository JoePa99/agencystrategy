// src/services/ai-http.ts
import { auth } from '@/firebase/config';

// Base URL for your Firebase Functions (once deployed)
// This will be the domain provided by Firebase when you deploy your functions
// e.g., https://us-central1-your-project-id.cloudfunctions.net
const FUNCTIONS_BASE_URL = 'https://us-central1-agencystrategy-95d3d.cloudfunctions.net';

// Helper function to get authentication token
const getAuthToken = async (): Promise<string> => {
  // Server-side safety check
  if (typeof window === 'undefined' || !auth) {
    throw new Error('Authentication not available in this environment');
  }
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return user.getIdToken(true);
};

// Helper function to make authenticated requests to Firebase Functions
const callFunctionHttp = async <T>(
  functionName: string, 
  data: any
): Promise<T> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Function call failed');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

// Function to generate insights using HTTP
export const generateInsightsHttp = async (
  researchId: string,
  maxInsights: number = 5
): Promise<string[]> => {
  const result = await callFunctionHttp<{ insights: string[] }>(
    'generateResearchInsightsHttp',
    { researchId, maxInsights }
  );
  
  return result.insights;
};

// Function to summarize a document using HTTP
export const summarizeDocumentHttp = async (
  documentId: string,
  length: 'short' | 'medium' | 'long' = 'medium'
): Promise<string> => {
  const result = await callFunctionHttp<{ summary: string }>(
    'summarizeDocumentHttp',
    { documentId, length }
  );
  
  return result.summary;
};

// Function to start research using HTTP
export const executeResearchHttp = async (researchId: string): Promise<void> => {
  await callFunctionHttp<{ success: boolean }>(
    'startResearchHttp',
    { researchId }
  );
};

// Function to process a document using HTTP
export const processDocumentHttp = async (documentId: string): Promise<number> => {
  const result = await callFunctionHttp<{ success: boolean, chunksCount: number }>(
    'processDocumentHttp',
    { documentId }
  );
  
  return result.chunksCount;
};