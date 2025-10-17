import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { fetchChatHistory, parsePersonalInsightsReport, type PersonalInsightsReport } from '@purpose/api-client';
import { logEvent } from '@purpose/analytics';
import { palette } from '../../theme';
import { useSessionStore } from '../../state/useSessionStore';

export default function ReportsScreen() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PersonalInsightsReport | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchChatHistory({ accessToken })
      .then((history) => {
        const parsed = history.report?.content ? parsePersonalInsightsReport(history.report.content) : null;
        setReport(parsed);
        if (parsed) {
          logEvent('report_viewed', { reportId: 'personal-insights' });
        } else {
          setError('Complete onboarding to generate your Personal Insights report.');
        }
      })
      .catch((err) => {
        console.error('Failed to load personal insights report', err);
        setError(err instanceof Error ? err.message : 'Unable to load your report.');
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Personal Insights' }} />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : report ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.label}>Personal report</Text>
            <Text style={styles.title}>{report.title}</Text>
            <Text style={styles.body}>{report.openingInsight}</Text>
          </View>
          {report.sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.content.split('\n\n').map((paragraph, index) => (
                <Text key={`${section.id}-${index}`} style={styles.sectionParagraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.body}>Your report will appear here after onboarding.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  body: {
    fontSize: 14,
    color: palette.textMuted,
  },
  section: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  sectionParagraph: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 20,
  },
  errorText: {
    color: palette.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
