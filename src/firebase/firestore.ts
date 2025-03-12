// src/firebase/firestore.ts
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  CollectionReference,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile, UserRole } from './auth';

// Check if we're running on the server
const isServer = typeof window === 'undefined';

// Organization Types
export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    current_period_end?: Date;
  };
  settings: {
    aiFeatures: boolean;
    maxProjects: number;
    maxUsers: number;
    maxStorage: number; // in GB
  };
}

export interface OrganizationMember {
  userId: string;
  role: UserRole;
  displayName: string;
  email: string;
  photoURL?: string;
  joinedAt: Date;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'completed';
  members: Record<string, 'owner' | 'editor' | 'viewer'>;
  tags: string[];
}

// Document Types
export interface Document {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  projectId: string;
  organizationId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  extractedText?: string;
  embeddings?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    completed?: boolean;
    chunksCount?: number;
  };
  folder?: string;
  tags: string[];
  version: number;
  versions?: {
    version: number;
    updatedAt: Date;
    updatedBy: string;
    filePath: string;
    fileSize: number;
  }[];
}

// Research Types
export interface ResearchRequest {
  id: string;
  title: string;
  description: string;
  projectId: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'failed';
  parameters: {
    topics: string[];
    questions: string[];
    sources: {
      type: 'web' | 'document' | 'specific_url';
      value: string;
    }[];
    output_format: 'report' | 'bullet_points' | 'presentation';
    due_date?: Date;
    priority: 'low' | 'medium' | 'high';
  };
  findings?: {
    content: string;
    sources: string[];
    createdAt: Date;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keywords?: string[];
  };
  reviews: {
    userId: string;
    comment: string;
    status: 'approved' | 'needs_revision';
    createdAt: Date;
  }[];
}

// Insight Types
export interface Insight {
  id: string;
  title: string;
  content: string;
  projectId: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  tags: string[];
  source: {
    type: 'research' | 'document' | 'manual';
    id?: string;
  };
  validationStatus: 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  validatedAt?: Date;
  comments: {
    userId: string;
    text: string;
    createdAt: Date;
  }[];
}

// Helper function to convert Firestore timestamps to JS dates
const convertTimestamps = <T extends Record<string, any>>(data: T): T => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    // Check if the property is a Timestamp
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
    // Check if the property is an object and not null
    else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });
  return result;
};

// Organizations
export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  const docRef = doc(db, 'organizations', orgId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<Organization, 'id'>)
  };
};

export const createOrganization = async (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  // Ensure logoUrl is null instead of undefined to avoid Firestore errors
  const orgData = {
    ...data,
    logoUrl: data.logoUrl || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, 'organizations'), orgData);
  
  return docRef.id;
};

export const updateOrganization = async (orgId: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await updateDoc(doc(db, 'organizations', orgId), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  const membersCollection = collection(db, 'organizations', orgId, 'members');
  const querySnap = await getDocs(membersCollection);
  
  return querySnap.docs.map(doc => ({
    userId: doc.id,
    ...convertTimestamps(doc.data() as Omit<OrganizationMember, 'userId'>)
  }));
};

export const addOrganizationMember = async (
  orgId: string, 
  userId: string, 
  data: Omit<OrganizationMember, 'userId' | 'joinedAt'>
): Promise<void> => {
  await setDoc(doc(db, 'organizations', orgId, 'members', userId), {
    ...data,
    joinedAt: serverTimestamp()
  });
};

export const updateOrganizationMember = async (
  orgId: string,
  userId: string,
  data: Partial<Omit<OrganizationMember, 'userId' | 'joinedAt'>>
): Promise<void> => {
  await updateDoc(doc(db, 'organizations', orgId, 'members', userId), data);
};

export const removeOrganizationMember = async (orgId: string, userId: string): Promise<void> => {
  await deleteDoc(doc(db, 'organizations', orgId, 'members', userId));
};

// Projects
export const getProject = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<Project, 'id'>)
  };
};

export const getOrganizationProjects = async (orgId: string): Promise<Project[]> => {
  const q = query(
    collection(db, 'projects'),
    where('organizationId', '==', orgId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnap = await getDocs(q);
  
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Project, 'id'>)
  }));
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  // Server-side safety check
  if (isServer || !db) {
    console.warn('Firestore not available during SSR, returning empty projects array');
    return [];
  }
  
  try {
    // Get projects where the user is a member
    const q = query(
      collection(db, 'projects'),
      where(`members.${userId}`, 'in', ['owner', 'editor', 'viewer']),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnap = await getDocs(q);
    
    return querySnap.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data() as Omit<Project, 'id'>)
    }));
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
};

export const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  // Clean project data to ensure all optional fields that might be undefined are set to null
  const projectData = {
    ...data,
    logoUrl: data.logoUrl || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, 'projects'), projectData);
  
  return docRef.id;
};

export const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await updateDoc(doc(db, 'projects', projectId), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await deleteDoc(doc(db, 'projects', projectId));
};

// Documents
export const getDocument = async (documentId: string): Promise<Document | null> => {
  const docRef = doc(db, 'documents', documentId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<Document, 'id'>)
  };
};

export const getProjectDocuments = async (projectId: string): Promise<Document[]> => {
  const q = query(
    collection(db, 'documents'),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnap = await getDocs(q);
  
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Document, 'id'>)
  }));
};

export const createDocument = async (data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'documents'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return docRef.id;
};

export const updateDocument = async (documentId: string, data: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await updateDoc(doc(db, 'documents', documentId), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'documents', documentId));
};

// Research
export const getResearchRequest = async (requestId: string): Promise<ResearchRequest | null> => {
  const docRef = doc(db, 'research', requestId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<ResearchRequest, 'id'>)
  };
};

export const getProjectResearch = async (projectId: string): Promise<ResearchRequest[]> => {
  const q = query(
    collection(db, 'research'),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnap = await getDocs(q);
  
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<ResearchRequest, 'id'>)
  }));
};

export const createResearchRequest = async (data: Omit<ResearchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  // Server-side safety check
  if (isServer || !db) {
    throw new Error('Firestore not available during SSR');
  }
  
  const docRef = await addDoc(collection(db, 'research'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return docRef.id;
};

export const updateResearchRequest = async (requestId: string, data: Partial<Omit<ResearchRequest, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await updateDoc(doc(db, 'research', requestId), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteResearchRequest = async (requestId: string): Promise<void> => {
  await deleteDoc(doc(db, 'research', requestId));
};

// Insights
export const getInsight = async (insightId: string): Promise<Insight | null> => {
  const docRef = doc(db, 'insights', insightId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<Insight, 'id'>)
  };
};

export const getProjectInsights = async (projectId: string): Promise<Insight[]> => {
  const q = query(
    collection(db, 'insights'),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnap = await getDocs(q);
  
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Insight, 'id'>)
  }));
};

export const createInsight = async (data: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'insights'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return docRef.id;
};

export const updateInsight = async (insightId: string, data: Partial<Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await updateDoc(doc(db, 'insights', insightId), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteInsight = async (insightId: string): Promise<void> => {
  await deleteDoc(doc(db, 'insights', insightId));
};