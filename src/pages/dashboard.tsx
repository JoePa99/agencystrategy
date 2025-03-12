// src/pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getOrganization } from '@/firebase/firestore';
import { getUserProjects, Project } from '@/firebase/firestore';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [recentResearch, setRecentResearch] = useState<any[]>([]);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile) return;
      
      try {
        // Fetch organization details
        if (userProfile.organizationId) {
          const org = await getOrganization(userProfile.organizationId);
          if (org) {
            setOrganizationName(org.name);
          }
        }
        
        // Fetch user's projects
        const userProjects = await getUserProjects(userProfile.uid);
        setProjects(userProjects);
        
        // For demo purposes, set some sample recent documents and research
        // In a real implementation, you would fetch this data from Firestore
        setRecentDocuments([
          { id: '1', name: 'Client brief', type: 'PDF', updatedAt: new Date(), projectName: 'Summer Campaign' },
          { id: '2', name: 'Market analysis', type: 'DOCX', updatedAt: new Date(), projectName: 'Product Launch' },
          { id: '3', name: 'Competitor research', type: 'PPTX', updatedAt: new Date(), projectName: 'Brand Refresh' }
        ]);
        
        setRecentResearch([
          { id: '1', title: 'Target demographic analysis', status: 'completed', updatedAt: new Date(), projectName: 'Summer Campaign' },
          { id: '2', name: 'Market trends 2025', status: 'in_progress', updatedAt: new Date(), projectName: 'Product Launch' }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome message */}
          <div className="card bg-gradient-to-r from-primary-700 to-primary-500 text-white">
            <h2 className="text-xl font-semibold">Welcome back, {userProfile?.displayName?.split(' ')[0] || 'User'}</h2>
            <p className="mt-1">Here's what's happening at {organizationName || 'your organization'} today.</p>
          </div>
          
          {/* Quick actions */}
          <div>
            <h2 className="text-lg font-medium mb-3">Quick actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link 
                href="/projects/new" 
                className="flex flex-col items-center justify-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mb-2">
                  <PlusIcon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm text-neutral-900">New Project</span>
              </Link>
              
              <Link 
                href="/documents/upload" 
                className="flex flex-col items-center justify-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mb-2">
                  <DocumentPlusIcon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm text-neutral-900">Upload Document</span>
              </Link>
              
              <Link 
                href="/research/new" 
                className="flex flex-col items-center justify-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mb-2">
                  <MagnifyingGlassIcon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm text-neutral-900">New Research</span>
              </Link>
              
              <Link 
                href="/documents" 
                className="flex flex-col items-center justify-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mb-2">
                  <DocumentDuplicateIcon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm text-neutral-900">All Documents</span>
              </Link>
            </div>
          </div>
          
          {/* Recent documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Recent documents</h2>
              <Link href="/documents" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                      Project
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                      Last updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {recentDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-neutral-400 mr-2" />
                          <div className="font-medium text-neutral-900">{doc.name}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                        {doc.projectName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                        {doc.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                        {doc.updatedAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Projects */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Your projects</h2>
              <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900">{project.name}</h3>
                        <p className="text-xs text-neutral-500 mt-1">{project.client}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700">
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-neutral-500 mb-4">No projects yet</p>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Create your first project
                </Link>
              </div>
            )}
          </div>
          
          {/* Research */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent research</h2>
              <Link href="/research" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            
            {recentResearch.length > 0 ? (
              <div className="divide-y divide-neutral-200">
                {recentResearch.map((research) => (
                  <div key={research.id} className="py-3">
                    <h3 className="text-sm font-medium text-neutral-900">{research.title}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-neutral-500">{research.projectName}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        research.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {research.status === 'completed' ? 'Completed' : 'In progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-neutral-500 mb-4">No research yet</p>
                <Link
                  href="/research/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Create research request
                </Link>
              </div>
            )}
          </div>
          
          {/* AI Assistant */}
          <div className="card bg-accent-50 border border-accent-200">
            <h2 className="text-lg font-medium text-accent-800 mb-3">AI Assistant</h2>
            <p className="text-sm text-accent-700 mb-4">
              Ask questions about your documents or get help with your strategy.
            </p>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Ask something..."
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-accent-600 sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}