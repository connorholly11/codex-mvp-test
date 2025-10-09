import { ReactNode, useEffect } from 'react';
import { Stack } from 'expo-router';
import { setApiBaseUrl } from '@purpose/api-client';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../state/useSessionStore';

const env = ((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env) ?? {};
const isDev = __DEV__;
const API_BASE_URL = isDev
  ? (env.EXPO_PUBLIC_API_BASE_URL_DEV ?? 'http://localhost:3000')
  : (env.EXPO_PUBLIC_API_BASE_URL_PROD ?? 'https://codex-mvp-test-8gl8n4uly-connor-hollys-projects.vercel.app');

function SessionProvider({ children }: { children: ReactNode }) {
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    setApiBaseUrl(API_BASE_URL);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const session = data.session;
        if (session?.access_token && session.user) {
          setSession({
            accessToken: session.access_token,
            userId: session.user.id,
            email: session.user.email ?? null,
            displayName: (session.user.user_metadata?.full_name as string | null) ?? null,
          });
        } else {
          clearSession();
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.user) {
        setSession({
          accessToken: session.access_token,
          userId: session.user.id,
          email: session.user.email ?? null,
          displayName: (session.user.user_metadata?.full_name as string | null) ?? null,
        });
      } else {
        clearSession();
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [clearSession, setSession]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#15161E' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#070609' },
        }}
      />
    </SessionProvider>
  );
}
