import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { auth, db } from '@/firebase/config-fix';

export default function FixedDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserProfile(currentUser.uid);
      } else {
        setLoading(false);
        router.push('/fixed-auth');
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        
        // Fetch organization
        if (profileData.organizationId) {
          fetchOrganization(profileData.organizationId);
          fetchProjects(profileData.organizationId);
        } else {
          setLoading(false);
          setError('No organization associated with your account');
        }
      } else {
        setLoading(false);
        setError('User profile not found');
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setLoading(false);
      setError('Failed to load profile: ' + err.message);
    }
  };
  
  const fetchOrganization = async (orgId: string) => {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      
      if (orgDoc.exists()) {
        setOrganization(orgDoc.data());
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
    }
  };
  
  const fetchProjects = async (orgId: string) => {
    try {
      const q = query(
        collection(db, 'projects'),
        where('organizationId', '==', orgId)
      );
      
      const querySnapshot = await getDocs(q);
      const projectsList: any[] = [];
      
      querySnapshot.forEach((doc) => {
        projectsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setProjects(projectsList);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setLoading(false);
      setError('Failed to load projects: ' + err.message);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/fixed-auth');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError('Failed to sign out: ' + err.message);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading Dashboard...</h2>
          <p className="mt-2 text-gray-600">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Not Authenticated</h2>
          <p className="mt-2 text-gray-600">Please sign in to access the dashboard</p>
          <Link href="/fixed-auth" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard - Fixed Implementation</title>
      </Head>
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Fixed Dashboard
          </h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {userProfile?.displayName || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* User Profile */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                User Profile
              </h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userProfile?.displayName || 'Not available'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userProfile?.email || user?.email || 'Not available'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                    {userProfile?.role || 'Not assigned'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {organization?.name || 'Not available'} (ID: {userProfile?.organizationId || 'None'})
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Projects Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Projects
              </h2>
              <Link 
                href="/fixed-project-new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New Project
              </Link>
            </div>
            
            <div className="border-t border-gray-200">
              {projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{project.client}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No projects found. Click "New Project" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}