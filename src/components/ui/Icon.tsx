import { Platform, type ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import {
  ArrowRight,
  Award,
  Bell,
  Binoculars,
  CalendarRange,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Clock,
  Coffee,
  Compass,
  Crosshair,
  Eye,
  Flame,
  House,
  Image as ImageIcon,
  Layers,
  List,
  LocateFixed,
  Lock,
  LogOut,
  Map as MapIcon,
  MapPin,
  Medal,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Repeat,
  ScanLine,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Ticket,
  Timer,
  Trash2,
  Trophy,
  User,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Every icon the app uses, by meaning. iOS renders the SF Symbol (so icons
 * match the system and scale with it); Android and web render the closest
 * Lucide glyph. No emoji anywhere.
 */
const ICONS = {
  add: { sf: 'plus', fallback: Plus },
  remove: { sf: 'minus', fallback: Minus },
  close: { sf: 'xmark', fallback: X },
  check: { sf: 'checkmark', fallback: Check },
  checkCircle: { sf: 'checkmark.circle.fill', fallback: CircleCheck },
  arrowRight: { sf: 'arrow.right', fallback: ArrowRight },
  chevronRight: { sf: 'chevron.right', fallback: ChevronRight },
  trash: { sf: 'trash', fallback: Trash2 },
  alert: { sf: 'exclamationmark.circle', fallback: CircleAlert },

  home: { sf: 'house.fill', fallback: House },
  bag: { sf: 'bag.fill', fallback: ShoppingBag },
  store: { sf: 'storefront.fill', fallback: Store },
  receipt: { sf: 'list.bullet.clipboard.fill', fallback: ClipboardList },
  ticket: { sf: 'ticket.fill', fallback: Ticket },
  bill: { sf: 'doc.text.fill', fallback: Receipt },
  coffee: { sf: 'cup.and.saucer.fill', fallback: Coffee },
  food: { sf: 'fork.knife', fallback: Utensils },
  takeout: { sf: 'takeoutbag.and.cup.and.straw.fill', fallback: Package },

  pin: { sf: 'mappin.and.ellipse', fallback: MapPin },
  distance: { sf: 'location.fill', fallback: Navigation },
  locate: { sf: 'location.circle.fill', fallback: LocateFixed },
  recenter: { sf: 'scope', fallback: Crosshair },
  map: { sf: 'map.fill', fallback: MapIcon },
  list: { sf: 'list.bullet', fallback: List },
  compass: { sf: 'safari.fill', fallback: Compass },
  clock: { sf: 'clock.fill', fallback: Clock },
  timer: { sf: 'timer', fallback: Timer },
  calendar: { sf: 'calendar', fallback: CalendarRange },

  qrcode: { sf: 'qrcode', fallback: QrCode },
  scan: { sf: 'qrcode.viewfinder', fallback: ScanLine },
  camera: { sf: 'camera.fill', fallback: Camera },
  photo: { sf: 'photo.on.rectangle.angled', fallback: ImageIcon },
  share: { sf: 'square.and.arrow.up', fallback: Share2 },
  eye: { sf: 'eye.fill', fallback: Eye },
  search: { sf: 'magnifyingglass', fallback: Search },
  binoculars: { sf: 'binoculars.fill', fallback: Binoculars },
  people: { sf: 'person.2.fill', fallback: Users },
  person: { sf: 'person.fill', fallback: User },
  phone: { sf: 'phone.fill', fallback: Phone },
  bell: { sf: 'bell.fill', fallback: Bell },
  logout: { sf: 'rectangle.portrait.and.arrow.right', fallback: LogOut },

  star: { sf: 'star.fill', fallback: Star },
  starOutline: { sf: 'star', fallback: Star },
  sparkles: { sf: 'sparkles', fallback: Sparkles },
  trophy: { sf: 'trophy.fill', fallback: Trophy },
  medal: { sf: 'medal.fill', fallback: Medal },
  award: { sf: 'rosette', fallback: Award },
  flame: { sf: 'flame.fill', fallback: Flame },
  repeat: { sf: 'arrow.triangle.2.circlepath', fallback: Repeat },
  layers: { sf: 'square.stack.3d.up.fill', fallback: Layers },
  lock: { sf: 'lock.fill', fallback: Lock },
} as const satisfies Record<string, { sf: SFSymbol; fallback: LucideIcon }>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
  /** Symbol weight on iOS (matches the text it sits next to). */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

/** A decorative icon — label the control around it, not the icon. */
export function Icon({ name, size = 20, color, weight = 'semibold' }: IconProps) {
  const icon = ICONS[name];

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={icon.sf}
        size={size}
        tintColor={color}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  const Fallback = icon.fallback;
  return <Fallback size={size} color={color as string} strokeWidth={weight === 'regular' ? 2 : 2.4} />;
}
