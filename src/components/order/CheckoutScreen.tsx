import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { updateProfile } from '@/api/endpoints';
import { PickupHeader } from '@/components/order/PickupHeader';
import { DayStrip } from '@/components/order/DayStrip';
import { TimePills } from '@/components/order/TimePills';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { ListRow } from '@/components/ui/ListRow';
import { Segmented } from '@/components/ui/Segmented';
import { Chapter } from '@/components/ui/Chapter';
import { TextField } from '@/components/ui/TextField';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useEvents } from '@/hooks/useEvents';
import { useEventsWithMenu } from '@/hooks/useEventsWithMenu';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { confirm, errorMessage } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { cartSubtotalCents, useCartStore } from '@/state/cartStore';
import { getEventPhase } from '@/utils/dateTime';
import { formatCents } from '@/utils/orderFormat';
import { pickupDays } from '@/utils/pickupSlots';
import { discountOff } from '@/utils/rewards';

/**
 * O-04 Checkout: where (the bakery or the live pop-up), when (today or
 * tomorrow, only times it's open), your name if you came in as a guest,
 * pay at pickup, and PLACE ORDER with the total. The server prices it.
 */
export default function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const userRewardId = useCartStore((state) => state.userRewardId);
  const place = usePickupPlace();
  const store = useStore();
  const events = useEvents('today');
  const withMenu = useEventsWithMenu();
  const profile = useProfile();
  const account = useAuthUser();
  const { usableRewards } = useAchievements();
  const placeOrder = usePlaceOrder();
  /** The chosen pickup day, yyyy-MM-dd; until one's tapped, the first open day. */
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState(0);
  // Re-reads the clock each minute: times that have passed drop off.
  const now = useNow();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));

  // The live pop-up that takes orders, if there is one.
  const livePopUp = (events.data ?? []).find(
    (event) => withMenu.data?.includes(event.id) && getEventPhase(event.startsAt, event.endsAt) === 'live',
  );

  const days = useMemo(() => (place ? pickupDays(place.pickup, now) : []), [place, now]);
  const zone = place?.timeZone ?? 'Europe/Brussels';
  const todayYmd = formatInTimeZone(now, zone, 'yyyy-MM-dd');
  const tomorrowYmd = formatInTimeZone(now.getTime() + 86_400_000, zone, 'yyyy-MM-dd');
  const openDays = days.filter((entry) => entry.slots.length);
  const chosenDay = openDays.find((entry) => entry.ymd === day) ?? openDays[0];
  const slots = chosenDay?.slots ?? [];
  const pickupAt = slots[Math.min(slot, slots.length - 1)];
  const dayWords = !chosenDay
    ? ''
    : chosenDay.ymd === todayYmd
      ? 'today'
      : chosenDay.ymd === tomorrowYmd
        ? 'tomorrow'
        : formatInTimeZone(chosenDay.slots[0], zone, 'EEE d MMM');

  const discount = usableRewards.find(({ userRewardId: id, reward }) => id === userRewardId && reward.discountCents);
  const subtotal = cartSubtotalCents(items);
  const off = discountOff(discount?.reward, subtotal);
  const needsName = account.data?.isGuest === true && !(profile.data?.name && profile.data.name !== 'Mongmo fan');

  const switchTo = async (kind: 'store' | 'event') => {
    if (!location || kind === location.type) return;
    const target = kind === 'store' ? 'the bakery' : livePopUp?.title;
    const yes = await confirm(
      `Pick up at ${target}?`,
      'Each place has its own menu, so your cart starts again.',
      'Switch',
    );
    if (!yes) return;
    if (kind === 'store' && store.data) useCartStore.getState().setLocation({ type: 'store', storeId: store.data.id });
    if (kind === 'event' && livePopUp) {
      useCartStore.getState().setLocation({ type: 'event', eventId: livePopUp.id, eventTitle: livePopUp.title });
    }
    router.dismissTo('/(orders)');
  };

  const onPlace = async () => {
    if (!location || !pickupAt) return;
    setError(null);
    if (needsName && name.trim()) {
      // Staff call the order by name; a guest's profile is "Mongmo fan".
      await updateProfile({
        name: name.trim(),
        homeCity: profile.data?.homeCity ?? '',
      }).catch(() => undefined);
    }
    placeOrder.mutate(
      {
        location,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          options: item.options.map((option) => option.id),
        })),
        pickupAt: pickupAt.toISOString(),
        userRewardId: discount?.userRewardId ?? null,
      },
      {
        onSuccess: (order) => {
          haptics.success();
          router.dismissTo('/(orders)');
          router.push({ pathname: '/(orders)/order/status/[id]', params: { id: order.id } });
        },
        onError: (mutationError) => {
          haptics.error();
          setError(errorMessage(mutationError, 'Something went wrong. Please try again.'));
        },
      },
    );
  };

  if (!location || items.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <PickupHeader place={place?.name ?? ''} image={place?.image} onBack={back} />
      </View>
    );
  }

  const times = slots.map((at) => formatInTimeZone(at, place?.timeZone ?? 'Europe/Brussels', 'HH:mm'));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <PickupHeader place={place?.name ?? ''} image={place?.image} onBack={back} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <Chapter number="01" title="Where" />
          {livePopUp || location.type === 'event' ? (
            <Segmented
              look="blocks"
              accessibilityLabel="Where"
              value={location.type}
              onChange={(kind) => void switchTo(kind)}
              options={[
                { value: 'store', label: 'Bakery' },
                { value: 'event', label: 'Live pop-up' },
              ]}
            />
          ) : (
            <ThemedText type="caption" themeColor="textSecondary">
              {place ? `${place.name}, ${place.address}` : ''}
            </ThemedText>
          )}
        </View>

        <View style={styles.group}>
          <Chapter number="02" title="When" />
          {/* The café: the open days of the next two weeks. A pop-up only on its own night(s). */}
          {chosenDay && (place?.kind === 'store' || openDays.length > 1) ? (
            <DayStrip
              days={days}
              selected={chosenDay.ymd}
              today={todayYmd}
              onSelect={(next) => {
                setDay(next);
                setSlot(0);
              }}
            />
          ) : null}
          {times.length ? (
            <>
              <ThemedText type="section">{`Ready at ${times[Math.min(slot, times.length - 1)]}, ${dayWords}`}</ThemedText>
              <TimePills times={times} index={Math.min(slot, times.length - 1)} onChange={setSlot} />
            </>
          ) : (
            <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
              {place
                ? `${place.name} isn’t taking pickups ${location.type === 'event' ? 'any more today' : 'today or tomorrow'}.`
                : ' '}
            </ThemedText>
          )}
        </View>

        {needsName ? (
          <View style={styles.group}>
            <Chapter number="03" title="Your details" />
            <TextField
              label="Name"
              hideLabel
              placeholder="Name, so we can call your order"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
              returnKeyType="done"
            />
          </View>
        ) : null}

        <View>
          {discount ? <ListRow title={discount.reward.title} value={`−${formatCents(off)}`} /> : null}
          <ListRow title="Pay at pickup" subtitle="Pay at the counter when you collect it." last />
          <ThemedText type="caption" themeColor="textSecondary" style={styles.vat}>
            Prices include VAT.
          </ThemedText>
        </View>

        {error ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {error}
          </ThemedText>
        ) : null}
      </ScrollView>
      <BlockButton
        label="Place order"
        value={formatCents(subtotal - off)}
        onPress={() => void onPlace()}
        loading={placeOrder.isPending}
        disabled={!pickupAt || (needsName && !name.trim())}
        bottomInset
      />
    </View>
  );
}

const styles = StyleSheet.create({
  vat: {
    marginTop: 8,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 26,
  },
  group: {
    gap: 10,
  },
});
