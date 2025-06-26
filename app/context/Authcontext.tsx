import AsyncStorage from '@react-native-async-storage/async-storage';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  email?: string;
  fullName?: string;
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  signInWithApple?: () => Promise<void>;  // optional on Android
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Google config (you can remove it entirely if not used at all)
    // GoogleSignin.configure({
    //   webClientId: '733695998872-rje0f6h1s9ifiivisac4j1ofvbt4dl8u.apps.googleusercontent.com',
    //   offlineAccess: true,
    //   forceCodeForRefreshToken: true,
    // });

    const checkSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const fullName = session.user.user_metadata?.full_name;
      const email = session.user.email;

      const newUser: User = { id: session.user.id, email, fullName };
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    }
  }

  setLoading(false);
};


    checkSession();
  }, []);

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      const nonce = Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const idToken = appleCredential.identityToken;
      if (!idToken) throw new Error('No Apple ID token');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
        nonce,
      });

      if (error) throw error;

      const sessionUser = data.user!;
      const fullName =
        appleCredential.fullName
          ? `${appleCredential.fullName.givenName ?? ''} ${appleCredential.fullName.familyName ?? ''}`.trim()
          : sessionUser.user_metadata?.full_name;

      const newUser: User = {
        id: sessionUser.id,
        email: sessionUser.email ?? appleCredential.email ?? undefined,
        fullName,
      };

      await saveUserToSupabase(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      console.error('🍎 Apple Sign-In Error:', err);
    }
  };

  const saveUserToSupabase = async ({ id, email, fullName }: User) => {
    try {
      const { error } = await supabase.from('users').upsert([
        { id, email, full_name: fullName },
      ]);
      if (error) console.error('Supabase upsert error:', error);
    } catch (err) {
      console.error('Supabase user save error:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithApple: Platform.OS === 'ios' ? signInWithApple : undefined,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
