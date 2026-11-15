import { fireEvent, render, screen } from '@testing-library/react-native';

import type { OfferedPhoto, WeekPhoto } from '@/api/photos';
import PhotosOfTheWeek from '@/components/home/PhotosOfTheWeek';
import OwnerPhotoPicksScreen from '@/components/owner/OwnerPhotoPicksScreen';
import { useOfferedPhotos, usePhotosOfTheWeek, useSetPhotoFeatured } from '@/hooks/usePhotos';

jest.mock('@/hooks/usePhotos', () => ({
  usePhotosOfTheWeek: jest.fn(),
  useOfferedPhotos: jest.fn(),
  useSetPhotoFeatured: jest.fn(),
  useSetPhotoShared: () => ({ mutate: jest.fn(), isPending: false }),
  useReportPhoto: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/useTabBarInset', () => ({ useTabBarInset: () => 0 }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/components/ui/LoadState', () => ({
  ...jest.requireActual('@/components/ui/LoadState'),
  useRefreshControl: () => undefined,
}));

const week = (data: WeekPhoto[] | undefined) =>
  jest.mocked(usePhotosOfTheWeek).mockReturnValue({ data } as ReturnType<typeof usePhotosOfTheWeek>);
const offered = (data: OfferedPhoto[]) =>
  jest
    .mocked(useOfferedPhotos)
    .mockReturnValue({ data, isPending: false, isError: false } as ReturnType<typeof useOfferedPhotos>);

const photo = (id: string, showing: boolean): OfferedPhoto => ({
  id,
  url: `https://files/${id}`,
  path: `u/${id}.jpg`,
  eventTitle: showing ? 'Canal pop-up' : 'Night market',
  offeredAt: '2026-11-14T10:00:00Z',
  showing,
  showsUntil: showing ? '2026-11-19T09:00:00.000Z' : null,
});

beforeEach(() => jest.clearAllMocks());

describe('Photos of the week on Home', () => {
  it('is there with nothing picked, and says how a photo gets there', async () => {
    week([]);
    await render(<PhotosOfTheWeek />);
    expect(screen.getByRole('header', { name: 'Photos of the week' })).toBeTruthy();
    expect(screen.getByText(/No photos picked yet this week/)).toBeTruthy();
  });

  it('shows the picked photos, yours marked as yours', async () => {
    week([
      { id: 'a', url: 'https://files/a', path: 'u/a.jpg', eventTitle: 'Night market', sharedAt: '', mine: false },
      { id: 'b', url: 'https://files/b', path: 'u/b.jpg', eventTitle: 'Canal pop-up', sharedAt: '', mine: true },
    ]);
    await render(<PhotosOfTheWeek />);
    expect(screen.getByRole('button', { name: 'Photo from Night market' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Photo from Canal pop-up, yours' })).toBeTruthy();
    expect(screen.queryByText(/No photos picked yet/)).toBeNull();
  });

  it('stays out of the way until the photos have loaded', async () => {
    week(undefined);
    await render(<PhotosOfTheWeek />);
    expect(screen.queryByText('Photos of the week')).toBeNull();
  });
});

describe('Owner tools: Photos of the week', () => {
  const mutate = jest.fn();
  beforeEach(() => {
    jest
      .mocked(useSetPhotoFeatured)
      .mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useSetPhotoFeatured>);
  });

  it('picks a shared photo for a week', async () => {
    offered([photo('new', false), photo('picked', true)]);
    await render(<OwnerPhotoPicksScreen />);

    expect(screen.getByText('Shared Sat 14 Nov')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Show for a week: photo from Night market' }));
    expect(mutate).toHaveBeenCalledWith({ photoId: 'new', featured: true }, expect.anything());
  });

  it('takes a showing photo out again', async () => {
    offered([photo('new', false), photo('picked', true)]);
    await render(<OwnerPhotoPicksScreen />);

    expect(screen.getByText('On Home until Thu 19 Nov')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Take it out: photo from Canal pop-up' }));
    expect(mutate).toHaveBeenCalledWith({ photoId: 'picked', featured: false }, expect.anything());
  });

  it('says so when nothing is shared and nothing is showing', async () => {
    offered([]);
    await render(<OwnerPhotoPicksScreen />);
    expect(screen.getByText(/Nothing new\. Photos members share/)).toBeTruthy();
    expect(screen.getByText(/No photos on Home right now/)).toBeTruthy();
  });
});
