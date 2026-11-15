import { useEffect, useRef, useState, type ComponentRef, type PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { JoinCopy } from '@/components/guest/joinCopy';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ButtonRow } from '@/components/ui/ButtonRow';
import { IconBadge } from '@/components/ui/IconBadge';
import { CardShadow, inkAlpha, PageInset, Radius, Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { startAccount, type AuthMode } from '@/services/guest';

type GuestLockProps = PropsWithChildren<
  JoinCopy & {
    /**
     * Inline: a part of a screen (the stamp card on Home), the card
     * smaller and overlapping its bottom edge, so all of it stays in view.
     * Otherwise the whole screen, the card in the middle.
     */
    inline?: boolean;
    /** A screen opened on top of another: a way back, since its own back button is under the lock. */
    onBack?: () => void;
  }
>;

/**
 * Something guests can't use yet, still there to see: the real content,
 * dimmed and out of reach (no taps, no keyboard, no screen reader), with a
 * card on top to make an account or sign in.
 */
export function GuestLock({ title, text, inline = false, onBack, children }: GuestLockProps) {
  const tabBarInset = useTabBarInset();
  const hidden = useRef<ComponentRef<typeof View>>(null);
  // On the web, `inert` takes the content out of reach of the keyboard and
  // screen readers: aria-hidden would also hide it from sight there (see
  // HIDDEN_SCREENS in +html.tsx).
  useEffect(() => {
    if (Platform.OS === 'web') (hidden.current as unknown as HTMLElement | null)?.setAttribute('inert', '');
  }, []);
  const content = (
    <View ref={hidden} style={inline ? undefined : styles.fill} pointerEvents="none" {...OUT_OF_REACH}>
      {children}
    </View>
  );

  if (inline) {
    return (
      <View>
        <View style={styles.inlineContent}>
          {content}
          <View style={[StyleSheet.absoluteFill, styles.scrim]} pointerEvents="none" />
        </View>
        <View style={styles.inlineCard}>
          <JoinCard title={title} text={text} compact headingLevel={2} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.fill}>
      {content}
      <View style={[StyleSheet.absoluteFill, styles.scrim]} pointerEvents="none" />
      {/* Scrolls when very large text makes the card taller than the screen. */}
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={[styles.screenCard, { paddingBottom: tabBarInset + Spacing.four }]}
      >
        {/* Over a whole screen, the card's title is the page's heading: the
            screen's own is under the lock. */}
        <JoinCard title={title} text={text} onBack={onBack} headingLevel={1} />
      </ScrollView>
    </View>
  );
}

/**
 * What the lock says, and the two ways in: make an account, or sign in.
 * Compact (inline): the lock beside the title, the buttons side by side
 * while they fit.
 */
function JoinCard({
  title,
  text,
  onBack,
  compact = false,
  headingLevel,
}: JoinCopy & { onBack?: () => void; compact?: boolean; headingLevel: 1 | 2 }) {
  const theme = useTheme();
  const [pending, setPending] = useState<AuthMode | null>(null);
  const go = (mode: AuthMode) => {
    setPending(mode);
    // The guest session ends and Welcome takes over the whole app.
    void startAccount(mode).catch(() => setPending(null));
  };

  const heading = (
    <ThemedText type={compact ? 'section' : 'subtitle'} accessibilityRole="header" headingLevel={headingLevel}>
      {title}
    </ThemedText>
  );
  const create = (
    <Button
      label="Create an account"
      variant="brand"
      size={compact ? 'medium' : undefined}
      loading={pending === 'sign-up'}
      disabled={pending !== null}
      onPress={() => go('sign-up')}
    />
  );
  const signIn = (
    <Button
      label="Sign in"
      variant="secondary"
      size={compact ? 'medium' : undefined}
      loading={pending === 'sign-in'}
      disabled={pending !== null}
      onPress={() => go('sign-in')}
    />
  );

  return (
    <View
      style={[
        styles.card,
        compact && styles.compactCard,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow },
      ]}
    >
      {compact ? (
        <View style={styles.titleRow}>
          <IconBadge name="lock" tone="brand" size={32} />
          <View style={styles.flexShrink}>{heading}</View>
        </View>
      ) : (
        <IconBadge name="lock" tone="brand" size={44} />
      )}
      <View style={styles.texts}>
        {compact ? null : heading}
        <ThemedText type="small" themeColor="textSecondary">
          {text}
        </ThemedText>
      </View>
      {compact ? (
        <ButtonRow>
          {create}
          {signIn}
        </ButtonRow>
      ) : (
        <>
          {create}
          {signIn}
          {onBack ? <Button label="Go back" variant="ghost" onPress={onBack} /> : null}
        </>
      )}
    </View>
  );
}

/** On phones, out of a screen reader's reach as well as of taps (pointerEvents). */
const OUT_OF_REACH =
  Platform.OS === 'web'
    ? {}
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  // The content keeps its own corners; the scrim follows them.
  inlineContent: {
    borderRadius: Radius.tile,
    overflow: 'hidden',
  },
  // Dark in both themes: it dims the content, it doesn't wash it out.
  scrim: {
    backgroundColor: inkAlpha(0.62),
  },
  // Over the dimmed content's bottom edge, so it reads as on top of it.
  inlineCard: {
    marginTop: -Spacing.four,
    marginHorizontal: Spacing.three,
  },
  screenCard: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: PageInset,
    paddingTop: Spacing.five,
  },
  card: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  compactCard: {
    padding: Spacing.three,
    gap: Spacing.two + Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.one,
  },
  flexShrink: {
    flexShrink: 1,
  },
  texts: {
    gap: Spacing.one,
  },
});
