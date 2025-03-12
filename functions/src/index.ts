import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { parse } from 'node-html-parser';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Initialize Firebase admin
admin.initializeApp();

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

// Process document when uploaded to extract text and generate embeddings
export const processDocument = functions.firestore
  .document('documents/{documentId}')
  .onCreate(async (snapshot, context) => {
    const documentData = snapshot.data();
    const documentId = context.params.documentId;
    
    try {
      // Update document status to processing
      await snapshot.ref.update({
        embeddings: {
          status: 'processing',
          completed: false
        }
      });
      
      // Get file from Storage
      const filePath = documentData.filePath;
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      // Download file
      const [fileBuffer] = await file.download();
      
      // Extract text based on file type
      let extractedText = '';
      const fileType = documentData.fileType;
      
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
      } else if (fileType.startsWith('image/')) {
        // For images, we could use Cloud Vision API for OCR
        // As a fallback, we'll store a placeholder
        extractedText = '[Image content - text extraction not available]';
      } else {
        // Unsupported file type
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Update document with extracted text
      await snapshot.ref.update({
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
            projectId: documentData.projectId,
            organizationId: documentData.organizationId,
            chunk_index: i,
            text: chunk
          }
        }]);
      }
      
      // Update document status to completed
      await snapshot.ref.update({
        embeddings: {
          status: 'completed',
          completed: true,
          chunksCount: chunks.length
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Update document status to failed
      await snapshot.ref.update({
        embeddings: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completed: false
        }
      });
      
      return false;
    }
  });

// Generate research insights from research data
export const generateResearchInsights = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { researchId, maxInsights = 5 } = data;
  
  try {
    // Get research data
    const researchDoc = await db.collection('research').doc(researchId).get();
    
    if (!researchDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Research not found'
      );
    }
    
    const researchData = researchDoc.data();
    
    // Ensure research is completed
    if (researchData?.status !== 'completed') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Research is not completed yet'
      );
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
    
    return { insights };
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error generating insights',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

// Summarize document content
export const summarizeDocumentContent = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { documentId, length = 'medium' } = data;
  
  try {
    // Get document data
    const documentDoc = await db.collection('documents').doc(documentId).get();
    
    if (!documentDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Document not found'
      );
    }
    
    const documentData = documentDoc.data();
    const extractedText = documentData?.extractedText || '';
    
    if (!extractedText) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Document text extraction not completed or failed'
      );
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
    
    return { summary };
  } catch (error) {
    console.error('Error summarizing document:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error summarizing document',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

// Start research process
export const startResearch = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { researchId } = data;
  
  try {
    // Get research data
    const researchDoc = await db.collection('research').doc(researchId).get();
    
    if (!researchDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Research not found'
      );
    }
    
    const researchData = researchDoc.data();
    
    // Update research status to in_progress
    await researchDoc.ref.update({
      status: 'in_progress',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // In a real implementation, this would trigger a longer-running process
    // For this demo, we'll simulate completing the research with a delay
    
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
    
    return { success: true };
  } catch (error) {
    console.error('Error starting research:', error);
    
    // Update research status to failed
    await db.collection('research').doc(researchId).update({
      status: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw new functions.https.HttpsError(
      'internal',
      'Error processing research',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});