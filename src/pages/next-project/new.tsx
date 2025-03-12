import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useNextAuth } from '@/hooks/useNextAuth';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewProject() {
  const { userProfile, loading, error, session } = useNextAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Firebase configuration from environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
  
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
      // Initialize Firebase
      const app = initializeApp(firebaseConfig, 'newProject');
      const db = getFirestore(app);
      
      // Process tags
      const tagsList = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      // Create project
      const projectsRef = collection(db, 'projects');
      const projectDoc = await addDoc(projectsRef, {
        name,
        description,
        client,
        organizationId: userProfile.organizationId,
        createdBy: userProfile.uid,
        status,
        members: {
          [userProfile.uid]: 'owner'
        },
        tags: tagsList,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Redirect to project page or dashboard
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
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Project</h1>
            <Link href="/next-dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Error message */}
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
            
            {/* Form */}
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
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (comma separated)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="tags"
                    id="tags"
                    placeholder="e.g. social, branding, digital"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Optional. Add tags to help organize and find projects later.
                </p>
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