import { Alert, Platform } from 'react-native';

/**
 * Dialogs that work everywhere. On web they're the browser's own:
 * react-native-web's Alert.alert does nothing, so a button that only
 * called it would silently do nothing there.
 */

type ConfirmOptions = {
  /** The cancel button's label. */
  cancelLabel?: string;
  /** Shown in red on iOS: for deleting or ending something. */
  destructive?: boolean;
};

/** Asks a yes/no question; resolves true when they confirm. */
export function confirm(
  title: string,
  message: string,
  confirmLabel: string,
  { cancelLabel = 'Cancel', destructive = false }: ConfirmOptions = {},
): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** What went wrong, from anything thrown: its message, or the fallback. */
export function errorMessage(error: unknown, fallback = 'Please try again.'): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** A message with an OK button. */
export function showMessage(title: string, message: string): void {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

/** Tells them something went wrong, with the error's message. */
export function showError(title: string, error: unknown, fallback?: string): void {
  showMessage(title, errorMessage(error, fallback));
}
