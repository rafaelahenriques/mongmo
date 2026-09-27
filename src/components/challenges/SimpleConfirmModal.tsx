import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
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
 * Shared "explain, then confirm" modal for challenge types that don't need
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable
          style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border, boxShadow: `4px 4px 0px ${theme.shadow}` }]}
          accessibilityViewIsModal
        >
          <ThemedText type="section">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
            {body}
          </ThemedText>

          {disabledReason ? (
            <ThemedText type="small" themeColor="danger">
              {disabledReason}
            </ThemedText>
          ) : null}

          <Button
            label={confirmLabel}
            onPress={onConfirm}
            loading={pending}
            disabled={Boolean(disabledReason)}
            style={styles.button}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 2,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  body: {
    marginBottom: Spacing.one,
  },
  button: {
    marginTop: Spacing.two,
  },
});
