import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { palette } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useSessionStore } from '../../state/useSessionStore';

export default function SignInScreen() {
  const setStatus = useSessionStore((state) => state.setStatus);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!trimmedEmail) {
      setError('Enter your email to continue.');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      setError('Enter a password with at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'sign-up') {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signUpError) {
          throw signUpError;
        }
        if (data.session) {
          setStatus('loading');
          setStatusMessage('Account created. Signing you in…');
        } else {
          setStatusMessage('Account created. Please confirm your email, then sign in.');
          setMode('sign-in');
          setPassword('');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signInError) {
          throw signInError;
        }
        setStatus('loading');
        setStatusMessage('Signing you in…');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'sign-in' ? 'sign-up' : 'sign-in'));
    setStatusMessage(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Sign in to Purpose' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={64}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Access Purpose</Text>
          <Text style={styles.subtitle}>
            {mode === 'sign-in'
              ? 'Enter your email and password to continue your coaching journey.'
              : 'Create your Purpose account with an email and password. You can always update details later.'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={palette.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
          />
          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonLabel}>
              {isSubmitting ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMode} disabled={isSubmitting} activeOpacity={0.75}>
            <Text style={styles.switchLabel}>
              {mode === 'sign-in' ? "Need an account? Sign up instead." : 'Already have an account? Sign in.'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  keyboardAvoiding: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 16,
    shadowColor: '#121212',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.textPrimary,
    fontSize: 16,
  },
  status: {
    color: palette.textMuted,
    fontSize: 12,
  },
  error: {
    color: palette.error,
    fontSize: 12,
  },
  button: {
    backgroundColor: palette.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    color: palette.textInverted,
    fontWeight: '600',
    fontSize: 16,
  },
  switchLabel: {
    marginTop: 8,
    color: palette.accent,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
