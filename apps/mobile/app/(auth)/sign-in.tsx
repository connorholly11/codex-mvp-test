import { Stack } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { animateLayout } from "../../lib/animation";
import {
  hapticImpactMedium,
  hapticNotificationError,
  hapticNotificationSuccess,
  hapticSelection,
} from "../../lib/haptics";
import { supabase } from "../../lib/supabase";
import { useSessionStore } from "../../state/useSessionStore";
import { palette } from "../../theme";

export default function SignInScreen() {
  const setStatus = useSessionStore((state) => state.setStatus);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!trimmedEmail) {
      hapticNotificationError();
      setError("Enter your email to continue.");
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      hapticNotificationError();
      setError("Enter a password with at least 6 characters.");
      return;
    }

    hapticImpactMedium();
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === "sign-up") {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signUpError) {
          throw signUpError;
        }
        if (data.session) {
          setStatus("loading");
          setStatusMessage("Account created. Signing you in…");
          hapticNotificationSuccess();
        } else {
          setStatusMessage(
            "Account created. Please confirm your email, then sign in.",
          );
          setMode("sign-in");
          setPassword("");
          hapticNotificationSuccess();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signInError) {
          throw signInError;
        }
        setStatus("loading");
        setStatusMessage("Signing you in…");
        hapticNotificationSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to authenticate. Please try again.",
      );
      hapticNotificationError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    animateLayout();
    hapticSelection();
    setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
    setStatusMessage(null);
    setError(null);
    setPassword("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Sign in to Purpose" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={64}
        style={styles.keyboardAvoiding}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Access Purpose</Text>
          <Text style={styles.subtitle}>
            {mode === "sign-in"
              ? "Enter your email and password to continue your coaching journey."
              : "Create your Purpose account with an email and password. You can always update details later."}
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {statusMessage ? (
            <Text style={styles.status}>{statusMessage}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>
              {isSubmitting
                ? "Working..."
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={isSubmitting}
            onPress={toggleMode}
          >
            <Text style={styles.switchLabel}>
              {mode === "sign-in"
                ? "Need an account? Sign up instead."
                : "Already have an account? Sign in."}
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
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: palette.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 16,
    shadowColor: "#121212",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "700",
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
    alignItems: "center",
  },
  buttonLabel: {
    color: palette.textInverted,
    fontWeight: "600",
    fontSize: 16,
  },
  switchLabel: {
    marginTop: 8,
    color: palette.accent,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
