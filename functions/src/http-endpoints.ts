// functions/src/http-endpoints.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Initialize Firebase admin if not already initialized
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

// Initialize Firestore and Storage
const db = admin.firestore();
const storage = admin.storage();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

// HTTP version of generateResearchInsights
export const generateResearchInsightsHttp = functions.https.onRequest(async (request, response) => {
  // CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.status(204).send('');
    return;
  }
  
  try {
    // Check if there's an authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      response.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    
    // Get data from request body
    const { researchId, maxInsights = 5 } = request.body;
    
    if (!researchId) {
      response.status(400).json({ error: 'Bad request: Missing researchId' });
      return;
    }
    
    // Get research data
    const researchDoc = await db.collection('research').doc(researchId).get();
    
    if (!researchDoc.exists) {
      response.status(404).json({ error: 'Research not found' });
      return;
    }
    
    const researchData = researchDoc.data();
    
    // Ensure research is completed
    if (researchData?.status !== 'completed') {
      response.status(400).json({ error: 'Research is not completed yet' });
      return;
    }
    
    // Generate insights using OpenAI
    const content = researchData?.findings?.content || '';
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert advertising strategist. Your task is to analyze research findings and identify the most important strategic insights. 
                    Generate exactly ${maxInsights} insights from the provided research data. 
                    Each insight should be actionable, specific, and relevant to advertising strategy.
                    Format each insight as a single paragraph with a clear headline.`
        },
        {
          role: 'user',
          content: `Here are the research findings:\n\n${content}\n\nGenerate ${maxInsights} strategic insights based on this data.`
        }
      ],
      temperature: 0.7,
    });
    
    // Extract insights from response
    const insightsText = completion.choices[0].message.content || '';
    
    // Split insights by paragraphs, clean up, and limit to requested number
    const insights = insightsText
      .split('\n\n')
      .filter(insight => insight.trim().length > 0)
      .slice(0, maxInsights);
    
    response.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// HTTP version of summarizeDocumentContent
export const summarizeDocumentHttp = functions.https.onRequest(async (request, response) => {
  // CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.status(204).send('');
    return;
  }
  
  try {
    // Check if there's an authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      response.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    
    // Get data from request body
    const { documentId, length = 'medium' } = request.body;
    
    if (!documentId) {
      response.status(400).json({ error: 'Bad request: Missing documentId' });
      return;
    }
    
    // Get document data
    const documentDoc = await db.collection('documents').doc(documentId).get();
    
    if (!documentDoc.exists) {
      response.status(404).json({ error: 'Document not found' });
      return;
    }
    
    const documentData = documentDoc.data();
    const extractedText = documentData?.extractedText || '';
    
    if (!extractedText) {
      response.status(400).json({ error: 'Document text extraction not completed or failed' });
      return;
    }
    
    // Determine summary length
    let summaryInstructions = '';
    if (length === 'short') {
      summaryInstructions = 'Create a very concise summary in 2-3 sentences.';
    } else if (length === 'medium') {
      summaryInstructions = 'Create a comprehensive summary in about 3-5 paragraphs.';
    } else {
      summaryInstructions = 'Create a detailed summary covering all major points in the document.';
    }
    
    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert at summarizing documents for advertising agencies. ${summaryInstructions} Focus on information that would be most relevant for advertising strategy development.`
        },
        {
          role: 'user',
          content: `Please summarize the following document:\n\n${extractedText.slice(0, 15000)}` // Limit input size
        }
      ],
      temperature: 0.3,
    });
    
    const summary = completion.choices[0].message.content || '';
    
    response.json({ summary });
  } catch (error) {
    console.error('Error summarizing document:', error);
    response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// HTTP version of startResearch
export const startResearchHttp = functions.https.onRequest(async (request, response) => {
  // CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.status(204).send('');
    return;
  }
  
  try {
    // Check if there's an authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      response.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    
    // Get data from request body
    const { researchId } = request.body;
    
    if (!researchId) {
      response.status(400).json({ error: 'Bad request: Missing researchId' });
      return;
    }
    
    // Get research data
    const researchDoc = await db.collection('research').doc(researchId).get();
    
    if (!researchDoc.exists) {
      response.status(404).json({ error: 'Research not found' });
      return;
    }
    
    const researchData = researchDoc.data();
    
    // Update research status to in_progress
    await researchDoc.ref.update({
      status: 'in_progress',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Extract parameters
    const topics = researchData?.parameters?.topics || [];
    const questions = researchData?.parameters?.questions || [];
    const sources = researchData?.parameters?.sources || [];
    
    // Generate prompt for research
    let prompt = 'Research Task:\n\n';
    
    if (topics.length > 0) {
      prompt += 'Topics to research:\n';
      topics.forEach((topic: string, index: number) => {
        prompt += `${index + 1}. ${topic}\n`;
      });
      prompt += '\n';
    }
    
    if (questions.length > 0) {
      prompt += 'Questions to answer:\n';
      questions.forEach((question: string, index: number) => {
        prompt += `${index + 1}. ${question}\n`;
      });
      prompt += '\n';
    }
    
    if (sources.length > 0) {
      prompt += 'Sources to use:\n';
      sources.forEach((source: any, index: number) => {
        prompt += `${index + 1}. ${source.type}: ${source.value}\n`;
      });
    }
    
    // Generate research findings using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert researcher for an advertising agency. You need to conduct comprehensive research on the given topics and answer the specified questions.
                    Your research should be thorough, factual, and well-structured.
                    Include relevant statistics, trends, and insights that would be valuable for advertising strategy development.
                    Format your response with clear headings, bullet points, and paragraphs for readability.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
    });
    
    const researchContent = completion.choices[0].message.content || '';
    
    // Update research with findings
    await researchDoc.ref.update({
      status: 'completed',
      findings: {
        content: researchContent,
        sources: ['AI-generated research'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    response.json({ success: true });
  } catch (error) {
    console.error('Error starting research:', error);
    
    // Try to update research status to failed
    try {
      if (request.body && request.body.researchId) {
        await db.collection('research').doc(request.body.researchId).update({
          status: 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (updateError) {
      console.error('Error updating research status:', updateError);
    }
    
    response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// HTTP version for manually triggering document processing
export const processDocumentHttp = functions.https.onRequest(async (request, response) => {
  // CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.status(204).send('');
    return;
  }
  
  try {
    // Check if there's an authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      response.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    
    // Get data from request body
    const { documentId } = request.body;
    
    if (!documentId) {
      response.status(400).json({ error: 'Bad request: Missing documentId' });
      return;
    }
    
    // Get document data
    const documentRef = db.collection('documents').doc(documentId);
    const documentSnapshot = await documentRef.get();
    
    if (!documentSnapshot.exists) {
      response.status(404).json({ error: 'Document not found' });
      return;
    }
    
    const documentData = documentSnapshot.data();
    
    try {
      // Update document status to processing
      await documentRef.update({
        embeddings: {
          status: 'processing',
          completed: false
        }
      });
      
      // Get file from Storage
      const filePath = documentData?.filePath;
      if (!filePath) {
        throw new Error('Document is missing file path');
      }
      
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      // Download file
      const [fileBuffer] = await file.download();
      
      // Extract text based on file type
      let extractedText = '';
      const fileType = documentData?.fileType;
      
      if (fileType === 'application/pdf') {
        // Extract text from PDF
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Extract text from XLSX
        const workbook = xlsx.read(fileBuffer);
        
        // Concatenate text from all sheets
        extractedText = workbook.SheetNames
          .map(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            return `Sheet: ${sheetName}\n${xlsx.utils.sheet_to_txt(sheet)}`;
          })
          .join('\n\n');
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        // For PPTX, we'd need a more specialized library
        // As a fallback, we'll store a placeholder
        extractedText = '[Presentation content - text extraction not available]';
      } else if (fileType && fileType.startsWith('image/')) {
        // For images, we could use Cloud Vision API for OCR
        // As a fallback, we'll store a placeholder
        extractedText = '[Image content - text extraction not available]';
      } else {
        // Unsupported file type
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Update document with extracted text
      await documentRef.update({
        extractedText
      });
      
      // Generate embeddings for the document
      // We'll chunk the text into smaller pieces for better retrieval
      const chunkSize = 1000; // characters
      const overlap = 200; // character overlap between chunks
      const chunks: string[] = [];
      
      // Split text into chunks with overlap
      for (let i = 0; i < extractedText.length; i += chunkSize - overlap) {
        const chunk = extractedText.slice(i, i + chunkSize);
        if (chunk.trim().length > 0) {
          chunks.push(chunk);
        }
      }
      
      // Generate embeddings for each chunk and store in Pinecone
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding with OpenAI
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: chunk,
        });
        
        const embedding = embeddingResponse.data[0].embedding;
        
        // Store in Pinecone
        await pineconeIndex.upsert([{
          id: `${documentId}-chunk-${i}`,
          values: embedding,
          metadata: {
            documentId,
            projectId: documentData?.projectId,
            organizationId: documentData?.organizationId,
            chunk_index: i,
            text: chunk
          }
        }]);
      }
      
      // Update document status to completed
      await documentRef.update({
        embeddings: {
          status: 'completed',
          completed: true,
          chunksCount: chunks.length
        }
      });
      
      response.json({ 
        success: true,
        chunksCount: chunks.length
      });
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Update document status to failed
      await documentRef.update({
        embeddings: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completed: false
        }
      });
      
      throw error; // Rethrow for outer catch
    }
  } catch (error) {
    console.error('Error processing document (outer):', error);
    response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});