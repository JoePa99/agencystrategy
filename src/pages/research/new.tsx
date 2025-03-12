// src/pages/research/new.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ResearchRequestForm from '@/components/research/ResearchRequestForm';
import { getUserProjects, Project } from '@/firebase/firestore';

export default function NewResearchPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
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
        setError('Failed to load projects');
      }
    };
    
    if (userProfile) {
      fetchProjects();
    }
  }, [userProfile, router.query]);
  
  const handleRequestCreated = (researchId: string) => {
    // Redirect to research details page
    router.push(`/research/${researchId}`);
  };
  
  const handleError = (error: Error) => {
    setError(error.message);
  };
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <DashboardLayout title="New Research Request">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        {projects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No projects found</h3>
            <p className="text-sm text-neutral-500 mb-4">
              You need to create a project before you can create research requests.
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
              <div className="mb-6">
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
                <ResearchRequestForm
                  projectId={selectedProjectId}
                  onRequestCreated={handleRequestCreated}
                  onError={handleError}
                />
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/research')}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}