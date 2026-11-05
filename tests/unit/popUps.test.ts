import type { PopUpEvent } from '@/types';
import { featuredPopUps } from '@/utils/popUps';

const NOW = new Date('2026-11-05T19:00:00Z');
const KORTRIJK = { latitude: 50.8289, longitude: 3.2664 };
const GHENT = { latitude: 51.0543, longitude: 3.7174 };

const popUp = (id: string, startsAt: string, endsAt: string, coordinates = KORTRIJK) =>
  ({ id, startsAt, endsAt, coordinates }) as PopUpEvent;

const ended = popUp('ended', '2026-11-03T17:00:00Z', '2026-11-03T22:00:00Z');
const liveGhent = popUp('live-ghent', '2026-11-05T17:00:00Z', '2026-11-05T22:00:00Z', GHENT);
const liveKortrijk = popUp('live-kortrijk', '2026-11-05T18:00:00Z', '2026-11-05T23:00:00Z', KORTRIJK);
const tomorrow = popUp('tomorrow', '2026-11-06T17:00:00Z', '2026-11-06T22:00:00Z');
const nextWeek = popUp('next-week', '2026-11-12T17:00:00Z', '2026-11-12T22:00:00Z');

it('puts the nearest live pop-up first, and the rest by start, without ended ones', () => {
  const { featured, upcoming } = featuredPopUps([nextWeek, ended, liveGhent, tomorrow, liveKortrijk], KORTRIJK, NOW);
  expect(featured?.id).toBe('live-kortrijk');
  expect(upcoming.map((event) => event.id)).toEqual(['live-ghent', 'tomorrow', 'next-week']);
});

it('without a location, puts the first live pop-up first', () => {
  expect(featuredPopUps([liveKortrijk, liveGhent], null, NOW).featured?.id).toBe('live-ghent');
});

it('with nothing live, puts the next to start first', () => {
  expect(featuredPopUps([nextWeek, tomorrow, ended], KORTRIJK, NOW).featured?.id).toBe('tomorrow');
});

it('has nothing to feature when every pop-up has ended', () => {
  expect(featuredPopUps([ended], KORTRIJK, NOW)).toEqual({ featured: undefined, upcoming: [] });
});
