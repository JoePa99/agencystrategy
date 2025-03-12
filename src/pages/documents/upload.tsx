// src/pages/documents/upload.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { getUserProjects, Project } from '@/firebase/firestore';

export default function UploadDocumentsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!userProfile) return;
      
      try {
        const userProjects = await getUserProjects(userProfile.uid);
        setProjects(userProjects);
        
        // Set selected project from query params if available
        const { projectId } = router.query;
        if (projectId && typeof projectId === 'string') {
          setSelectedProjectId(projectId);
        } else if (userProjects.length > 0) {
          setSelectedProjectId(userProjects[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    
    if (userProfile) {
      fetchProjects();
    }
  }, [userProfile, router.query]);
  
  const handleUploadComplete = (documentId: string) => {
    setUploadSuccess(true);
    setUploadError(null);
    
    // Reset success message after 5 seconds
    setTimeout(() => {
      setUploadSuccess(false);
    }, 5000);
  };
  
  const handleUploadError = (error: Error) => {
    setUploadError(error.message);
    setUploadSuccess(false);
  };
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <DashboardLayout title="Upload Documents">
      <div className="max-w-3xl mx-auto">
        {projects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No projects found</h3>
            <p className="text-sm text-neutral-500 mb-4">
              You need to create a project before you can upload documents.
            </p>
            <button
              type="button"
              onClick={() => router.push('/projects/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create a project
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="project" className="block text-sm font-medium text-neutral-700">
                    Select project
                  </label>
                  <select
                    id="project"
                    name="project"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedProjectId && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-2">
                      Upload documents for the selected project. The files will be processed to extract text and enable AI-powered search and analysis.
                    </p>
                    
                    {uploadSuccess && (
                      <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
                        <p className="text-sm text-green-700">
                          Document uploaded successfully!
                        </p>
                      </div>
                    )}
                    
                    {uploadError && (
                      <div className="mb-4 p-3 bg-red-50 rounded-md border border-red-200">
                        <p className="text-sm text-red-700">
                          Error uploading document: {uploadError}
                        </p>
                      </div>
                    )}
                    
                    <DocumentUpload 
                      projectId={selectedProjectId} 
                      onUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/documents')}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => router.push(`/projects/${selectedProjectId}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to project
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}