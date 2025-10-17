import * as Haptics from "expo-haptics";

function safelyRun(promise: Promise<void>) {
  promise.catch(() => {
    // Haptics can fail silently on unsupported devices or simulators.
  });
}

export function hapticSelection() {
  safelyRun(Haptics.selectionAsync());
}

export function hapticImpactLight() {
  safelyRun(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticImpactMedium() {
  safelyRun(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticNotificationSuccess() {
  safelyRun(
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function hapticNotificationError() {
  safelyRun(
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
}

