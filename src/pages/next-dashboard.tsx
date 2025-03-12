import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useNextAuth } from '@/hooks/useNextAuth';

export default function NextDashboard() {
  const { userProfile, loading, error, session, logout, refreshUserProfile } = useNextAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Protected route - redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/signin');
    }
  }, [session, loading, router]);
  
  // Fetch data once authenticated and profile loaded
  useEffect(() => {
    if (userProfile?.organizationId) {
      // In a real implementation, we would fetch:
      // - Organization details
      // - Projects for this organization
      // - Recent activity
      // - etc.
      
      // For now, we'll just simulate some data
      setOrganizations([
        {
          id: userProfile.organizationId,
          name: 'My Organization',
          role: 'Admin'
        }
      ]);
      
      setProjects([
        {
          id: 'proj_1',
          name: 'Website Redesign',
          client: 'Acme Co',
          status: 'active',
          lastUpdated: new Date().toLocaleString()
        },
        {
          id: 'proj_2',
          name: 'Marketing Campaign',
          client: 'TechStart',
          status: 'active',
          lastUpdated: new Date().toLocaleString()
        }
      ]);
    }
  }, [userProfile]);
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard - Agency Strategy</title>
      </Head>
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userProfile?.displayName || session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => logout()}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* Error message (if any) */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    <button 
                      onClick={refreshUserProfile}
                      className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* User profile info */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h2>
              {userProfile ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p>{userProfile.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{userProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="capitalize">{userProfile.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Organization ID</p>
                    <p>{userProfile.organizationId || 'None'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Profile not loaded</p>
              )}
            </div>
          </div>
          
          {/* Organizations */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Your Organizations</h2>
              </div>
              
              {organizations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {organizations.map((org) => (
                        <tr key={org.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{org.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{org.id}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{org.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No organizations found</p>
              )}
            </div>
          </div>
          
          {/* Projects */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
                <Link href="/next-project-simple" className="text-sm text-blue-600 hover:text-blue-500">
                  Create Project
                </Link>
              </div>
              
              {projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            <Link href={`/next-project/${project.id}`} className="text-blue-600 hover:text-blue-900">
                              {project.name}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{project.client}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{project.status}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{project.lastUpdated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No projects found</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}