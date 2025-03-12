// src/components/documents/DocumentUpload.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { uploadDocument, UploadProgress } from '@/firebase/storage';
import { createDocument } from '@/firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: Error) => void;
}

interface FileWithProgress {
  file: File;
  progress: UploadProgress;
  documentId?: string;
}

export default function DocumentUpload({ projectId, onUploadComplete, onUploadError }: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { userProfile } = useAuth();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Convert files to FileWithProgress objects
    const filesWithProgress = acceptedFiles.map(file => ({
      file,
      progress: {
        progress: 0,
        status: 'pending' as const
      }
    }));
    
    setFiles(prev => [...prev, ...filesWithProgress]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled: isUploading
  });
  
  const uploadFiles = async () => {
    if (!userProfile) return;
    
    setIsUploading(true);
    
    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i];
      
      // Skip files that are already uploaded or have errors
      if (fileWithProgress.progress.status === 'completed' || fileWithProgress.progress.status === 'error') {
        continue;
      }
      
      try {
        // Update progress
        const updateProgress = (progress: UploadProgress) => {
          setFiles(prev => {
            const newFiles = [...prev];
            newFiles[i] = {
              ...newFiles[i],
              progress
            };
            return newFiles;
          });
        };
        
        // Start upload
        const uploadTask = uploadDocument(
          fileWithProgress.file,
          projectId,
          undefined, // No folder
          updateProgress
        );
        
        // Wait for upload to complete
        const snapshot = await uploadTask;
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        // Create document entry in Firestore
        const documentId = await createDocument({
          name: fileWithProgress.file.name,
          fileName: fileWithProgress.file.name,
          fileType: fileWithProgress.file.type,
          fileSize: fileWithProgress.file.size,
          filePath: snapshot.ref.fullPath,
          projectId,
          organizationId: userProfile.organizationId || '',
          ownerId: userProfile.uid,
          extractedText: '',
          tags: [],
          version: 1
        });
        
        // Update file with document ID
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = {
            ...newFiles[i],
            documentId
          };
          return newFiles;
        });
        
        // Call callback if provided
        if (onUploadComplete) {
          onUploadComplete(documentId);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Update file with error
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = {
            ...newFiles[i],
            progress: {
              progress: 0,
              status: 'error',
              error: error as Error
            }
          };
          return newFiles;
        });
        
        // Call callback if provided
        if (onUploadError) {
          onUploadError(error as Error);
        }
      }
    }
    
    setIsUploading(false);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <DocumentIcon className="mx-auto h-12 w-12 text-neutral-400" />
        <p className="mt-2 text-sm font-medium text-neutral-900">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here, or click to select files'}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Supported formats: PDF, DOCX, PPTX, XLSX, JPG, PNG (max 20MB)
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-900">Files to upload</h3>
          <ul className="border rounded-md divide-y divide-neutral-200">
            {files.map((fileWithProgress, index) => (
              <li key={index} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center min-w-0 flex-1">
                  <DocumentIcon className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                  <div className="ml-2 flex-1 truncate">
                    <p className="text-sm font-medium text-neutral-900 truncate">{fileWithProgress.file.name}</p>
                    <p className="text-xs text-neutral-500">{(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div className="ml-4 flex items-center space-x-3">
                  {fileWithProgress.progress.status === 'uploading' && (
                    <div className="w-24">
                      <div className="bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${fileWithProgress.progress.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 text-right">
                        {Math.round(fileWithProgress.progress.progress)}%
                      </p>
                    </div>
                  )}
                  
                  {fileWithProgress.progress.status === 'completed' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  
                  {fileWithProgress.progress.status === 'error' && (
                    <div className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                      <span className="ml-1 text-xs text-red-500">Error</span>
                    </div>
                  )}
                  
                  {fileWithProgress.progress.status !== 'uploading' && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="rounded-md bg-white text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Remove file</span>
                      <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={isUploading || files.every(f => f.progress.status === 'completed')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}