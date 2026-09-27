import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';

type ErrorBoundaryState = { hasError: boolean };

/** Last line of defence: turns any render crash into a retryable card. */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container} accessibilityRole="alert">
        <ThemedText type="subtitle" style={styles.title}>
          Something went wrong
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body}>
          The app hit an unexpected error. Try again, or restart it if the problem keeps
          happening.
        </ThemedText>
        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Dismiss the error and try again"
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonText}>
            Try again
          </ThemedText>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  button: {
    marginTop: Spacing.four,
    backgroundColor: '#8B4513',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
  },
});
