import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type TasteRatingModalProps = {
  visible: boolean;
  title: string;
  pending?: boolean;
  onSubmit: (rating: number) => void;
  onClose: () => void;
};

/** 1–5 star rating for the Taste challenge type. */
export default function TasteRatingModal({ visible, title, pending = false, onSubmit, onClose }: TasteRatingModalProps) {
  const theme = useTheme();
  const [rating, setRating] = useState(0);

  return (
    <Sheet visible={visible} title={title} subtitle="How was it? Tap to rate." onClose={onClose}>
      <View style={styles.stars} accessibilityLabel={`Rating: ${rating} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= rating;
          return (
            <Pressable
              key={value}
              onPress={() => {
                haptics.select();
                setRating(value);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
              accessibilityState={{ selected: filled }}
              hitSlop={6}
              style={({ pressed }) => [styles.star, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            >
              <Icon
                name={filled ? 'star' : 'starOutline'}
                size={36}
                color={filled ? theme.brand : theme.border}
                weight="regular"
              />
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Submit rating"
        variant="brand"
        onPress={() => onSubmit(rating)}
        loading={pending}
        disabled={rating === 0}
        haptic="press"
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  star: {
    padding: Spacing.one,
  },
});
