import { Platform, Switch } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * The app's switch: Bold Red when on, a selection tick of haptics on change.
 * react-native-web colours the "on" thumb from its own `activeThumbColor`
 * prop (teal by default), which React Native's types don't include.
 */
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const webProps = Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : {};
  return (
    <Switch
      value={value}
      onValueChange={(next) => {
        haptics.select();
        onValueChange(next);
      }}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: theme.brandFill, false: theme.backgroundSelected }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={theme.backgroundSelected}
      {...webProps}
    />
  );
}
