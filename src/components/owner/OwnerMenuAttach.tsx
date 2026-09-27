import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useEventMenus } from '@/hooks/useEventMenus';
import { useTheme } from '@/hooks/useTheme';

export type OwnerMenuAttachProps = {
  eventId: string;
};

/** Owner: attach/detach one of the existing menus to this event. */
export default function OwnerMenuAttach({ eventId }: OwnerMenuAttachProps) {
  const theme = useTheme();
  const { menus, attachedMenuIds, attach, detach } = useEventMenus(eventId);

  if (menus.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No menus in the catalog yet.
      </ThemedText>
    );
  }

  return (
    <View style={styles.container}>
      {menus.map((menu) => {
        const attached = attachedMenuIds.has(menu.id);
        return (
          <Pressable
            key={menu.id}
            onPress={() => (attached ? detach(menu.id) : attach(menu.id))}
            accessibilityRole="button"
            accessibilityLabel={`${menu.name}, ${attached ? 'attached' : 'not attached'}`}
            style={[
              styles.row,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText type="small" style={styles.name}>
              {menu.name}
            </ThemedText>
            {attached ? <Check size={18} color={theme.success} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  name: {
    flex: 1,
  },
});
