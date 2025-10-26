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

export async function scheduleOneOffReminder(options: {
  fireDate: Date;
  title: string;
  body: string;
}): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
      },
      trigger: options.fireDate,
    });
    return id;
  } catch (error) {
    console.warn('Failed to schedule one-off reminder', error);
    return null;
  }
}
