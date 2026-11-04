import { StyleSheet, View } from 'react-native';

import { ChallengeFrame } from '@/components/challenges/ChallengeFrame';
import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';

export type ConfirmChallengeProps = {
  title: string;
  points: number;
  icon: IconName;
  heading: string;
  /** The rule, in a sentence: "Be within 150 m of the venue". */
  requirement?: string;
  /** Why it can't be done right now, if we can tell before asking. */
  blockedReason?: string;
  sending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * The same template for the types with nothing to enter (Explore, Timing,
 * Collection, Streak): the rule, then DONE. The server still checks it.
 */
export default function ConfirmChallenge({
  title,
  points,
  icon,
  heading,
  requirement,
  blockedReason,
  sending,
  onConfirm,
  onClose,
}: ConfirmChallengeProps) {
  const theme = useTheme();
  return (
    <ChallengeFrame
      title={title}
      points={points}
      heading={heading}
      action={{
        label: 'Done',
        value: `+${points}`,
        onPress: onConfirm,
        disabled: Boolean(blockedReason),
        loading: sending,
      }}
      onClose={onClose}
    >
      {requirement ? (
        <View style={[styles.rule, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.ruleIcon, { backgroundColor: theme.backgroundSelected }]}>
            <Icon name={icon} size={24} color={theme.text} />
          </View>
          <ThemedText type="smallBold" style={styles.flex}>
            {requirement}
          </ThemedText>
        </View>
      ) : null}
      {blockedReason ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {blockedReason}
        </ThemedText>
      ) : null}
    </ChallengeFrame>
  );
}

const styles = StyleSheet.create({
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 14,
    marginTop: 8,
  },
  ruleIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
