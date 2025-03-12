import * as auth from 'firebase/auth';

declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    isAnonymous: boolean;
    tenantId: string | null;
    providerData: auth.UserInfo[];
    metadata: {
      creationTime: string;
      lastSignInTime: string;
    };
  }
}

declare module '@firebase/auth-types' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    isAnonymous: boolean;
    tenantId: string | null;
    providerData: auth.UserInfo[];
    metadata: {
      creationTime: string;
      lastSignInTime: string;
    };
  }
}