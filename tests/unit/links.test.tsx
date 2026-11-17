import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { CateringCard } from '@/components/home/CateringCard';
import { CATERING_URL, INSTAGRAM_URL, openLink } from '@/constants/links';

beforeEach(() => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('opens the catering page on the website from Home', async () => {
  await render(<CateringCard />);
  await fireEvent.press(screen.getByRole('button', { name: /^Plan your catering/ }));
  expect(Linking.openURL).toHaveBeenCalledWith('https://bestel.mongmo-store.com/nl/catering');
  expect(CATERING_URL).toBe('https://bestel.mongmo-store.com/nl/catering');
});

it('opens Mongmo on Instagram', () => {
  openLink(INSTAGRAM_URL);
  expect(Linking.openURL).toHaveBeenCalledWith('https://www.instagram.com/mongmo_store/');
});

it('does nothing when the phone has nothing to open a link with', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No app'));
  expect(() => openLink(INSTAGRAM_URL)).not.toThrow();
  await Promise.resolve();
});
