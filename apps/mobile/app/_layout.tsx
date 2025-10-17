import { ReactNode, useEffect } from 'react';
import { Stack } from 'expo-router';
import { setApiBaseUrl } from '@purpose/api-client';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../state/useSessionStore';
import { palette } from '../theme';

const env = ((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env) ?? {};
const isDev = __DEV__;
const API_BASE_URL = isDev
  ? (env.EXPO_PUBLIC_API_BASE_URL_DEV ?? 'http://localhost:3000')
  : (env.EXPO_PUBLIC_API_BASE_URL_PROD ?? 'https://codex-mvp-test-8gl8n4uly-connor-hollys-projects.vercel.app');

function SessionProvider({ children }: { children: ReactNode }) {
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setStatus = useSessionStore((state) => state.setStatus);

  useEffect(() => {
    setApiBaseUrl(API_BASE_URL);
    setStatus('loading');

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
      })
      .catch((error) => {
        console.error('Failed to hydrate existing session', error);
        clearSession();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      subscription.unsubscribe();
    };
  }, [clearSession, setSession, setStatus]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.primaryBackground },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: palette.primaryBackground },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ title: 'Subscription required', presentation: 'modal' }} />
      </Stack>
    </SessionProvider>
  );
}
