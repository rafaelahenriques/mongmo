import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Stepper } from '@/components/ui/Stepper';
import { Spacing } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCartStore } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/** Item detail: description, price, a quantity stepper, add to cart. */
export default function OrderItemScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const location = useCartStore((state) => state.location);
  const menuQuery = useMenu(location);
  const [quantity, setQuantity] = useState(1);

  const item = useMemo(() => menuQuery.data?.find((row) => row.id === id), [menuQuery.data, id]);

  if (menuQuery.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <IconBadge name="alert" size={48} />
        <ThemedText type="section">Item not found</ThemedText>
      </View>
    );
  }

  const onAdd = () => {
    const addOnce = useCartStore.getState().addItem;
    for (let index = 0; index < quantity; index += 1) {
      addOnce({ menuItemId: item.id, name: item.name, priceCents: item.priceCents });
    }
    haptics.success();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <IconBadge name={location?.type === 'store' ? 'coffee' : 'food'} tone="accent" size={72} />
        <ThemedText type="title">{item.name}</ThemedText>
        {item.description ? <ThemedText themeColor="textSecondary">{item.description}</ThemedText> : null}

        <Card style={styles.quantityCard}>
          <View style={styles.quantityTexts}>
            <ThemedText type="small" themeColor="textSecondary">
              Price
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: theme.brand }}>
              {formatCents(item.priceCents)}
            </ThemedText>
          </View>
          <Stepper value={quantity} onChange={setQuantity} size="large" />
        </Card>
      </ScrollView>

      <ScreenFooter>
        <Button
          label={`Add to cart · ${formatCents(item.priceCents * quantity)}`}
          accessibilityLabel={`Add ${quantity} ${item.name} to cart, ${formatCents(item.priceCents * quantity)}`}
          variant="brand"
          icon="add"
          haptic="none"
          onPress={onAdd}
        />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  quantityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  quantityTexts: {
    gap: 2,
  },
});
