import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
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
        <Pressable style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border, boxShadow: `4px 4px 0px ${theme.shadow}` }]} accessibilityViewIsModal>
          <ThemedText type="section">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>

          <TextInput
            value={choice}
            onChangeText={setChoice}
            placeholder="Your vote"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Your vote"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          />

          <Button
            label="Submit vote"
            onPress={() => onSubmit(choice.trim())}
            loading={pending}
            disabled={choice.trim().length === 0}
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
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
  },
  button: {
    marginTop: Spacing.two,
  },
});
