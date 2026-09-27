import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
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
    <Sheet visible={visible} title={title} subtitle={description} onClose={onClose}>
      <TextInput
        value={choice}
        onChangeText={setChoice}
        placeholder="Your vote"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Your vote"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      <Button
        label="Submit vote"
        variant="brand"
        onPress={() => onSubmit(choice.trim())}
        loading={pending}
        disabled={choice.trim().length === 0}
        haptic="press"
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
});
