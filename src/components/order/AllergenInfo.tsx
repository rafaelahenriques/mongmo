import { Linking, StyleSheet, View } from 'react-native';

import type { OrderMenuItem } from '@/api/orders';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ALLERGY_CONTACT, allergenText } from '@/constants/allergens';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { shortItemName } from '@/utils/orderFormat';

/**
 * An item's allergens, and those of its dips and extras, before it's added
 * to the order (EU food information rules). When something isn't listed
 * yet, it says so and how to ask.
 */
export function AllergenInfo({ item, options }: { item: OrderMenuItem; options: OrderMenuItem[] }) {
  const theme = useTheme();
  const missing = [item, ...options].some((entry) => entry.allergens == null);
  return (
    <View style={[styles.box, { borderColor: theme.border }]}>
      <ThemedText type="section" accessibilityRole="header">
        Allergens
      </ThemedText>
      <ThemedText type="small">{allergenText(item.allergens)}</ThemedText>
      {options.map((option) => (
        <ThemedText key={option.id} type="small" themeColor="textSecondary">
          {`${shortItemName(option.name, option.category)}: ${allergenText(option.allergens)}`}
        </ThemedText>
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        {missing
          ? 'Some allergens aren’t listed yet. If you have an allergy, ask us before you order.'
          : 'Have an allergy? Ask us before you order.'}
      </ThemedText>
      <View style={styles.ask}>
        <Button
          label="Ask us by email"
          // Starts with the visible words, so voice control finds it by what it says.
          accessibilityLabel={`Ask us by email about allergens, ${ALLERGY_CONTACT}`}
          variant="secondary"
          size="small"
          icon="mail"
          onPress={() => void Linking.openURL(`mailto:${ALLERGY_CONTACT}?subject=Allergens`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outlined, so the stone email button shows on it.
  box: {
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderRadius: Radius.large,
    marginTop: 6,
  },
  ask: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
});
