import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type SimpleConfirmModalProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  pending?: boolean;
  disabledReason?: string;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Shared "explain, then confirm" sheet for challenge types that don't need
 * a dedicated input (Explore, Timing, Collection, Streak) — the server
 * still only records the completion once its own checks pass (a prior
 * check-in for this event), this is just the tap that asks for it.
 */
export default function SimpleConfirmModal({
  visible,
  title,
  body,
  confirmLabel = 'Mark complete',
  pending = false,
  disabledReason,
  onConfirm,
  onClose,
}: SimpleConfirmModalProps) {
  const theme = useTheme();

  return (
    <Sheet visible={visible} title={title} subtitle={body} onClose={onClose}>
      {disabledReason ? (
        <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]} accessibilityRole="alert">
          <Icon name="alert" size={18} color={theme.danger} />
          <ThemedText type="small" themeColor="danger" style={styles.noticeText}>
            {disabledReason}
          </ThemedText>
        </View>
      ) : null}

      <Button
        label={confirmLabel}
        variant="brand"
        icon="check"
        onPress={onConfirm}
        loading={pending}
        disabled={Boolean(disabledReason)}
        haptic="press"
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  noticeText: {
    flex: 1,
  },
});
