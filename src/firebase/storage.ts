// src/firebase/storage.ts
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask
} from 'firebase/storage';
import { storage } from './config';
import { auth } from './config';

// File upload progress and status
export interface UploadProgress {
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  downloadURL?: string;
  error?: Error;
}

// Upload document to Firebase Storage
export const uploadDocument = (
  file: File,
  projectId: string,
  folder?: string,
  onProgress?: (progress: UploadProgress) => void
): UploadTask => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Create storage path: projects/{projectId}/documents/{folder?}/{fileName}
  let path = `projects/${projectId}/documents`;
  if (folder) path += `/${folder}`;
  
  // Add timestamp to ensure unique filenames
  const timestamp = new Date().getTime();
  const fileName = `${timestamp}-${file.name}`;
  path += `/${fileName}`;
  
  const storageRef = ref(storage, path);
  
  // Start upload
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  // Set up progress monitoring if callback provided
  if (onProgress) {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({
          progress,
          status: 'uploading'
        });
      },
      (error) => {
        onProgress({
          progress: 0,
          status: 'error',
          error
        });
      },
      async () => {
        // Upload completed successfully
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress({
          progress: 100,
          status: 'completed',
          downloadURL
        });
      }
    );
  }
  
  return uploadTask;
};

// Get download URL for a document
export const getDocumentDownloadURL = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

// Delete a document from storage
export const deleteDocumentFromStorage = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
};

// List all documents in a project folder
export const listProjectDocuments = async (
  projectId: string,
  folder?: string
): Promise<{name: string, path: string, downloadURL: string}[]> => {
  // Create storage path: projects/{projectId}/documents/{folder?}
  let path = `projects/${projectId}/documents`;
  if (folder) path += `/${folder}`;
  
  const storageRef = ref(storage, path);
  const res = await listAll(storageRef);
  
  // Get details for each item
  const documents = await Promise.all(
    res.items.map(async (itemRef) => {
      const downloadURL = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        downloadURL
      };
    })
  );
  
  return documents;
};

// Upload profile picture
export const uploadProfilePicture = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const user = auth.currentUser;
  if (!user || user.uid !== userId) throw new Error('Unauthorized');
  
  // Get file extension
  const fileExt = file.name.split('.').pop() || 'jpg';
  const path = `users/${userId}/profile.${fileExt}`;
  const storageRef = ref(storage, path);
  
  // Start upload
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  // Create a promise to handle the upload
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            progress,
            status: 'uploading'
          });
        }
      },
      (error) => {
        if (onProgress) {
          onProgress({
            progress: 0,
            status: 'error',
            error
          });
        }
        reject(error);
      },
      async () => {
        // Upload completed successfully
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        if (onProgress) {
          onProgress({
            progress: 100,
            status: 'completed',
            downloadURL
          });
        }
        resolve(downloadURL);
      }
    );
  });
};

// Upload temporary file (used during document processing)
export const uploadTempFile = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  // Add timestamp to ensure unique filenames
  const timestamp = new Date().getTime();
  const fileName = `${timestamp}-${file.name}`;
  const path = `temp/${user.uid}/${fileName}`;
  
  const storageRef = ref(storage, path);
  
  // Start upload
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  // Create a promise to handle the upload
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            progress,
            status: 'uploading'
          });
        }
      },
      (error) => {
        if (onProgress) {
          onProgress({
            progress: 0,
            status: 'error',
            error
          });
        }
        reject(error);
      },
      async () => {
        // Upload completed successfully
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        if (onProgress) {
          onProgress({
            progress: 100,
            status: 'completed',
            downloadURL
          });
        }
        resolve(path); // Return path instead of URL for temp files
      }
    );
  });
};

// Delete temporary file
export const deleteTempFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
};