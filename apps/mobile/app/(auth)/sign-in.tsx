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

const introCopy = {
  "sign-in": {
    title: "Welcome back to Purpose",
    subtitle:
      "Pick up where you left off. Fermi still remembers the patterns you noticed last time.",
    cta: "Sign in",
    helper: "Need an account? Sign up instead.",
  },
  "sign-up": {
    title: "Begin your Purpose journey",
    subtitle:
      "Your values, constraints, and patterns stay private. Fermi uses them to deliver radical clarity.",
    cta: "Create account",
    helper: "Already have an account? Sign in.",
  },
} as const;

export default function SignInScreen() {
  const setStatus = useSessionStore((state) => state.setStatus);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = introCopy[mode];

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
            "Account created. Confirm the email we just sent, then sign in.",
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
      <Stack.Screen options={{ title: "Access Purpose" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={64}
        style={styles.keyboardAvoiding}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{copy.title}</Text>
          <Text style={styles.heroSubtitle}>{copy.subtitle}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metaLabel}>
            {mode === "sign-in" ? "Continue" : "Create account"}
          </Text>
          <View style={styles.inputColumn}>
            <Text style={styles.inputLabel}>Email</Text>
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
          </View>
          <View style={styles.inputColumn}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={palette.textMuted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>
          <View style={styles.trustCallout}>
            <Text style={styles.trustTitle}>Your data, your control</Text>
            <Text style={styles.trustCopy}>
              Purpose is coaching, not therapy. You can export or delete your
              data anytime.
            </Text>
          </View>
          {statusMessage ? (
            <Text style={styles.status}>{statusMessage}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={[
              styles.button,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonLabel}>
              {isSubmitting ? "Working…" : copy.cta}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={isSubmitting}
            onPress={toggleMode}
          >
            <Text style={styles.switchLabel}>{copy.helper}</Text>
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
    paddingHorizontal: 24,
    gap: 20,
  },
  heroCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surfaceElevated,
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 10,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.surface,
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  metaLabel: {
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1.2,
    color: palette.textMuted,
    fontWeight: "600",
  },
  inputColumn: {
    gap: 8,
  },
  inputLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.textPrimary,
    fontSize: 16,
    backgroundColor: palette.surface,
  },
  trustCallout: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surfaceElevated,
    padding: 16,
    gap: 6,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.accent,
  },
  trustCopy: {
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 18,
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
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: palette.accent,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: palette.textInverted,
    fontWeight: "600",
    fontSize: 16,
  },
  switchLabel: {
    marginTop: 4,
    color: palette.accent,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
