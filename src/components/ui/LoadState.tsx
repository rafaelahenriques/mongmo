import { ActivityIndicator, RefreshControl, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePullToRefresh } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import type { IconName } from '@/components/ui/Icon';
import { Stickers, type StickerName } from '@/constants/stickers';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Sticker } from '@/components/ui/Sticker';

/**
 * The states every screen that loads data shows the same way: loading,
 * couldn't load (with Try again), and nothing here yet. Plus pull-to-refresh
 * for any ScrollView.
 */

/** A spinner, named for screen readers. */
export function LoadingState({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.loading, style]}>
      <ActivityIndicator accessibilityLabel="Loading" color={theme.text} />
    </View>
  );
}

/** Couldn't load: what failed, in plain words, and a way to try again. */
export function ErrorState({
  message,
  onRetry,
  style,
}: {
  /** "Couldn't load your orders." */
  message: string;
  onRetry: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card tone="muted" style={[styles.box, style]}>
      <View accessible accessibilityRole="alert" style={styles.inner}>
        <IconBadge name="alert" tone="card" size={44} />
        <ThemedText type="small" style={styles.center}>
          {message} Check your connection and try again.
        </ThemedText>
      </View>
      <Button label="Try again" variant="primary" size="medium" onPress={onRetry} />
    </Card>
  );
}

/** Nothing here yet: what will appear, and optionally the way to get it. */
export function EmptyState({
  icon,
  sticker,
  text,
  actionLabel,
  onAction,
  style,
}: {
  icon: IconName;
  /** One of Mongmo's stickers instead of the icon. Decorative: the text says it. */
  sticker?: StickerName;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card tone="muted" style={[styles.box, style]}>
      <View accessible accessibilityRole="text" accessibilityLabel={text} style={styles.inner}>
        {sticker ? (
          <Sticker source={Stickers[sticker]} style={styles.sticker} />
        ) : (
          <IconBadge name={icon} tone="card" size={52} />
        )}
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {text}
        </ThemedText>
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="primary" size="medium" onPress={onAction} />
      ) : null}
    </Card>
  );
}

/** Pull down to refetch everything the screen shows: `<ScrollView refreshControl={useRefreshControl()}>`. */
export function useRefreshControl() {
  const theme = useTheme();
  const { refreshing, onRefresh } = usePullToRefresh();
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textSecondary} />;
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  box: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  inner: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  center: {
    textAlign: 'center',
    maxWidth: 320,
  },
  sticker: {
    width: 96,
    height: 96,
  },
});
