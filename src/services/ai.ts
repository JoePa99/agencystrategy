// src/services/ai.ts
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { functions, db } from '@/firebase/config';

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
  // Mock implementation for now
  console.log(`Creating embeddings for document: ${documentId}`);
  
  // This would normally call a Firebase Function
  // For now, we'll just return a resolved promise
  return Promise.resolve();
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
  // Mock implementation for now
  console.log(`Generating insights for research: ${researchId}, max: ${maxInsights}`);
  
  // Return mock data
  return [
    "Insight 1: Consumers in the target demographic prefer eco-friendly packaging",
    "Insight 2: Social media engagement increases by 45% when using interactive content",
    "Insight 3: Brand recall is strongest when using consistent visual elements across channels",
    "Insight 4: The target audience spends 3.5 hours daily on mobile devices",
    "Insight 5: Competitor analysis shows a gap in the market for premium subscription services"
  ].slice(0, maxInsights);
};

// Summarize a document
export const summarizeDocument = async (
  documentId: string, 
  length: 'short' | 'medium' | 'long' = 'medium'
): Promise<string> => {
  // Mock implementation for now
  console.log(`Summarizing document: ${documentId}, length: ${length}`);
  
  // Return mock summary based on length
  if (length === 'short') {
    return "This document outlines the marketing strategy for Q3, focusing on digital channels and influencer partnerships to reach the target demographic.";
  } else if (length === 'medium') {
    return "This document outlines the marketing strategy for Q3 2023, with a primary focus on digital channels and influencer partnerships. The strategy aims to increase brand awareness by 25% and drive a 15% increase in sales among the 18-34 demographic. Key initiatives include a redesigned social media presence, partnerships with 5 tier-1 influencers, and an expanded content marketing program. Budget allocation prioritizes video content (40%), paid social (30%), influencer marketing (20%), and email campaigns (10%).";
  } else {
    return "This document provides a comprehensive outline of the marketing strategy for Q3 2023, with a primary focus on digital channels and influencer partnerships to reach the target demographic. The strategy aims to increase brand awareness by 25% and drive a 15% increase in sales among the 18-34 demographic.\n\nKey initiatives include:\n1. A redesigned social media presence across Instagram, TikTok, and YouTube\n2. Partnerships with 5 tier-1 influencers in the fashion and lifestyle space\n3. An expanded content marketing program focused on sustainability and ethical manufacturing\n4. Targeted email campaigns to re-engage dormant customers\n5. Limited-time promotions tied to seasonal events\n\nBudget allocation prioritizes video content (40%), paid social (30%), influencer marketing (20%), and email campaigns (10%). Success metrics include engagement rates, conversion tracking, influencer ROI, and overall sales lift.\n\nThe strategy also outlines contingency plans for underperforming channels and a timeline for implementation, with weekly check-ins and a mid-quarter review to allow for adjustments based on performance data.";
  }
};

// Execute research request
export const executeResearch = async (researchId: string): Promise<void> => {
  // Mock implementation for now
  console.log(`Executing research: ${researchId}`);
  
  // This would normally call a Firebase Function
  // For now, we'll just return a resolved promise
  return Promise.resolve();
};