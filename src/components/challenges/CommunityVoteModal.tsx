import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OptionPill } from '@/components/ui/OptionPill';
import { Sheet } from '@/components/ui/Sheet';
import { Spacing } from '@/constants/theme';

export type CommunityVoteModalProps = {
  visible: boolean;
  title: string;
  description: string;
  /** The owner's options; the vote is one of them. */
  options: string[];
  pending?: boolean;
  onSubmit: (choice: string) => void;
  onClose: () => void;
};

/** The Community challenge: pick one of the owner's options ("next month's truck"). */
export default function CommunityVoteModal({
  visible,
  title,
  description,
  options,
  pending = false,
  onSubmit,
  onClose,
}: CommunityVoteModalProps) {
  const [choice, setChoice] = useState<string | null>(null);
  // Start from nothing picked whenever the sheet is reopened.
  const close = () => {
    setChoice(null);
    onClose();
  };

  return (
    <Sheet visible={visible} title={title} subtitle={description || 'Pick one.'} onClose={close}>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Options">
        {options.map((option) => (
          <OptionPill key={option} label={option} checked={choice === option} onPress={() => setChoice(option)} />
        ))}
      </View>
      <Button
        label="Submit vote"
        variant="brand"
        onPress={() => {
          if (!choice) return;
          setChoice(null);
          onSubmit(choice);
        }}
        loading={pending}
        disabled={choice === null}
        haptic="press"
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
