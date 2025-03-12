import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useNextAuth } from '@/hooks/useNextAuth';
import { createProject } from '@/firebase/firestore';

export default function NewProjectSimple() {
  const { userProfile, loading, error, session } = useNextAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !client || !description) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Make sure we have user profile and organization ID
    if (!userProfile || !userProfile.organizationId) {
      setFormError('Your account is not associated with an organization');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      await createProject({
        name,
        description,
        client,
        organizationId: userProfile.organizationId,
        createdBy: userProfile.uid,
        status: 'active',
        members: {
          [userProfile.uid]: 'owner'
        },
        tags: []
      });
      
      // Redirect to dashboard
      router.push('/next-dashboard');
    } catch (err: any) {
      console.error('Error creating project:', err);
      setFormError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!session) {
    router.push('/auth/signin');
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Create New Project - Agency Strategy</title>
      </Head>
      
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Project (Simple)</h1>
            <Link href="/next-dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {(error || formError) && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {formError || error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                  Client <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="client"
                    id="client"
                    required
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <Link
                    href="/next-dashboard"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}