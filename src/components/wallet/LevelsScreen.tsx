import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { levelSticker, Stickers } from '@/constants/stickers';
import { CardShadow, PageInset, Paper } from '@/constants/theme';
import { useLevel } from '@/hooks/useLevel';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import type { Level } from '@/types';
import { Sticker } from '@/components/ui/Sticker';

/**
 * Levels (after Joe & The Juice's tiers): your level big on sage with the
 * points to the next one, then the ladder, Dough to Crisp, each with what it
 * unlocks. Every point you've ever earned counts; redeeming never takes
 * you down a level.
 */
export default function LevelsScreen() {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const level = useLevel();

  return (
    <ScrollView
      // Reachable by keyboard, so it can be scrolled without a mouse.
      tabIndex={0}
      aria-label="Your level and the levels"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <View
        style={[styles.hero, { backgroundColor: theme.brandFill }]}
        accessible
        accessibilityLabel={`Your level: ${level.current.name}. ${level.lifetime} points earned.${
          level.next ? ` ${level.toNext} more to ${level.next.name}.` : ' The top level.'
        }`}
      >
        <ThemedText type="label" style={{ color: theme.onBrand }}>
          Your level
        </ThemedText>
        <ThemedText type="name" style={{ color: theme.onBrand }}>
          {level.current.name}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.onBrand }}>
          {`${level.lifetime} points earned`}
        </ThemedText>
        {level.next ? (
          <>
            <View style={[styles.track, { backgroundColor: Paper }]}>
              <View
                style={[styles.fill, { width: `${Math.round(level.progress * 100)}%`, backgroundColor: theme.onBrand }]}
              />
            </View>
            <ThemedText type="small" style={{ color: theme.onBrand }}>
              {`${level.toNext} points to ${level.next.name}`}
            </ThemedText>
          </>
        ) : (
          <ThemedText type="small" style={{ color: theme.onBrand }}>
            The top level. Thank you for coming back.
          </ThemedText>
        )}
      </View>

      {level.firstOrderBonus ? (
        <View style={[styles.note, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
          <Icon name="sparkles" size={22} color={theme.text} />
          <ThemedText type="smallBold" style={styles.flex}>
            Welcome deal: your first order earns double points.
          </ThemedText>
        </View>
      ) : null}

      <ThemedText type="subtitle" accessibilityRole="header">
        The levels
      </ThemedText>
      <View style={styles.ladder}>
        {level.levels.map((step, index) => (
          <LevelRow
            key={step.key}
            step={step}
            number={index + 1}
            state={step.key === level.current.key ? 'current' : level.lifetime >= step.minPoints ? 'reached' : 'locked'}
            toGo={Math.max(0, step.minPoints - level.lifetime)}
          />
        ))}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Your level counts every point you&apos;ve ever earned: orders, challenges and badges. Redeeming a reward spends
        points but never takes you down a level.
      </ThemedText>
    </ScrollView>
  );
}

/** One level: a square that says where you stand, its name, from how many points, and its perk. */
function LevelRow({
  step,
  number,
  state,
  toGo,
}: {
  step: Level;
  number: number;
  state: 'current' | 'reached' | 'locked';
  toGo: number;
}) {
  const theme = useTheme();
  const square: { icon: IconName; background: string; color: string } =
    state === 'current'
      ? { icon: 'star', background: theme.brandFill, color: theme.onBrand }
      : state === 'reached'
        ? { icon: 'check', background: theme.surfaceDark, color: theme.onSurfaceDark }
        : { icon: 'lock', background: theme.backgroundSelected, color: theme.textSecondary };
  const status = state === 'current' ? 'Your level' : state === 'reached' ? 'Reached' : `${toGo} points to go`;
  const sticker = levelSticker(step.key);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow },
        // The level you're on: ringed in ink, not marked by colour alone.
        state === 'current' && { borderColor: theme.text },
      ]}
      accessible
      accessibilityLabel={`Level ${number}, ${step.name}, from ${step.minPoints} points. ${step.perk}. ${status}.`}
    >
      <View style={[styles.square, { backgroundColor: square.background }]}>
        {sticker ? (
          <>
            {/* The level's sticker, faded until you reach it; the corner says where you stand. */}
            <Sticker source={Stickers[sticker]} style={[styles.sticker, state === 'locked' && styles.stickerLocked]} />
            <View style={[styles.corner, { backgroundColor: square.background }]}>
              <Icon name={square.icon} size={14} color={square.color} />
            </View>
          </>
        ) : (
          <Icon name={square.icon} size={22} color={square.color} />
        )}
      </View>
      <View style={styles.texts}>
        <ThemedText type="item">{step.name}</ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          {step.minPoints === 0 ? 'From the start' : `From ${step.minPoints} points`}
        </ThemedText>
        <ThemedText type="small">{step.perk}</ThemedText>
        <ThemedText type="captionBold" style={{ color: state === 'locked' ? theme.textSecondary : theme.primaryText }}>
          {status}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 8,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  hero: {
    padding: 20,
    gap: 6,
  },
  track: {
    height: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  ladder: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  square: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticker: {
    width: 58,
    height: 58,
  },
  stickerLocked: {
    opacity: 0.35,
  },
  corner: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    gap: 2,
  },
});
