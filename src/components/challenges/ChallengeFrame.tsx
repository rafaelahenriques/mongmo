import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { BlockButton, type BlockButtonProps } from '@/components/ui/BlockButton';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ChallengeFrameProps = {
  /** The challenge's name, in the top bar. */
  title: string;
  points: number;
  /** The big line under the bar: what to do. */
  heading?: string;
  /** A grey line under the heading. */
  intro?: string;
  /** The block at the bottom; none while there's nothing to do. */
  action?: Pick<
    BlockButtonProps,
    'label' | 'value' | 'tone' | 'onPress' | 'loading' | 'disabled' | 'arrow' | 'haptic'
  > | null;
  /** Scroll the body (lists of options); off for a camera or a meter. */
  scroll?: boolean;
  onClose: () => void;
  children?: ReactNode;
};

/**
 * One template for every challenge type (X-02…X-04): the challenge's name
 * and points in the top bar, a heading, the input that type needs, and a
 * square block at the bottom. Only the input changes. Shown inside the
 * challenge runner's full-screen modal.
 */
export function ChallengeFrame({
  title,
  points,
  heading,
  intro,
  action,
  scroll = false,
  onClose,
  children,
}: ChallengeFrameProps) {
  const theme = useTheme();
  const head = heading ? (
    <View style={styles.head}>
      <ThemedText type="subtitle" accessibilityRole="header">
        {heading}
      </ThemedText>
      {intro ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {intro}
        </ThemedText>
      ) : null}
    </View>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title={title} value={`+${points}`} onBack={onClose} />
      {scroll ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollBody}>
          {head}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.body]}>
          {head}
          {children}
        </View>
      )}
      {action ? <BlockButton {...action} bottomInset /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  body: {
    paddingHorizontal: PageInset,
    paddingBottom: 14,
    gap: 14,
  },
  scrollBody: {
    paddingHorizontal: PageInset,
    paddingBottom: 24,
    gap: 14,
  },
  head: {
    gap: 6,
    paddingTop: 6,
  },
});
