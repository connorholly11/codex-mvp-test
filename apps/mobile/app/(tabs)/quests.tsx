import { logEvent } from "@purpose/analytics";
import {
  QUESTS,
  type QuestDefinition,
  type QuestResponse,
  type QuestStatus,
} from "@purpose/api-client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { animateLayout } from "../../lib/animation";
import {
  hapticImpactLight,
  hapticImpactMedium,
  hapticNotificationError,
  hapticNotificationSuccess,
  hapticSelection,
} from "../../lib/haptics";
import { useQuestsStore } from "../../state/useQuestsStore";
import { useSessionStore } from "../../state/useSessionStore";
import { palette } from "../../theme";

export default function QuestsScreen() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const initialize = useQuestsStore((state) => state.initialize);
  const completeQuest = useQuestsStore((state) => state.completeQuest);
  const statuses = useQuestsStore((state) => state.statuses);
  const responses = useQuestsStore((state) => state.responses);
  const isLoading = useQuestsStore((state) => state.isLoading);
  const error = useQuestsStore((state) => state.error);

  useEffect(() => {
    logEvent("quests_viewed");
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    initialize(accessToken).catch((initializeError) => {
      console.error("Failed to load quests", initializeError);
      hapticNotificationError();
    });
  }, [accessToken, initialize]);

  const handleComplete = async (
    questId: string,
    answer: QuestResponse["answer"],
  ) => {
    try {
      hapticImpactMedium();
      await completeQuest(questId, answer, accessToken ?? undefined);
      logEvent("quest_completed", { questId });
      hapticNotificationSuccess();
      Alert.alert("Quest saved", "Your response was recorded.");
    } catch (questError) {
      console.error("Failed to complete quest", questError);
      hapticNotificationError();
      Alert.alert(
        "Unable to complete quest",
        questError instanceof Error
          ? questError.message
          : "Please try again later.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Daily quests" }} />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Prime Fermi’s memory</Text>
            <Text style={styles.heroBody}>
              These small prompts tune Fermi to your psychology. A tiny daily
              deposit keeps the coaching sharp and personal.
            </Text>
          </View>
          {QUESTS.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              status={statuses[quest.id] ?? "available"}
              response={
                responses.find((item) => item.questId === quest.id) ?? null
              }
              onComplete={handleComplete}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type QuestCardProps = {
  quest: QuestDefinition;
  status: QuestStatus;
  response: QuestResponse | null;
  onComplete: (
    questId: string,
    answer: QuestResponse["answer"],
  ) => Promise<void>;
};

function QuestCard({ quest, status, response, onComplete }: QuestCardProps) {
  const [isExpanded, setExpanded] = useState(false);
  const [likertAnswer, setLikertAnswer] = useState<number | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [choiceAnswer, setChoiceAnswer] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const toggleExpanded = () => {
    animateLayout();
    hapticSelection();
    setExpanded((value) => !value);
  };

  useEffect(() => {
    if (response) {
      if (quest.type === "likert" && typeof response.answer === "number") {
        setLikertAnswer(response.answer);
      }
      if (quest.type === "reflection" && typeof response.answer === "string") {
        setReflectionAnswer(response.answer);
      }
      if (quest.type === "choice" && typeof response.answer === "string") {
        setChoiceAnswer(response.answer);
      }
    }
  }, [quest.type, response]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    let answer: QuestResponse["answer"] = null;
    if (quest.type === "likert") {
      if (!likertAnswer) {
        hapticNotificationError();
        Alert.alert("Pick a rating", "Select a score between 1 and 5.");
        return;
      }
      answer = likertAnswer;
    } else if (quest.type === "reflection") {
      const trimmed = reflectionAnswer.trim();
      if (trimmed.length < quest.payload.minLength) {
        hapticNotificationError();
        Alert.alert(
          "Add more detail",
          `Aim for at least ${quest.payload.minLength} characters.`,
        );
        return;
      }
      answer = trimmed;
    } else if (quest.type === "choice") {
      if (!choiceAnswer) {
        hapticNotificationError();
        Alert.alert(
          "Choose an option",
          "Select the option that fits best right now.",
        );
        return;
      }
      answer = choiceAnswer;
    }

    animateLayout();
    hapticImpactLight();
    setSubmitting(true);
    try {
      await onComplete(quest.id, answer);
      setExpanded(false);
      animateLayout();
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = status === "completed";

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={toggleExpanded}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{quest.title}</Text>
            <Text style={styles.cardDescription}>{quest.description}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isCompleted && styles.statusBadgeCompleted,
            ]}
          >
            <Text
              style={[
                styles.statusLabel,
                isCompleted && styles.statusLabelCompleted,
              ]}
            >
              {isCompleted
                ? "Completed"
                : status === "in_progress"
                  ? "In progress"
                  : "Available"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {isExpanded ? (
        <View style={styles.cardBody}>
          <QuestPayload
            quest={quest}
            likertAnswer={likertAnswer}
            reflectionAnswer={reflectionAnswer}
            choiceAnswer={choiceAnswer}
            setLikertAnswer={setLikertAnswer}
            setReflectionAnswer={setReflectionAnswer}
            setChoiceAnswer={setChoiceAnswer}
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isSubmitting && styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={palette.textInverted} />
            ) : (
              <Text style={styles.primaryLabel}>
                {isCompleted ? "Update response" : "Mark complete"}
              </Text>
            )}
          </TouchableOpacity>
          {response ? (
            <Text style={styles.responseMeta}>
              Last submitted{" "}
              {new Date(response.completedAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type QuestPayloadProps = {
  quest: QuestDefinition;
  likertAnswer: number | null;
  reflectionAnswer: string;
  choiceAnswer: string | null;
  setLikertAnswer: (value: number) => void;
  setReflectionAnswer: (value: string) => void;
  setChoiceAnswer: (value: string) => void;
};

function QuestPayload({
  quest,
  likertAnswer,
  reflectionAnswer,
  choiceAnswer,
  setLikertAnswer,
  setReflectionAnswer,
  setChoiceAnswer,
}: QuestPayloadProps) {
  if (quest.type === "likert") {
    const { prompt, scaleLabels } = quest.payload;
    return (
      <View style={styles.payloadBlock}>
        <Text style={styles.payloadPrompt}>{prompt}</Text>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>{scaleLabels[0]}</Text>
          <Text style={styles.scaleLabel}>{scaleLabels[1]}</Text>
        </View>
        <View style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5].map((score) => (
            <TouchableOpacity
              key={score}
              style={[
                styles.ratingButton,
                likertAnswer === score && styles.ratingButtonSelected,
              ]}
              onPress={() => {
                hapticSelection();
                animateLayout();
                setLikertAnswer(score);
              }}
            >
              <Text
                style={[
                  styles.ratingLabel,
                  likertAnswer === score && styles.ratingLabelSelected,
                ]}
              >
                {score}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (quest.type === "reflection") {
    return (
      <View style={styles.payloadBlock}>
        <Text style={styles.payloadPrompt}>{quest.payload.prompt}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Write your response here"
          placeholderTextColor={palette.textMuted}
          multiline
          value={reflectionAnswer}
          onChangeText={setReflectionAnswer}
        />
      </View>
    );
  }

  return (
    <View style={styles.payloadBlock}>
      <Text style={styles.payloadPrompt}>{quest.payload.prompt}</Text>
      <View style={styles.choiceRow}>
        {quest.payload.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.choiceButton,
              choiceAnswer === option && styles.choiceButtonSelected,
            ]}
            onPress={() => {
              hapticSelection();
              animateLayout();
              setChoiceAnswer(option);
            }}
          >
            <Text
              style={[
                styles.choiceLabel,
                choiceAnswer === option && styles.choiceLabelSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.surface,
  },
  statusBadgeCompleted: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  statusLabel: {
    fontSize: 12,
    color: palette.textPrimary,
    fontWeight: "600",
  },
  statusLabelCompleted: {
    color: palette.textInverted,
  },
  cardBody: {
    gap: 12,
  },
  payloadBlock: {
    gap: 12,
  },
  payloadPrompt: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.textPrimary,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scaleLabel: {
    fontSize: 12,
    color: palette.textMuted,
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 8,
  },
  ratingButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 44,
    alignItems: "center",
  },
  ratingButtonSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  ratingLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  ratingLabelSelected: {
    color: palette.textInverted,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 12,
  },
  choiceButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  choiceButtonSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  choiceLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  choiceLabelSelected: {
    color: palette.textInverted,
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: palette.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryLabel: {
    color: palette.textInverted,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: palette.borderMuted,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.textPrimary,
    backgroundColor: palette.surface,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  responseMeta: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: "right",
  },
  errorText: {
    color: palette.error,
    fontSize: 14,
  },
});
