// src/pages/projects/new.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createProject } from '@/firebase/firestore';

interface FormValues {
  name: string;
  description: string;
  client: string;
  status: 'active' | 'archived' | 'completed';
  tags: string;
}

export default function NewProjectPage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      status: 'active',
      tags: '',
    }
  });
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
    
    // Refresh user profile when component mounts to ensure we have the latest data
    if (user) {
      refreshUserProfile(); 
    }
  }, [user, loading, router]);
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Refresh user profile before proceeding
      await refreshUserProfile();
      
      // Check for userProfile
      if (!userProfile) {
        console.error('User profile is null');
        setError('User profile not loaded. Please refresh the page and try again.');
        return;
      }
      
      // Check for organizationId with better logging
      if (!userProfile.organizationId) {
        console.error('Organization ID is missing from user profile', userProfile);
        setError('Your account is not associated with an organization. Please visit /debug-profile to fix this issue.');
        return;
      }
      
      // Log the organization ID being used
      console.log('Creating project with organization ID:', userProfile.organizationId);
      
      // Process tags
      const tagsList = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      console.log('Creating project with data:', {
        name: data.name,
        description: data.description,
        client: data.client,
        organizationId: userProfile.organizationId,
        createdBy: userProfile.uid,
        status: data.status,
        members: {
          [userProfile.uid]: 'owner'
        },
        tags: tagsList
      });
      
      // Create project
      const projectId = await createProject({
        name: data.name,
        description: data.description,
        client: data.client,
        organizationId: userProfile.organizationId,
        createdBy: userProfile.uid,
        status: data.status as 'active' | 'archived' | 'completed',
        members: {
          [userProfile.uid]: 'owner'
        },
        tags: tagsList
      });
      
      console.log('Project created successfully with ID:', projectId);
      
      // Redirect to project page
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project. Please check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <DashboardLayout title="Create New Project">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                Project name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  className="input-field"
                  {...register('name', {
                    required: 'Project name is required'
                  })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-neutral-700">
                Client
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="client"
                  className="input-field"
                  {...register('client', {
                    required: 'Client name is required'
                  })}
                />
                {errors.client && (
                  <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
                Project description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={3}
                  className="input-field"
                  {...register('description', {
                    required: 'Description is required'
                  })}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  className="input-field"
                  {...register('status')}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-neutral-700">
                Tags (comma separated)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="tags"
                  className="input-field"
                  placeholder="e.g. social, branding, digital"
                  {...register('tags')}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Optional. Add tags to help organize and find projects later.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="mr-3 inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}