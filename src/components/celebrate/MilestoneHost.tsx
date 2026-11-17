import { useEffect } from 'react';
import { AccessibilityInfo, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Burst } from '@/components/celebrate/Burst';
import { PopIn } from '@/components/celebrate/PopIn';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Coin } from '@/components/ui/Coin';
import { IconButton } from '@/components/ui/IconButton';
import { Sticker } from '@/components/ui/Sticker';
import { TextLink } from '@/components/ui/TextLink';
import { PageInset } from '@/constants/theme';
import { useMotion } from '@/constants/motion';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCelebrationStore, type Milestone } from '@/state/celebrationStore';

/**
 * Shows each milestone (a new level, a new badge) over the whole app, one
 * at a time. Mounted once, near the root.
 */
export function MilestoneHost() {
  const shown = useCelebrationStore((state) => state.queue[0]);
  const appShown = useCelebrationStore((state) => state.appShown);
  const dismiss = useCelebrationStore((state) => state.dismiss);
  // Not over the opening logo animation: once the app is on screen.
  if (!shown || !appShown) return null;
  return <MilestoneScreen key={shown.id} milestone={shown} onClose={dismiss} />;
}

/**
 * The biggest celebration, for the biggest moments: the reward's warm
 * cream, the sticker or badge growing in with a burst around it, what it
 * is, and a way out (or straight to it). Skippable at once: the close
 * button, "Nice", the back gesture. With less motion it's all just there.
 */
function MilestoneScreen({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const motion = useMotion();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    haptics.success();
    AccessibilityInfo.announceForAccessibility(`${milestone.kind}: ${milestone.title}. ${milestone.text}`);
  }, [milestone]);

  const open = () => {
    onClose();
    if (milestone.link) router.push(milestone.link.href);
  };

  return (
    <Modal visible transparent animationType={motion.sheet} onRequestClose={onClose} statusBarTranslucent>
      <View
        accessibilityViewIsModal
        aria-modal
        role="dialog"
        aria-label={milestone.title}
        style={[styles.root, { backgroundColor: theme.rewardFill, paddingTop: insets.top + 8 }]}
      >
        <View style={styles.close}>
          <IconButton icon="close" tone="card" onPress={onClose} accessibilityLabel="Close" />
        </View>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>
          <View style={styles.art}>
            <Burst
              colors={[theme.brand, theme.onReward, theme.tertiary, theme.background]}
              distance={140}
              delay={120}
            />
            <PopIn>
              {milestone.image ? (
                <Sticker source={milestone.image} style={styles.sticker} />
              ) : (
                <Coin icon={milestone.icon ?? 'award'} size={150} />
              )}
            </PopIn>
          </View>
          <ThemedText type="label" style={[styles.center, { color: theme.onReward }]}>
            {milestone.kind}
          </ThemedText>
          <ThemedText
            type="title"
            accessibilityRole="header"
            headingLevel={2}
            style={[styles.center, { color: theme.onReward }]}
          >
            {milestone.title}
          </ThemedText>
          <ThemedText type="default" style={[styles.center, { color: theme.onReward }]}>
            {milestone.text}
          </ThemedText>
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
          <Button label="Nice!" variant="primary" onPress={onClose} />
          {milestone.link ? <TextLink label={milestone.link.label} onPress={open} style={styles.link} /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  close: {
    alignItems: 'flex-end',
    paddingHorizontal: PageInset,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: PageInset,
    gap: 12,
  },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    marginBottom: 12,
  },
  sticker: {
    width: 180,
    height: 180,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    gap: 8,
  },
  link: {
    alignSelf: 'center',
  },
});
