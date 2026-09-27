import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { IconButton } from '@/components/ui/IconButton';
import { Stepper } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import type { ChallengeRules } from '@/types';
import { CHALLENGE_LIMITS } from '@/utils/challengeConfig';

export type ChallengeRulesFieldsProps = {
  rules: ChallengeRules;
  onChange: (rules: ChallengeRules) => void;
  /** The pop-up's zone, for the timing window. */
  timeZone: string;
};

/** A labelled stepper row: the label on the left, − value + on the right. */
function CountRow({
  label,
  value,
  onChange,
  range,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  range: { min: number; max: number };
  step?: number;
  unit?: string;
}) {
  return (
    <View style={styles.countRow}>
      <ThemedText type="smallBold" style={styles.flex}>
        {label}
      </ThemedText>
      <Stepper
        value={value}
        onChange={onChange}
        min={range.min}
        max={range.max}
        step={step}
        label={label.toLowerCase()}
        formatValue={unit ? (count) => `${count} ${unit}` : String}
      />
    </View>
  );
}

/**
 * The settings that only some challenge types have — how many photos, the
 * time window, the vote's options… Each change hands back new rules of the
 * same type.
 */
export function ChallengeRulesFields({ rules, onChange, timeZone }: ChallengeRulesFieldsProps) {
  switch (rules.type) {
    case 'check_in':
      return (
        <ThemedText type="small" themeColor="textSecondary">
          Nothing to set: scanning the event QR code completes it.
        </ThemedText>
      );

    case 'explore':
      return (
        <CountRow
          label="Distance from the venue"
          value={rules.config.radiusM}
          onChange={(radiusM) => onChange({ ...rules, config: { radiusM } })}
          range={CHALLENGE_LIMITS.radiusM}
          step={CHALLENGE_LIMITS.radiusM.step}
          unit="m"
        />
      );

    case 'capture':
      return (
        <View style={styles.group}>
          <CountRow
            label="Photos to take"
            value={rules.config.photoCount}
            onChange={(photoCount) => onChange({ ...rules, config: { ...rules.config, photoCount } })}
            range={CHALLENGE_LIMITS.capturePhotos}
          />
          <TextField
            label="What to photograph"
            value={rules.config.prompt}
            onChangeText={(prompt) => onChange({ ...rules, config: { ...rules.config, prompt } })}
            placeholder="e.g. your bánh mì with the truck behind it"
            maxLength={CHALLENGE_LIMITS.promptLength}
          />
        </View>
      );

    case 'discovery':
      return (
        <View style={styles.group}>
          <TextField
            label="Hint"
            value={rules.config.hint}
            onChangeText={(hint) => onChange({ ...rules, config: { ...rules.config, hint } })}
            placeholder="e.g. Look up near the menu board"
            maxLength={CHALLENGE_LIMITS.hintLength}
          />
          <CountRow
            label="Photos to take"
            value={rules.config.photoCount}
            onChange={(photoCount) => onChange({ ...rules, config: { ...rules.config, photoCount } })}
            range={CHALLENGE_LIMITS.discoveryPhotos}
          />
        </View>
      );

    case 'taste':
      return (
        <TextField
          label="Dish to rate (optional)"
          value={rules.config.dish}
          onChangeText={(dish) => onChange({ ...rules, config: { dish } })}
          placeholder="e.g. bánh mì"
          maxLength={CHALLENGE_LIMITS.dishLength}
        />
      );

    case 'social':
      return (
        <TextField
          label="Share message (optional)"
          value={rules.config.message}
          onChangeText={(message) => onChange({ ...rules, config: { message } })}
          placeholder="Join me at the Mongmo pop-up!"
          multiline
          maxLength={CHALLENGE_LIMITS.messageLength}
        />
      );

    case 'timing':
      return (
        <View style={styles.group}>
          <DateTimeField
            label="Opens"
            value={new Date(rules.config.startsAt)}
            onChange={(date) => onChange({ ...rules, config: { ...rules.config, startsAt: date.toISOString() } })}
            timeZone={timeZone}
          />
          <DateTimeField
            label="Closes"
            value={new Date(rules.config.endsAt)}
            minimumDate={new Date(rules.config.startsAt)}
            onChange={(date) => onChange({ ...rules, config: { ...rules.config, endsAt: date.toISOString() } })}
            timeZone={timeZone}
          />
        </View>
      );

    case 'collection':
      return (
        <CountRow
          label="Different dishes to order"
          value={rules.config.dishCount}
          onChange={(dishCount) => onChange({ ...rules, config: { dishCount } })}
          range={CHALLENGE_LIMITS.dishCount}
        />
      );

    case 'streak':
      return (
        <CountRow
          label="Pop-ups to visit"
          value={rules.config.popupCount}
          onChange={(popupCount) => onChange({ ...rules, config: { popupCount } })}
          range={CHALLENGE_LIMITS.popupCount}
        />
      );

    case 'community': {
      const { options } = rules.config;
      const setOptions = (next: string[]) => onChange({ ...rules, config: { options: next } });
      return (
        <View style={styles.group}>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <View style={styles.flex}>
                <TextField
                  label={`Option ${index + 1}`}
                  value={option}
                  onChangeText={(value) => setOptions(options.map((item, at) => (at === index ? value : item)))}
                  placeholder={index === 0 ? 'e.g. Phở' : 'e.g. Bún chả'}
                  maxLength={CHALLENGE_LIMITS.voteOptions.length}
                />
              </View>
              {options.length > CHALLENGE_LIMITS.voteOptions.min ? (
                <IconButton
                  icon="trash"
                  tone="muted"
                  size={40}
                  onPress={() => setOptions(options.filter((_, at) => at !== index))}
                  accessibilityLabel={`Remove option ${index + 1}`}
                  style={styles.optionRemove}
                />
              ) : null}
            </View>
          ))}
          {options.length < CHALLENGE_LIMITS.voteOptions.max ? (
            <Button
              label="Add an option"
              variant="ghost"
              size="medium"
              icon="add"
              onPress={() => setOptions([...options, ''])}
            />
          ) : null}
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  optionRemove: {
    marginBottom: 5,
  },
});
