import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { pickupCode } from '@/utils/orderFormat';

/** Order flow, step 6: confirmation with the pickup code. */
export default function OrderConfirmationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { id } = useLocalSearchParams<{ id: string }>();
  const code = pickupCode(typeof id === 'string' ? id : '');

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: tabBarInset + Spacing.four }]}>
      <View style={styles.body}>
        <IconBadge name="check" tone="success" size={72} />
        <ThemedText type="title" style={styles.center} accessibilityRole="header">
          Order confirmed
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={[styles.center, styles.copy]}>
          We&apos;ll notify you when it&apos;s ready. Show this code at pickup.
        </ThemedText>

        <Card tone="accent" style={styles.codeCard}>
          <ThemedText type="label" style={{ color: theme.onAccent }}>
            Pickup code
          </ThemedText>
          <ThemedText
            type="display"
            style={[styles.code, { color: theme.onAccent }]}
            accessibilityLabel={`Pickup code ${code.split('').join(' ')}`}
          >
            {code}
          </ThemedText>
        </Card>
      </View>

      <Button
        label="View order status"
        arrow
        onPress={() =>
          typeof id === 'string'
            ? router.replace({ pathname: '/(orders)/order/status/[id]', params: { id } })
            : router.replace('/(orders)')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three + Spacing.one,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  copy: {
    maxWidth: 300,
  },
  codeCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.three,
    paddingVertical: Spacing.four,
  },
  code: {
    letterSpacing: 8,
  },
});
