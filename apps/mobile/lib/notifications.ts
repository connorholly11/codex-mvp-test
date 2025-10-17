import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  if (existing.status === 'denied' && Platform.OS === 'ios') {
    return false;
  }

  const status = await Notifications.requestPermissionsAsync();
  return (
    status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function scheduleDailyQuestReminder(hour = 9): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Purpose check-in',
      body: 'Drop into a quest or chat with Fermi to keep momentum going.',
    },
    trigger: {
      hour,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelScheduledReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
