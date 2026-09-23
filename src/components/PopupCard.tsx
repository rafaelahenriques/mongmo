import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { PopUp, PopupStatus } from '@/types';

const STATUS_LABELS: Record<PopupStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live now',
  ended: 'Ended',
};

const STATUS_COLORS: Record<PopupStatus, { background: string; text: string }> = {
  upcoming: { background: 'rgba(60, 135, 247, 0.15)', text: '#3C87F7' },
  live: { background: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  ended: { background: 'rgba(120, 120, 128, 0.15)', text: '#8E8E93' },
};

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export type PopupCardProps = {
  popup: PopUp;
  onPress?: () => void;
};

/**
 * Card listing a single pop-up: status badge, title, description,
 * date and distance from the café.
 */
export default function PopupCard({ popup, onPress }: PopupCardProps) {
  const theme = useTheme();
  const status = STATUS_COLORS[popup.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: status.background }]}>
          <ThemedText type="smallBold" style={[styles.badgeText, { color: status.text }]}>
            {STATUS_LABELS[popup.status]}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDistance(popup.distance)}
        </ThemedText>
      </View>

      <ThemedText type="smallBold" style={styles.title}>
        {popup.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        {popup.description}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatDate(popup.date)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    marginTop: 4,
  },
  description: {
    marginBottom: 2,
  },
});
