import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  fulfillmentDomains,
  genderOptions,
  submitOnboarding,
  fetchChatHistory,
  type OnboardingData,
} from '@purpose/api-client';
import { logEvent } from '@purpose/analytics';
import { scheduleDailyQuestReminder } from '../../lib/notifications';
import type { OnboardingPayload } from '@purpose/api-client';
import { palette } from '../../theme';
import { useSessionStore } from '../../state/useSessionStore';

const VALUE_OPTIONS: { value: string; label: string }[] = [
  { value: 'own-time', label: 'Own your time' },
  { value: 'new-experiences', label: 'New experiences' },
  { value: 'fun-pleasure', label: 'Fun & pleasure' },
  { value: 'achieve-success', label: 'Achieve success' },
  { value: 'have-control', label: 'Have control' },
  { value: 'feel-safe', label: 'Feel safe' },
  { value: 'be-liked', label: 'Be liked by others' },
  { value: 'honor-tradition', label: 'Honour tradition' },
  { value: 'generosity', label: 'Generosity' },
  { value: 'equality-inclusion', label: 'Equality & inclusion' },
];

const PERSONALITY_ITEMS: { id: string; prompt: string }[] = [
  { id: 'bfi-1', prompt: 'I see myself as someone who is talkative.' },
  { id: 'bfi-2', prompt: 'I see myself as someone who does a thorough job.' },
  { id: 'bfi-3', prompt: 'I see myself as someone who is dependable and self-disciplined.' },
];

const TOTAL_STEPS = 7;

const initialData: OnboardingData = {
  demographics: {},
  fulfillment: {
    health: 3,
    work: 3,
    confidence: 3,
    relationships: 3,
    social: 3,
  },
  constraint: undefined,
  personality: {
    'bfi-1': 3,
    'bfi-2': 3,
    'bfi-3': 3,
  },
  values: {
    firstRound: [],
    secondRound: [],
    finalRound: [],
  },
  reflections: {
    desire: undefined,
    avoidance: undefined,
  },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const setProfile = useSessionStore((state) => state.setProfile);

  const [step, setStep] = useState(0);

  useEffect(() => {
    logEvent('onboarding_step_viewed', { step });
  }, [step]);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [displayName, setDisplayName] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return true;
    }

    if (step === 4) {
      return data.values.finalRound.length === 3;
    }

    if (step === 6) {
      return displayName.trim().length >= 2 && acceptedLegal;
    }

    return true;
  }, [acceptedLegal, data.values.finalRound.length, displayName, step]);

  const nextStep = () => setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  const previousStep = () => setStep((current) => Math.max(current - 1, 0));

  const handleToggleValue = (value: string) => {
    setData((current) => {
      const alreadySelected = current.values.finalRound.includes(value);
      let next = current.values.finalRound;
      if (alreadySelected) {
        next = current.values.finalRound.filter((item) => item !== value);
      } else if (current.values.finalRound.length < 3) {
        next = [...current.values.finalRound, value];
      }
      return {
        ...current,
        values: {
          firstRound: next,
          secondRound: next,
          finalRound: next,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      Alert.alert('Not signed in', 'Please sign in before completing onboarding.');
      return;
    }

    const payload: OnboardingPayload = {
      onboarding: data,
      profile: {
        displayName: displayName.trim(),
        legalAcceptedAt: new Date().toISOString(),
      },
    };

    setIsSubmitting(true);
    setError(null);

    try {
      await submitOnboarding(payload, { accessToken });
      const history = await fetchChatHistory({ accessToken });
      logEvent('onboarding_completed', { displayName: displayName.trim() });
      setProfile({
        displayName: history.profile?.display_name ?? displayName.trim(),
        legalAcceptedAt: history.profile?.legal_acceptance_at ?? new Date().toISOString(),
        onboardingCompletedAt: history.profile?.onboarding_completed_at ?? new Date().toISOString(),
      });
      try {
        await scheduleDailyQuestReminder();
      } catch (notificationError) {
        console.warn('Notification scheduling failed', notificationError);
      }
      router.replace('/(tabs)/chat');
    } catch (submitError) {
      console.error('Failed to submit onboarding', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Unable to finish onboarding right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Finish onboarding' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>
        </View>
        {renderStep({
          step,
          data,
          displayName,
          acceptedLegal,
          onUpdateData: setData,
          onToggleValue: handleToggleValue,
          onUpdateDisplayName: setDisplayName,
          onToggleLegal: setAcceptedLegal,
        })}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.footerButtons}>
          {step > 0 ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={previousStep} disabled={isSubmitting}>
              <Text style={styles.secondaryLabel}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 1 }} />
          )}
          {step === TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              style={[styles.primaryButton, (!canContinue || isSubmitting) && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canContinue || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color={palette.textInverted} /> : <Text style={styles.primaryLabel}>Submit</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
              onPress={nextStep}
              disabled={!canContinue}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type RenderStepProps = {
  step: number;
  data: OnboardingData;
  displayName: string;
  acceptedLegal: boolean;
  onUpdateData: (updater: (previous: OnboardingData) => OnboardingData) => void;
  onToggleValue: (value: string) => void;
  onUpdateDisplayName: (value: string) => void;
  onToggleLegal: (value: boolean) => void;
};

function renderStep({
  step,
  data,
  displayName,
  acceptedLegal,
  onUpdateData,
  onToggleValue,
  onUpdateDisplayName,
  onToggleLegal,
}: RenderStepProps) {
  switch (step) {
    case 0:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Purpose</Text>
          <Text style={styles.body}>We’ll capture a few details so Fermi can personalise coaching right away.</Text>
        </View>
      );
    case 1:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>About you</Text>
          <Text style={styles.body}>Optional basics that help us understand your context.</Text>
          <TextInput
            style={styles.input}
            placeholder="Age (optional)"
            placeholderTextColor={palette.textMuted}
            keyboardType="number-pad"
            value={data.demographics.age ? String(data.demographics.age) : ''}
            onChangeText={(value) =>
              onUpdateData((previous) => ({
                ...previous,
                demographics: {
                  ...previous.demographics,
                  age: Number.parseInt(value, 10) || undefined,
                },
              }))
            }
          />
          <Text style={styles.fieldLabel}>Gender identity</Text>
          <View style={styles.chipRow}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, data.demographics.gender === option && styles.chipSelected]}
                onPress={() =>
                  onUpdateData((previous) => ({
                    ...previous,
                    demographics: {
                      ...previous.demographics,
                      gender: previous.demographics.gender === option ? undefined : option,
                    },
                  }))
                }
              >
                <Text
                  style={[styles.chipLabel, data.demographics.gender === option && styles.chipLabelSelected]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Occupation (optional)"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="sentences"
            value={data.demographics.occupation ?? ''}
            onChangeText={(value) =>
              onUpdateData((previous) => ({
                ...previous,
                demographics: {
                  ...previous.demographics,
                  occupation: value || undefined,
                },
              }))
            }
          />
        </View>
      );
    case 2:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Life satisfaction check-in</Text>
          <Text style={styles.body}>Rate each domain from 1 (low) to 5 (high).</Text>
          {fulfillmentDomains.map((domain) => (
            <View key={domain} style={styles.ratingRow}>
              <Text style={styles.fieldLabel}>{domain}</Text>
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.ratingButton,
                      data.fulfillment[domain] === score && styles.ratingButtonSelected,
                    ]}
                    onPress={() =>
                      onUpdateData((previous) => ({
                        ...previous,
                        fulfillment: {
                          ...previous.fulfillment,
                          [domain]: score,
                        },
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.ratingLabel,
                        data.fulfillment[domain] === score && styles.ratingLabelSelected,
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    case 3:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>How you tend to operate</Text>
          <Text style={styles.body}>Respond on a scale from 1 (strongly disagree) to 5 (strongly agree).</Text>
          {PERSONALITY_ITEMS.map((item) => (
            <View key={item.id} style={styles.ratingRow}>
              <Text style={styles.fieldLabel}>{item.prompt}</Text>
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.ratingButton,
                      data.personality[item.id] === score && styles.ratingButtonSelected,
                    ]}
                    onPress={() =>
                      onUpdateData((previous) => ({
                        ...previous,
                        personality: {
                          ...previous.personality,
                          [item.id]: score,
                        },
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.ratingLabel,
                        data.personality[item.id] === score && styles.ratingLabelSelected,
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    case 4:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>What matters most right now?</Text>
          <Text style={styles.body}>Pick up to three values that feel most energising. We’ll use them to anchor quests and coaching.</Text>
          <View style={styles.chipGrid}>
            {VALUE_OPTIONS.map((option) => {
              const isSelected = data.values.finalRound.includes(option.value);
              const limitReached = !isSelected && data.values.finalRound.length >= 3;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chipLarge, isSelected && styles.chipSelected, limitReached && styles.chipDisabled]}
                  onPress={() => handleValuePress({ value: option.value, isSelected, onToggleValue })}
                  disabled={limitReached}
                >
                  <Text
                    style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.helperText}>Selected: {data.values.finalRound.join(', ') || 'None yet'}</Text>
        </View>
      );
    case 5:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Your words</Text>
          <Text style={styles.body}>These prompts feed directly into your Personal Insights report.</Text>
          <Text style={styles.fieldLabel}>Primary constraint</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="What pattern or obstacle blocks you most often?"
            placeholderTextColor={palette.textMuted}
            multiline
            value={data.constraint ?? ''}
            onChangeText={(value) =>
              onUpdateData((previous) => ({
                ...previous,
                constraint: value.trim() ? value : undefined,
              }))
            }
          />
          <Text style={styles.fieldLabel}>What do you want more of?</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Capture it in your own words..."
            placeholderTextColor={palette.textMuted}
            multiline
            value={data.reflections.desire ?? ''}
            onChangeText={(value) =>
              onUpdateData((previous) => ({
                ...previous,
                reflections: {
                  ...previous.reflections,
                  desire: value.trim() ? value : undefined,
                },
              }))
            }
          />
          <Text style={styles.fieldLabel}>What are you avoiding?</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="This helps Fermi spot hidden resistance..."
            placeholderTextColor={palette.textMuted}
            multiline
            value={data.reflections.avoidance ?? ''}
            onChangeText={(value) =>
              onUpdateData((previous) => ({
                ...previous,
                reflections: {
                  ...previous.reflections,
                  avoidance: value.trim() ? value : undefined,
                },
              }))
            }
          />
        </View>
      );
    case 6:
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Finish setup</Text>
          <Text style={styles.body}>Name yourself so Fermi can address you properly, then confirm the legal note.</Text>
          <TextInput
            style={styles.input}
            placeholder="Display name"
            placeholderTextColor={palette.textMuted}
            value={displayName}
            onChangeText={onUpdateDisplayName}
          />
          <View style={styles.legalRow}>
            <Switch value={acceptedLegal} onValueChange={onToggleLegal} trackColor={{ true: palette.accent }} />
            <Text style={styles.legalText}>
              I understand Purpose is a coaching experience, not medical or mental health treatment.
            </Text>
          </View>
        </View>
      );
    default:
      return null;
  }
}

type HandleValuePressArgs = {
  value: string;
  isSelected: boolean;
  onToggleValue: (value: string) => void;
};

function handleValuePress({ value, isSelected, onToggleValue }: HandleValuePressArgs) {
  if (!isSelected) {
    onToggleValue(value);
    return;
  }
  onToggleValue(value);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  progressHeader: {
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: 12,
    color: palette.textMuted,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  body: {
    fontSize: 14,
    color: palette.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.borderMuted,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: palette.textPrimary,
    backgroundColor: palette.surface,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
  },
  chipLarge: {
    flexGrow: 1,
    minWidth: '48%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipLabel: {
    color: palette.textPrimary,
    fontSize: 14,
  },
  chipLabelSelected: {
    color: palette.textInverted,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  ratingRow: {
    gap: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 44,
    alignItems: 'center',
  },
  ratingButtonSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  ratingLabel: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  ratingLabelSelected: {
    color: palette.textInverted,
  },
  legalRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  legalText: {
    flex: 1,
    color: palette.textMuted,
    fontSize: 13,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryLabel: {
    color: palette.textInverted,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: palette.surface,
  },
  secondaryLabel: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  errorText: {
    color: palette.error,
    textAlign: 'center',
  },
});
