// src/pages/projects/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUserProjects, Project } from '@/firebase/firestore';
import { PlusIcon, FolderIcon, TagIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function ProjectsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userProfile) {
      fetchProjects();
    }
  }, [userProfile]);
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <DashboardLayout title="Projects">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium text-neutral-900">Your projects</h2>
            <p className="mt-1 text-sm text-neutral-500">Manage and organize all your client projects</p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Project
          </Link>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-lg font-medium text-neutral-900">No projects yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Get started by creating a new project.</p>
            <div className="mt-6">
              <Link
                href="/projects/new"
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FolderIcon className="h-6 w-6 text-primary-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-neutral-900 truncate">{project.name}</h3>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : project.status === 'archived' 
                        ? 'bg-neutral-100 text-neutral-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="flex items-center text-sm text-neutral-500">
                    <TagIcon className="flex-shrink-0 mr-1 h-4 w-4" />
                    <span>Client: {project.client}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-neutral-500">
                    <UserGroupIcon className="flex-shrink-0 mr-1 h-4 w-4" />
                    <span>{Object.keys(project.members).length} members</span>
                  </div>
                  
                  <div className="mt-2 text-xs text-neutral-400">
                    Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
                  <div className="flex space-x-3">
                    <span className="inline-flex items-center text-xs text-neutral-500">
                      <svg className="mr-1 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Documents
                    </span>
                    <span className="inline-flex items-center text-xs text-neutral-500">
                      <svg className="mr-1 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      Research
                    </span>
                  </div>
                  <span className="text-sm text-primary-600">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}