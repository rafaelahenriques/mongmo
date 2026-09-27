import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
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
          style={[styles.card, { backgroundColor: theme.background }]}
          accessibilityViewIsModal
        >
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
            {body}
          </ThemedText>

          {disabledReason ? (
            <ThemedText type="small" themeColor="danger">
              {disabledReason}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={onConfirm}
            disabled={pending || Boolean(disabledReason)}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: '#8B4513',
                opacity: disabledReason ? 0.5 : pending ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {pending ? <ActivityIndicator color="#FFFFFF" /> : (
              <ThemedText type="smallBold" style={styles.buttonText}>
                {confirmLabel}
              </ThemedText>
            )}
          </Pressable>
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
    padding: Spacing.four,
    gap: Spacing.two,
  },
  body: {
    marginBottom: Spacing.one,
  },
  button: {
    marginTop: Spacing.two,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
