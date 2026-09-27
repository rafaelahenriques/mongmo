import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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

    return <ErrorFallback onRetry={this.reset} />;
  }
}

/** The crash card itself — a function component so it can follow the theme. */
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} accessibilityRole="alert">
      <IconBadge name="alert" size={72} />
      <ThemedText type="title" style={styles.title}>
        Something went wrong
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        The app hit an unexpected error. Try again, or restart it if the problem keeps
        happening.
      </ThemedText>
      <Button
        label="Try again"
        accessibilityLabel="Dismiss the error and try again"
        variant="brand"
        onPress={onRetry}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  body: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  button: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
  },
});
