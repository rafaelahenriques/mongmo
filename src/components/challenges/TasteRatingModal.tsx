import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
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
        <Pressable style={[styles.card, { backgroundColor: theme.background }]} accessibilityViewIsModal>
          <ThemedText type="smallBold">{title}</ThemedText>

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
                  color={value <= rating ? '#F5B24A' : theme.backgroundSelected}
                  fill={value <= rating ? '#F5B24A' : 'transparent'}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => onSubmit(rating)}
            disabled={rating === 0 || pending}
            accessibilityRole="button"
            accessibilityLabel="Submit rating"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: '#8B4513', opacity: rating === 0 ? 0.5 : pending ? 0.7 : pressed ? 0.9 : 1 },
            ]}
          >
            {pending ? <ActivityIndicator color="#FFFFFF" /> : (
              <ThemedText type="smallBold" style={styles.buttonText}>
                Submit rating
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
