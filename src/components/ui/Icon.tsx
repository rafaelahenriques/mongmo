import { Platform, type ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  Binoculars,
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Coffee,
  Compass,
  Crosshair,
  Eye,
  Flame,
  Gift,
  House,
  Image as ImageIcon,
  Layers,
  Leaf,
  List,
  LocateFixed,
  Lock,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPin,
  Medal,
  Minus,
  MoonStar,
  Music,
  Navigation,
  Package,
  Pencil,
  Phone,
  Plus,
  Printer,
  QrCode,
  Receipt,
  ReceiptText,
  Repeat,
  ScanLine,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  SquareCheckBig,
  Star,
  Store,
  Sunrise,
  Ticket,
  Timer,
  Trash2,
  Trophy,
  Truck,
  Upload,
  User,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Every icon the app uses, by meaning, in the design's thin outline style.
 * iOS renders the SF Symbol (so icons match the system and scale with it);
 * Android and web render the closest Lucide glyph. No emoji anywhere.
 */
const ICONS = {
  add: { sf: 'plus', fallback: Plus },
  remove: { sf: 'minus', fallback: Minus },
  close: { sf: 'xmark', fallback: X },
  check: { sf: 'checkmark', fallback: Check },
  checkCircle: { sf: 'checkmark.circle.fill', fallback: CircleCheck },
  checkSquare: { sf: 'checkmark.square', fallback: SquareCheckBig },
  arrowRight: { sf: 'arrow.right', fallback: ArrowRight },
  chevronRight: { sf: 'chevron.right', fallback: ChevronRight },
  chevronLeft: { sf: 'chevron.left', fallback: ChevronLeft },
  trash: { sf: 'trash', fallback: Trash2 },
  alert: { sf: 'exclamationmark.circle', fallback: CircleAlert },

  home: { sf: 'house', fallback: House },
  bag: { sf: 'bag', fallback: ShoppingBag },
  store: { sf: 'storefront', fallback: Store },
  receipt: { sf: 'list.bullet.rectangle', fallback: ReceiptText },
  ticket: { sf: 'ticket', fallback: Ticket },
  bill: { sf: 'doc.text', fallback: Receipt },
  coffee: { sf: 'cup.and.saucer', fallback: Coffee },
  food: { sf: 'fork.knife', fallback: Utensils },
  takeout: { sf: 'takeoutbag.and.cup.and.straw', fallback: Package },
  truck: { sf: 'box.truck', fallback: Truck },
  leaf: { sf: 'leaf', fallback: Leaf },
  book: { sf: 'book', fallback: BookOpen },
  briefcase: { sf: 'briefcase', fallback: Briefcase },
  gift: { sf: 'gift', fallback: Gift },
  music: { sf: 'music.note', fallback: Music },

  pin: { sf: 'mappin.and.ellipse', fallback: MapPin },
  distance: { sf: 'location', fallback: Navigation },
  locate: { sf: 'location.circle', fallback: LocateFixed },
  recenter: { sf: 'scope', fallback: Crosshair },
  map: { sf: 'map', fallback: MapIcon },
  list: { sf: 'list.bullet', fallback: List },
  compass: { sf: 'safari', fallback: Compass },
  clock: { sf: 'clock', fallback: Clock },
  timer: { sf: 'stopwatch', fallback: Timer },
  calendar: { sf: 'calendar', fallback: Calendar },

  qrcode: { sf: 'qrcode', fallback: QrCode },
  scan: { sf: 'qrcode.viewfinder', fallback: ScanLine },
  camera: { sf: 'camera', fallback: Camera },
  photo: { sf: 'photo', fallback: ImageIcon },
  share: { sf: 'square.and.arrow.up', fallback: Upload },
  eye: { sf: 'eye', fallback: Eye },
  search: { sf: 'magnifyingglass', fallback: Search },
  binoculars: { sf: 'binoculars', fallback: Binoculars },
  people: { sf: 'person.2', fallback: Users },
  person: { sf: 'person', fallback: User },
  phone: { sf: 'phone', fallback: Phone },
  mail: { sf: 'envelope', fallback: Mail },
  print: { sf: 'printer', fallback: Printer },
  bell: { sf: 'bell', fallback: Bell },
  settings: { sf: 'slider.horizontal.3', fallback: SlidersHorizontal },
  logout: { sf: 'rectangle.portrait.and.arrow.right', fallback: LogOut },
  edit: { sf: 'pencil', fallback: Pencil },

  star: { sf: 'star', fallback: Star },
  starOutline: { sf: 'star', fallback: Star },
  sparkles: { sf: 'sparkles', fallback: Sparkles },
  trophy: { sf: 'trophy', fallback: Trophy },
  medal: { sf: 'medal', fallback: Medal },
  award: { sf: 'rosette', fallback: Award },
  flame: { sf: 'flame', fallback: Flame },
  moon: { sf: 'moon.stars', fallback: MoonStar },
  sunrise: { sf: 'sunrise', fallback: Sunrise },
  dance: { sf: 'waveform.path.ecg', fallback: Activity },
  repeat: { sf: 'arrow.triangle.2.circlepath', fallback: Repeat },
  layers: { sf: 'square.stack.3d.up', fallback: Layers },
  lock: { sf: 'lock', fallback: Lock },
} as const satisfies Record<string, { sf: SFSymbol; fallback: LucideIcon }>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
  /** Symbol weight on iOS (matches the text it sits next to). */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

/** Lucide stroke widths matching the SF Symbol weights. */
const STROKE = { regular: 1.75, medium: 2, semibold: 2.25, bold: 2.6 } as const;

/** A decorative icon — label the control around it, not the icon. */
export function Icon({ name, size = 20, color, weight = 'regular' }: IconProps) {
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
  return <Fallback size={size} color={color as string} strokeWidth={STROKE[weight]} />;
}
