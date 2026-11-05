import { View } from 'react-native';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';

import { OMark } from '@/components/brand/OMark';
import { useTheme } from '@/hooks/useTheme';

type Kind = 'baguette' | 'plain-baguette' | 'rolls' | 'bowl' | 'cup' | 'mark';

/** Which drawing a menu section gets, from its name ("Bánh mì", "Springrolls"…). */
function kindOf(section: string): Kind {
  const name = section
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (name.includes('banh mi') && name.includes('without')) return 'plain-baguette';
  if (name.includes('banh mi') || name.includes('sandwich')) return 'baguette';
  if (name.includes('spring') || name.includes('roll')) return 'rolls';
  if (/stew|soup|pho|curry|bowl/.test(name)) return 'bowl';
  if (/drink|coffee|ca phe|tea|juice/.test(name)) return 'cup';
  return 'mark';
}

/**
 * A small line drawing for a menu section, ink lines with a sage fill:
 * a baguette for bánh mì, two rolls, a steaming bowl, a cup. Anything else
 * gets the logo's Ộ. Decorative.
 */
export function CategoryIcon({ section, size = 28 }: { section: string; size?: number }) {
  const theme = useTheme();
  const kind = kindOf(section);
  const ink = theme.text;
  const fill = theme.brandFill;
  const line = { stroke: ink, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (kind === 'mark') return <OMark height={size} color={ink} variant="outline" />;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {kind === 'baguette' || kind === 'plain-baguette' ? (
          <G transform="rotate(-35 16 16)">
            <Rect x={3} y={12} width={26} height={8} rx={4} fill={kind === 'baguette' ? fill : 'none'} {...line} />
            <Line x1={10} y1={13.5} x2={12} y2={18.5} {...line} />
            <Line x1={15} y1={13.5} x2={17} y2={18.5} {...line} />
            <Line x1={20} y1={13.5} x2={22} y2={18.5} {...line} />
          </G>
        ) : kind === 'rolls' ? (
          <G transform="rotate(-35 16 16)">
            <Rect x={4} y={8.5} width={24} height={6.5} rx={3.25} fill="none" {...line} />
            <Rect x={4} y={17} width={24} height={6.5} rx={3.25} fill={fill} {...line} />
          </G>
        ) : kind === 'bowl' ? (
          <>
            <Path d="M5 16 H27 A11 10 0 0 1 5 16 Z" fill={fill} {...line} />
            <Path d="M11 12 q-1.6 -2 0 -4.5" fill="none" {...line} />
            <Path d="M16 12 q-1.6 -2 0 -4.5" fill="none" {...line} />
            <Path d="M21 12 q-1.6 -2 0 -4.5" fill="none" {...line} />
          </>
        ) : (
          <>
            <Path d="M9 10 H23 L21 28 H11 Z" fill={fill} {...line} />
            <Line x1={17} y1={10} x2={20} y2={3} {...line} />
          </>
        )}
      </Svg>
    </View>
  );
}
