import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Get Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Ensure Firebase is initialized only when needed
const initFirebase = () => {
  try {
    const app = initializeApp(firebaseConfig, 'nextauth');
    return app;
  } catch (error) {
    console.error("Firebase initialization error", error);
    return null;
  }
};

// Function to ensure user exists in Firestore
async function ensureUserInFirestore(userId: string, userData: any) {
  try {
    const app = initFirebase();
    if (!app) return false;
    
    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    
    // Check if user already exists
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userRef, {
        uid: userId,
        email: userData.email,
        displayName: userData.name || userData.email?.split('@')[0] || 'User',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        role: 'admin'
      });
      
      console.log('Created new user document in Firestore');
      
      // Check if user has any organizations
      // If not, we could create one here or redirect to organization creation
      
      return true;
    } else {
      // Update last login time
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      console.log('Updated existing user document in Firestore');
      return true;
    }
  } catch (error) {
    console.error('Error ensuring user in Firestore:', error);
    return false;
  }
}

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        
        try {
          // Authenticate with Firebase
          const app = initFirebase();
          if (!app) throw new Error('Could not initialize Firebase');
          
          const auth = getAuth(app);
          const result = await signInWithEmailAndPassword(
            auth, 
            credentials.email, 
            credentials.password
          );
          
          const user = result.user;
          
          // Create a user object that NextAuth can use
          const nextAuthUser = {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || undefined,
            image: user.photoURL || undefined
          };
          
          // Ensure user exists in Firestore
          await ensureUserInFirestore(user.uid, nextAuthUser);
          
          return nextAuthUser;
        } catch (error: any) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        
        // Ensure user exists in Firestore
        await ensureUserInFirestore(user.id, user);
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  debug: true, // Set to false in production
});