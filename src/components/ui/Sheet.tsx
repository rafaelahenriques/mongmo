import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { IconButton } from '@/components/ui/IconButton';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type SheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>;

/**
 * Bottom sheet for short, focused tasks (rate, vote, confirm): dims the
 * screen, rises from the bottom with a grabber and a close button. Tapping
 * the dimmed area or the system back gesture closes it.
 */
export function Sheet({ visible, title, subtitle, onClose, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.four },
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <View style={styles.headerTexts}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {title}
              </ThemedText>
              {subtitle ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
            <IconButton icon="close" tone="muted" size={36} onPress={onClose} accessibilityLabel="Close sheet" />
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(22, 17, 17, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.large + 4,
    borderTopRightRadius: Radius.large + 4,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    alignSelf: 'center',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    gap: Spacing.three,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerTexts: {
    flex: 1,
    gap: Spacing.one,
  },
});
