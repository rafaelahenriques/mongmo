import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { Toggle } from '@/components/ui/Toggle';
import { Spacing } from '@/constants/theme';
import { useEventMenus } from '@/hooks/useEventMenus';
import { useTheme } from '@/hooks/useTheme';

export type OwnerMenuAttachProps = {
  eventId: string;
};

/** Owner: switch each menu in the catalog on or off for this event. */
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
    <Card style={styles.list}>
      {menus.map((menu, index) => {
        const attached = attachedMenuIds.has(menu.id);
        return (
          <View key={menu.id}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
            <ListRow
              title={menu.name}
              subtitle={attached ? 'On this pop-up' : 'Not on this pop-up'}
              icon="food"
              iconTone={attached ? 'brand' : 'muted'}
              trailing={
                <Toggle
                  value={attached}
                  onValueChange={(next) => (next ? attach(menu.id) : detach(menu.id))}
                  accessibilityLabel={`${menu.name}, ${attached ? 'attached' : 'not attached'}`}
                />
              }
            />
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40 + Spacing.three,
  },
});
