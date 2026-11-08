import { Palettes, type ContrastLevel, type Palette } from '@/constants/theme';

/** WCAG 2 contrast ratio between two #RRGGBB colours. */
function ratio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const surfaces = (p: Palette) => [p.background, p.backgroundElement, p.backgroundSelected];
const lowest = (p: Palette, color: string) => Math.min(...surfaces(p).map((surface) => ratio(color, surface)));

const LEVELS: ContrastLevel[] = ['standard', 'medium', 'high'];
/** What main and quiet text must reach on every surface, per level. */
const TEXT_TARGET: Record<ContrastLevel, number> = { standard: 4.5, medium: 7, high: 9 };

describe.each(['light', 'dark'] as const)('%s palettes', (scheme) => {
  it.each(LEVELS)('%s: text, quiet text and status colours meet their target on every surface', (level) => {
    const p = Palettes[scheme][level];
    expect(lowest(p, p.text)).toBeGreaterThanOrEqual(TEXT_TARGET[level]);
    expect(lowest(p, p.textSecondary)).toBeGreaterThanOrEqual(TEXT_TARGET[level]);
    for (const color of [p.primaryText, p.danger, p.success, p.warning]) {
      expect(lowest(p, color)).toBeGreaterThanOrEqual(4.5);
    }
    expect(lowest(p, p.outline)).toBeGreaterThanOrEqual(3);
    expect(ratio(p.onBrand, p.brandFill)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(p.onTertiary, p.tertiary)).toBeGreaterThanOrEqual(4.5);
  });

  it('never lowers contrast as the level goes up', () => {
    const [standard, medium, high] = LEVELS.map((level) => Palettes[scheme][level]);
    for (const role of ['text', 'textSecondary', 'primaryText', 'danger', 'outline'] as const) {
      expect(lowest(medium, medium[role])).toBeGreaterThanOrEqual(lowest(standard, standard[role]) - 0.01);
      expect(lowest(high, high[role])).toBeGreaterThanOrEqual(lowest(medium, medium[role]) - 0.01);
    }
  });

  it('uses no pure white or black', () => {
    for (const level of LEVELS) {
      const colors = Object.values(Palettes[scheme][level]).map((c) => c.toUpperCase());
      expect(colors).not.toContain('#FFFFFF');
      expect(colors).not.toContain('#000000');
    }
  });
});
