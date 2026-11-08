import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OMark } from '@/components/brand/OMark';
import { ChallengeFrame } from '@/components/challenges/ChallengeFrame';
import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

const RATING_WORDS = ['', 'Not for me', 'It was OK', 'Good', 'Really good', 'The best'];

export type RateAndVoteProps = {
  /** The challenge's name, in the top bar. */
  title: string;
  points: number;
  /** The question: "What was the best thing you tasted?". */
  heading: string;
  intro?: string;
} & (
  | { mode: 'vote'; options: string[]; onSubmit: (choice: string) => void }
  | { mode: 'rate'; onSubmit: (rating: number) => void }
) & {
    /** Completing; the Send block spins meanwhile. */
    sending: boolean;
    onClose: () => void;
  };

/**
 * X-04 Rate and vote, shared by the Vote and Taste types: the owner's
 * options as tiles (the chosen one turns sage with a tick), or "How good
 * was it?" on five of the logo's Ộ stamps in place of stars. SEND at the
 * bottom once something is picked.
 */
export default function RateAndVote(props: RateAndVoteProps) {
  const { title, points, heading, intro, sending, onClose } = props;
  const theme = useTheme();
  const [choice, setChoice] = useState<string | null>(null);
  const [rating, setRating] = useState(0);

  const ready = props.mode === 'vote' ? choice !== null : rating > 0;
  const submit = () => {
    if (props.mode === 'vote' && choice !== null) props.onSubmit(choice);
    if (props.mode === 'rate' && rating > 0) props.onSubmit(rating);
  };

  return (
    <ChallengeFrame
      title={title}
      points={points}
      heading={heading}
      intro={intro}
      scroll
      action={{ label: 'Send', value: `+${points}`, onPress: submit, disabled: !ready, loading: sending }}
      onClose={onClose}
    >
      {props.mode === 'vote' ? (
        <View style={styles.tiles} accessibilityRole="radiogroup">
          {props.options.map((option) => {
            const selected = option === choice;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  haptics.select();
                  setChoice(option);
                }}
                accessibilityRole="radio"
                aria-checked={selected}
                accessibilityLabel={option}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    backgroundColor: theme.backgroundSelected,
                    // An ink ring marks the choice, not the tag's colour alone.
                    borderColor: selected ? theme.text : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.tag, { backgroundColor: selected ? theme.brandFill : theme.backgroundElement }]}>
                  <ThemedText
                    type="label"
                    numberOfLines={2}
                    style={[styles.tagText, { color: selected ? theme.onBrand : theme.text }]}
                  >
                    {option}
                  </ThemedText>
                  {selected ? <Icon name="check" size={14} color={theme.onBrand} weight="bold" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.rate}>
          <ThemedText type="smallBold">How good was it?</ThemedText>
          <View style={styles.stamps} accessibilityRole="adjustable" accessibilityLabel="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => {
                  haptics.select();
                  setRating(value);
                }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${value} out of 5`}
                aria-selected={value === rating}
              >
                <OMark
                  height={44}
                  color={value <= rating ? theme.brand : theme.border}
                  variant={value <= rating ? 'solid' : 'outline'}
                />
              </Pressable>
            ))}
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            {rating ? RATING_WORDS[rating] : 'Tap a stamp.'}
          </ThemedText>
        </View>
      )}
    </ChallengeFrame>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 112,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    borderWidth: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagText: {
    flexShrink: 1,
  },
  rate: {
    gap: 12,
    paddingTop: 8,
  },
  stamps: {
    flexDirection: 'row',
    gap: 14,
  },
});
