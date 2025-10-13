'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// User interface based on MongoDB schema
interface User {
  _id?: string;
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'owner' | 'admin';
  phone?: string;
  businessName?: string;
  emailVerified: boolean;
  isActive: boolean;
  
  // Admin verification fields (for turf owners)
  isVerifiedByAdmin?: boolean;
  paymentVerified?: boolean;
  paymentDetails?: {
    amount?: number;
    date?: Date;
    transactionId?: string;
    method?: string;
  };
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  // Current Firebase user
  firebaseUser: FirebaseUser | null;
  
  // Current MongoDB user with role info
  user: User | null;
  
  // Loading states
  loading: boolean;
  initialLoading: boolean;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // User data methods
  refreshUserData: () => Promise<void>;
  
  // Utility methods
  isOwner: () => boolean;
  isCustomer: () => boolean;
  isAdmin: () => boolean;
  isEmailVerified: () => boolean;
  isVerifiedOwner: () => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'owner' | 'admin';
  phone?: string;
  businessName?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  // Fetch user data from MongoDB using Firebase UID
  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users?uid=${uid}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('User not found in MongoDB:', uid);
          return null;
        }
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Refresh current user data
  const refreshUserData = async () => {
    if (!firebaseUser) return;
    
    try {
      const userData = await fetchUserData(firebaseUser.uid);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Register new user
  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      // Debug: Check if auth is properly initialized
      console.log('Auth object:', auth);
      console.log('Firebase config check:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
      });

      // Create Firebase user
      console.log('Attempting to create user with email:', userData.email);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      console.log('Firebase user created successfully:', userCredential.user.uid);

      // Update Firebase profile
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create MongoDB user document
      const mongoUser = {
        uid: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        businessName: userData.businessName,
      };

      console.log('Saving user to MongoDB:', mongoUser);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mongoUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user profile');
      }

      console.log('User saved to MongoDB successfully');

      // Show success message or redirect to email verification page
      if (userData.role === 'owner') {
        alert('Registration successful! Please check your email to verify your account. Note: Your account will need to be verified by an administrator before you can list your turf.');
      } else {
        alert('Registration successful! Please check your email to verify your account before logging in.');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // Sign out the user since email is not verified
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your email inbox.');
      }

      // Firebase auth state change will handle the rest
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utility methods
  const isOwner = () => user?.role === 'owner';
  const isCustomer = () => user?.role === 'customer';
  const isAdmin = () => user?.role === 'admin';
  const isEmailVerified = () => firebaseUser?.emailVerified || false;
  const isVerifiedOwner = () => user?.role === 'owner' && user?.isVerifiedByAdmin === true && user?.verificationStatus === 'approved';

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          // User is signed in, fetch MongoDB user data
          const userData = await fetchUserData(firebaseUser.uid);
          setUser(userData);
          
          // Update email verification status in MongoDB if needed
          if (userData && firebaseUser.emailVerified && !userData.emailVerified) {
            await fetch('/api/users', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uid: firebaseUser.uid,
                emailVerified: true,
              }),
            });
            // Refresh user data to reflect the update
            await refreshUserData();
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setInitialLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Redirect based on role after login
  useEffect(() => {
    if (firebaseUser && user && !initialLoading) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on the correct page
      if (currentPath.includes('/auth/')) {
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'owner') {
          router.push('/owner/dashboard');
        } else if (user.role === 'customer') {
          router.push('/dashboard/player');
        } else {
          router.push('/');
        }
      }
    }
  }, [firebaseUser, user, initialLoading, router]);

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    initialLoading,
    login,
    register,
    logout,
    refreshUserData,
    isOwner,
    isCustomer,
    isAdmin,
    isEmailVerified,
    isVerifiedOwner,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};