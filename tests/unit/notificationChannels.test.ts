import { NOTIFICATION_CHANNELS, nearbyNotification } from '@/services/notifications';

describe('Android notification channels', () => {
  it('has one per kind, each named and explained for Android settings', () => {
    expect(Object.keys(NOTIFICATION_CHANNELS).sort()).toEqual(['badges', 'nearby', 'orders', 'reminders', 'rewards']);
    for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
      expect(channel.name.length).toBeGreaterThan(0);
      expect(channel.description.length).toBeGreaterThan(0);
    }
  });

  it('lets order updates pop up and keeps cart reminders quiet', () => {
    expect(NOTIFICATION_CHANNELS.orders.importance).toBeGreaterThan(NOTIFICATION_CHANNELS.nearby.importance);
    expect(NOTIFICATION_CHANNELS.reminders.importance).toBeLessThan(NOTIFICATION_CHANNELS.nearby.importance);
  });

  it('sends nearby pop-up alerts on their own channel', () => {
    expect(nearbyNotification({ id: 'e1', title: 'Mongmo at the Grote Markt', city: 'Kortrijk' }).channel).toBe(
      'nearby',
    );
  });
});
