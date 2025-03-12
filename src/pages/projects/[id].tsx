// src/pages/projects/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getProject, Project, getProjectDocuments, Document, getProjectResearch, ResearchRequest } from '@/firebase/firestore';
import { 
  DocumentTextIcon, 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  TagIcon,
  PencilIcon,
  CalendarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProjectDetailsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [research, setResearch] = useState<ResearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        setIsLoading(true);
        
        // Fetch project details
        const projectData = await getProject(id);
        if (!projectData) {
          setError('Project not found');
          return;
        }
        
        setProject(projectData);
        
        // Fetch project documents
        const projectDocuments = await getProjectDocuments(id);
        setDocuments(projectDocuments);
        
        // Fetch project research
        const projectResearch = await getProjectResearch(id);
        setResearch(projectResearch);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchProjectData();
    }
  }, [id]);
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (isLoading) {
    return (
      <DashboardLayout title="Project Details">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="ml-2 text-sm text-neutral-500">Loading project...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !project) {
    return (
      <DashboardLayout title="Project Details">
        <div className="bg-white shadow rounded-lg p-6 text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">{error || 'Project not found'}</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Unable to load project details.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={project.name}>
      <div className="max-w-7xl mx-auto">
        {/* Project header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:space-x-5">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-700">{project.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 text-center sm:text-left">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{project.name}</h1>
                  <span className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : project.status === 'archived' 
                      ? 'bg-neutral-100 text-neutral-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-neutral-600 mt-1">Client: {project.client}</p>
                <div className="mt-2 flex items-center text-sm text-neutral-500">
                  <CalendarIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-center sm:mt-0">
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="-ml-1 mr-2 h-4 w-4" />
                Edit project
              </Link>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-sm text-neutral-700">
              <h3 className="font-medium text-neutral-900">Description</h3>
              <p className="mt-1">{project.description}</p>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Team members</h3>
                <div className="flex items-center mt-2">
                  <UserGroupIcon className="h-5 w-5 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-900">{Object.keys(project.members).length} members</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Documents</h3>
                <div className="flex items-center mt-2">
                  <DocumentTextIcon className="h-5 w-5 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-900">{documents.length} documents</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Tags</h3>
                <div className="flex flex-wrap items-center mt-2">
                  <TagIcon className="h-5 w-5 text-neutral-400 mr-2" />
                  {project.tags && project.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs for documents, research, and insights */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Tab.Group>
            <Tab.List className="flex bg-neutral-50 border-b border-neutral-200">
              <Tab className={({ selected }) =>
                classNames(
                  'py-4 px-6 text-sm font-medium focus:outline-none',
                  selected
                    ? 'text-primary-700 border-b-2 border-primary-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )
              }>
                Documents
              </Tab>
              <Tab className={({ selected }) =>
                classNames(
                  'py-4 px-6 text-sm font-medium focus:outline-none',
                  selected
                    ? 'text-primary-700 border-b-2 border-primary-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )
              }>
                Research
              </Tab>
              <Tab className={({ selected }) =>
                classNames(
                  'py-4 px-6 text-sm font-medium focus:outline-none',
                  selected
                    ? 'text-primary-700 border-b-2 border-primary-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )
              }>
                Insights
              </Tab>
            </Tab.List>
            <Tab.Panels>
              {/* Documents panel */}
              <Tab.Panel className="p-6">
                <div className="sm:flex sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900">Project documents</h3>
                    <p className="mt-1 text-sm text-neutral-500">Upload and manage documents for this project</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Link
                      href={`/documents/upload?projectId=${project.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <DocumentPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Upload document
                    </Link>
                  </div>
                </div>
                
                {documents.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400" />
                    <h3 className="mt-2 text-sm font-medium text-neutral-900">No documents</h3>
                    <p className="mt-1 text-sm text-neutral-500">Get started by uploading a document.</p>
                    <div className="mt-6">
                      <Link
                        href={`/documents/upload?projectId=${project.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <DocumentPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Upload document
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 sm:pl-6">
                            Name
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                            Type
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                            Size
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                            Last updated
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 bg-white">
                        {documents.map((doc) => (
                          <tr key={doc.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="flex items-center">
                                <DocumentTextIcon className="h-5 w-5 text-neutral-400 mr-2" />
                                <div className="font-medium text-neutral-900">{doc.name}</div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                              {doc.fileType.split('/')[1]?.toUpperCase() || doc.fileType}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link href={`/documents/${doc.id}`} className="text-primary-600 hover:text-primary-900">
                                View<span className="sr-only">, {doc.name}</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tab.Panel>
              
              {/* Research panel */}
              <Tab.Panel className="p-6">
                <div className="sm:flex sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900">Project research</h3>
                    <p className="mt-1 text-sm text-neutral-500">Manage research requests and findings for this project</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Link
                      href={`/research/new?projectId=${project.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <MagnifyingGlassIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      New research
                    </Link>
                  </div>
                </div>
                
                {research.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-neutral-400" />
                    <h3 className="mt-2 text-sm font-medium text-neutral-900">No research</h3>
                    <p className="mt-1 text-sm text-neutral-500">Get started by creating a research request.</p>
                    <div className="mt-6">
                      <Link
                        href={`/research/new?projectId=${project.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <MagnifyingGlassIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        New research
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {research.map((item) => (
                      <Link
                        key={item.id}
                        href={`/research/${item.id}`}
                        className="block bg-white border rounded-lg shadow-sm hover:shadow transition-shadow overflow-hidden"
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-medium text-neutral-900 truncate">{item.title}</h3>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : item.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : item.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-neutral-500 line-clamp-2">{item.description}</p>
                          <div className="mt-3 flex items-center text-sm text-neutral-500">
                            <CalendarIcon className="flex-shrink-0 mr-1 h-4 w-4 text-neutral-400" />
                            <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="bg-neutral-50 px-4 py-3 text-right">
                          <span className="text-sm font-medium text-primary-600">View details →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Tab.Panel>
              
              {/* Insights panel */}
              <Tab.Panel className="p-6">
                <div className="sm:flex sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900">Project insights</h3>
                    <p className="mt-1 text-sm text-neutral-500">Discover and manage strategic insights for this project</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Link
                      href={`/insights/new?projectId=${project.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <LightBulbIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      New insight
                    </Link>
                  </div>
                </div>
                
                <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
                  <LightBulbIcon className="mx-auto h-12 w-12 text-neutral-400" />
                  <h3 className="mt-2 text-sm font-medium text-neutral-900">No insights yet</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Insights will be generated automatically from your research and documents.
                  </p>
                  <div className="mt-6">
                    <Link
                      href={`/insights/new?projectId=${project.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <LightBulbIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Create insight manually
                    </Link>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </DashboardLayout>
  );
}