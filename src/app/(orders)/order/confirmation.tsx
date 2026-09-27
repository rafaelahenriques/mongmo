import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { pickupCode } from '@/utils/orderFormat';

/** Order flow, step 6: confirmation with the pickup code. */
export default function OrderConfirmationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CheckCircle2 size={56} color={theme.success} />
      <ThemedText type="title" style={styles.title}>
        Order confirmed
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
        We&apos;ll notify you when it&apos;s ready. Show this code at pickup.
      </ThemedText>

      <View style={[styles.codeBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        <ThemedText type="title" style={styles.code}>
          {pickupCode(typeof id === 'string' ? id : '')}
        </ThemedText>
      </View>

      <Pressable
        onPress={() =>
          typeof id === 'string'
            ? router.replace({ pathname: '/(orders)/order/status/[id]', params: { id } })
            : router.replace('/(orders)')
        }
        accessibilityRole="button"
        accessibilityLabel="View order status"
        style={({ pressed }) => [styles.button, { backgroundColor: '#8B4513', opacity: pressed ? 0.9 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.buttonText}>
          View order status
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  body: {
    textAlign: 'center',
    maxWidth: 300,
  },
  codeBox: {
    marginTop: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  code: {
    fontSize: 34,
    letterSpacing: 4,
  },
  button: {
    marginTop: Spacing.five,
    minHeight: 50,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
