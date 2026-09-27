import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type CommunityVoteModalProps = {
  visible: boolean;
  title: string;
  description: string;
  pending?: boolean;
  onSubmit: (choice: string) => void;
  onClose: () => void;
};

/** Free-text vote for the Community challenge type ("vote for next month's truck"). */
export default function CommunityVoteModal({
  visible,
  title,
  description,
  pending = false,
  onSubmit,
  onClose,
}: CommunityVoteModalProps) {
  const theme = useTheme();
  const [choice, setChoice] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={[styles.card, { backgroundColor: theme.background }]} accessibilityViewIsModal>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>

          <TextInput
            value={choice}
            onChangeText={setChoice}
            placeholder="Your vote"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Your vote"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
          />

          <Pressable
            onPress={() => onSubmit(choice.trim())}
            disabled={choice.trim().length === 0 || pending}
            accessibilityRole="button"
            accessibilityLabel="Submit vote"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: '#8B4513', opacity: choice.trim().length === 0 ? 0.5 : pending ? 0.7 : pressed ? 0.9 : 1 },
            ]}
          >
            {pending ? <ActivityIndicator color="#FFFFFF" /> : (
              <ThemedText type="smallBold" style={styles.buttonText}>
                Submit vote
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
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  button: {
    marginTop: Spacing.one,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
