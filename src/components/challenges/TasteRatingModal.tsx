import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border, boxShadow: `4px 4px 0px ${theme.shadow}` }]} accessibilityViewIsModal>
          <ThemedText type="section">{title}</ThemedText>

          <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating: ${rating} of 5 stars`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setRating(value)}
                accessibilityRole="button"
                accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
                hitSlop={6}
              >
                <Star
                  size={32}
                  color={theme.border}
                  fill={value <= rating ? theme.highlight : 'transparent'}
                />
              </Pressable>
            ))}
          </View>

          <Button
            label="Submit rating"
            onPress={() => onSubmit(rating)}
            loading={pending}
            disabled={rating === 0}
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
    gap: Spacing.three,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  button: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
