import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
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

      <View
        style={[
          styles.codeBox,
          { backgroundColor: theme.highlight, borderColor: theme.border, boxShadow: `4px 4px 0px ${theme.shadow}` },
        ]}
      >
        <ThemedText type="title" style={[styles.code, { color: theme.onHighlight }]}>
          {pickupCode(typeof id === 'string' ? id : '')}
        </ThemedText>
      </View>

      <Button
        label="View order status"
        onPress={() =>
          typeof id === 'string'
            ? router.replace({ pathname: '/(orders)/order/status/[id]', params: { id } })
            : router.replace('/(orders)')
        }
        style={styles.button}
      />
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
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    maxWidth: 300,
  },
  codeBox: {
    marginTop: Spacing.three,
    borderRadius: 16,
    borderWidth: 2,
    transform: [{ rotate: '-2deg' }],
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  code: {
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: 6,
  },
  button: {
    marginTop: Spacing.five,
    alignSelf: 'stretch',
  },
});
