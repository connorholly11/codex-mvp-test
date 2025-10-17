import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { palette } from '../theme';
import { useSessionStore } from '../state/useSessionStore';
import { useSubscriptionStore } from '../state/useSubscriptionStore';

export default function EntryPoint() {
  const status = useSessionStore((state) => state.status);
  const onboardingCompletedAt = useSessionStore((state) => state.onboardingCompletedAt);
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const hasAccess = useSubscriptionStore((state) => state.hasAccess);
  const isSubscriptionLoading = useSubscriptionStore((state) => state.isLoading);

  useEffect(() => {
    void initializeSubscriptions();
  }, [initializeSubscriptions]);

  if (status === 'loading' || isSubscriptionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!onboardingCompletedAt) {
    return <Redirect href="/onboarding" />;
  }

  if (!hasAccess && subscriptionStatus !== 'unknown') {
    return <Redirect href="/paywall" />;
  }

  return <Redirect href="/(tabs)/chat" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryBackground,
  },
});
