import { Platform, type ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { LucideIcon } from 'lucide-react-native';
// One module per icon: importing from 'lucide-react-native' itself puts all
// of Lucide's few thousand icons in the app (Metro doesn't drop unused
// exports), a fifth of the JavaScript. Lint stops that import.
import Activity from 'lucide-react-native/icons/activity';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Award from 'lucide-react-native/icons/award';
import Bell from 'lucide-react-native/icons/bell';
import Binoculars from 'lucide-react-native/icons/binoculars';
import BookOpen from 'lucide-react-native/icons/book-open';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Calendar from 'lucide-react-native/icons/calendar';
import CalendarPlus from 'lucide-react-native/icons/calendar-plus';
import Camera from 'lucide-react-native/icons/camera';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import CircleAlert from 'lucide-react-native/icons/circle-exclamation-point';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Clock from 'lucide-react-native/icons/clock';
import Coffee from 'lucide-react-native/icons/coffee';
import Compass from 'lucide-react-native/icons/compass';
import Crosshair from 'lucide-react-native/icons/crosshair';
import Eye from 'lucide-react-native/icons/eye';
import Flame from 'lucide-react-native/icons/flame';
import Gift from 'lucide-react-native/icons/gift';
import House from 'lucide-react-native/icons/house';
import ImageIcon from 'lucide-react-native/icons/image';
import Layers from 'lucide-react-native/icons/layers';
import Leaf from 'lucide-react-native/icons/leaf';
import List from 'lucide-react-native/icons/list';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MapIcon from 'lucide-react-native/icons/map';
import MapPin from 'lucide-react-native/icons/map-pin';
import Medal from 'lucide-react-native/icons/medal';
import Minus from 'lucide-react-native/icons/minus';
import MoonStar from 'lucide-react-native/icons/moon-star';
import Music from 'lucide-react-native/icons/eighth-notes';
import Navigation from 'lucide-react-native/icons/navigation';
import Package from 'lucide-react-native/icons/package';
import Pencil from 'lucide-react-native/icons/pencil';
import Phone from 'lucide-react-native/icons/phone';
import Plus from 'lucide-react-native/icons/plus';
import Printer from 'lucide-react-native/icons/printer';
import QrCode from 'lucide-react-native/icons/qr-code';
import Receipt from 'lucide-react-native/icons/receipt';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import Repeat from 'lucide-react-native/icons/repeat';
import ScanLine from 'lucide-react-native/icons/scan-line';
import Search from 'lucide-react-native/icons/search';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Sparkles from 'lucide-react-native/icons/sparkles';
import SquareCheckBig from 'lucide-react-native/icons/square-check-big';
import Star from 'lucide-react-native/icons/star';
import Store from 'lucide-react-native/icons/store';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Ticket from 'lucide-react-native/icons/ticket';
import Timer from 'lucide-react-native/icons/timer';
import Trash2 from 'lucide-react-native/icons/trash';
import Trophy from 'lucide-react-native/icons/trophy';
import Truck from 'lucide-react-native/icons/truck';
import Upload from 'lucide-react-native/icons/upload';
import User from 'lucide-react-native/icons/user';
import Users from 'lucide-react-native/icons/users';
import Utensils from 'lucide-react-native/icons/utensils';
import Wallet from 'lucide-react-native/icons/wallet';
import X from 'lucide-react-native/icons/x';

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
  chevronUp: { sf: 'chevron.up', fallback: ChevronUp },
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
  calendarAdd: { sf: 'calendar.badge.plus', fallback: CalendarPlus },
  directions: { sf: 'arrow.triangle.turn.up.right.diamond', fallback: Navigation },

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
  wallet: { sf: 'wallet.pass', fallback: Wallet },
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
