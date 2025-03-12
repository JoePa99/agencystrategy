// src/services/ai.ts
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { functions, db } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: For production, use Firebase functions instead
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});

// Vector index
const vectorIndex = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);

// Types
export interface EmbeddingChunk {
  text: string;
  embedding: number[];
  metadata: {
    documentId: string;
    projectId: string;
    organizationId: string;
    chunk_index: number;
  };
}

export interface SearchResult {
  documentId: string;
  documentName?: string;
  text: string;
  score: number;
}

export interface AiResponse {
  answer: string;
  sources: {
    documentId: string;
    documentName?: string;
    text: string;
  }[];
}

// Functions

// Generate text embeddings
export const generateEmbeddings = async (text: string): Promise<number[]> => {
  // Call embeddings API
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
  });
  
  return response.data[0].embedding;
};

// Create embeddings for document chunks using Cloud Function
export const createDocumentEmbeddings = async (documentId: string): Promise<void> => {
  // Using Firebase function to process document and create embeddings
  const processDocument = httpsCallable(functions, 'processDocument');
  await processDocument({ documentId });
};

// Query documents using RAG pattern
export const queryDocuments = async (
  query: string,
  projectId: string,
  maxResults: number = 5
): Promise<AiResponse> => {
  try {
    // Generate embedding for query
    const embedding = await generateEmbeddings(query);
    
    // Search Pinecone for similar vectors
    const results = await vectorIndex.query({
      vector: embedding,
      filter: { projectId },
      topK: maxResults,
      includeMetadata: true
    });
    
    // Format search results with document information
    const searchResults: SearchResult[] = results.matches.map(match => ({
      documentId: match.metadata!.documentId as string,
      text: match.metadata!.text as string,
      score: match.score
    }));
    
    // Combine the results into a prompt for OpenAI
    const context = searchResults.map(result => result.text).join('\n\n');
    
    // Generate a response with OpenAI
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant helping with advertising strategy research. Answer the user's question based only on the context provided. 
                    If the context doesn't contain the information needed to answer the question, say "I don't have enough information to answer that question."
                    Always cite the sources you used to answer the question by referencing the document IDs.`
        },
        { 
          role: 'user', 
          content: `Context information:\n${context}\n\nQuestion: ${query}`
        }
      ],
      temperature: 0.3,
    });
    
    // Extract the sources from the response
    const sources = searchResults.map(result => ({
      documentId: result.documentId,
      text: result.text,
    }));
    
    // Return the AI response with sources
    return {
      answer: chatResponse.choices[0].message.content || "No response generated",
      sources
    };
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};

// Generate insights from research data
export const generateInsights = async (
  researchId: string,
  maxInsights: number = 5
): Promise<string[]> => {
  // This would call a Firebase Function in production
  const generateResearchInsights = httpsCallable(functions, 'generateResearchInsights');
  const result = await generateResearchInsights({ researchId, maxInsights });
  
  return (result.data as any).insights as string[];
};

// Summarize a document
export const summarizeDocument = async (
  documentId: string, 
  length: 'short' | 'medium' | 'long' = 'medium'
): Promise<string> => {
  // This would call a Firebase Function in production
  const summarizeDocumentContent = httpsCallable(functions, 'summarizeDocumentContent');
  const result = await summarizeDocumentContent({ documentId, length });
  
  return (result.data as any).summary as string;
};

// Execute research request
export const executeResearch = async (researchId: string): Promise<void> => {
  // This function would call a Firebase Function to start the research process
  const startResearch = httpsCallable(functions, 'startResearch');
  await startResearch({ researchId });
};