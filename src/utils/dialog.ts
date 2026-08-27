/**
 * Cross-platform dialogs.
 *
 * React Native's `Alert.alert` is native-only — on web it silently does nothing,
 * so confirmation buttons (logout, reset, etc.) never fire. These helpers fall
 * back to the browser's window.confirm / window.alert on web and keep using the
 * native Alert on iOS/Android.
 */
import { Alert, Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/** Ask the user to confirm an action. Resolves true if confirmed. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message = '',
    confirmText = 'OK',
    cancelText = 'Annuler',
    destructive = false,
  } = opts;

  if (IS_WEB) {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      return Promise.resolve(false);
    }
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(Boolean(window.confirm(text)));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Show a simple informational alert. */
export function alertDialog(title: string, message?: string): void {
  if (IS_WEB) {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
