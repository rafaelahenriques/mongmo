import { getOfferedPhotos, setPhotoFeatured, sharingState } from '@/api/photos';
import { signedPhotoUrls } from '@/api/storage';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
  getCurrentUserId: jest.fn(),
}));
jest.mock('@/api/storage', () => ({
  signedPhotoUrls: jest.fn(),
  uploadImage: jest.fn(),
}));

const rpc = supabase.rpc as unknown as jest.Mock;
const urls = jest.mocked(signedPhotoUrls);

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-15T12:00:00Z');
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

beforeEach(() => jest.clearAllMocks());

describe('what a member sees on their own photo', () => {
  const state = (shared: number | null, featured: number | null, removed: number | null = null) =>
    sharingState(
      {
        shared_at: shared === null ? null : ago(shared),
        featured_at: featured === null ? null : ago(featured),
        removed_at: removed === null ? null : ago(removed),
      },
      NOW,
    );

  it('is private until they share it', () => {
    expect(state(null, null)).toEqual({ shared: false, showing: false });
  });

  it('is shared, not showing, until staff pick it', () => {
    expect(state(2, null)).toEqual({ shared: true, showing: false });
  });

  it('shows for a week from when staff picked it', () => {
    expect(state(3, 1)).toEqual({ shared: true, showing: true });
    expect(state(9, 6.9)).toEqual({ shared: true, showing: true });
    // Its week is over: back with the shared ones, where staff can pick it again.
    expect(state(9, 7.1)).toEqual({ shared: true, showing: false });
  });

  it('stops counting as shared once staff can no longer pick it (30 days)', () => {
    expect(state(29, null)).toEqual({ shared: true, showing: false });
    expect(state(31, null)).toEqual({ shared: false, showing: false });
    // Picked late: it still gets its whole week.
    expect(state(33, 4)).toEqual({ shared: true, showing: true });
  });

  it('is neither once it was taken down after a report', () => {
    expect(state(3, 1, 0.5)).toEqual({ shared: false, showing: false });
  });
});

describe('staff picking Photos of the week', () => {
  it('lists what members shared, with the day a picked photo stops showing', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'new',
          storage_path: 'u1/new.jpg',
          event_title: 'Night market',
          shared_at: '2026-11-14T10:00:00Z',
          featured_at: null,
          showing: false,
        },
        {
          id: 'picked',
          storage_path: 'u2/picked.jpg',
          event_title: 'Canal pop-up',
          shared_at: '2026-11-10T10:00:00Z',
          featured_at: '2026-11-12T09:00:00Z',
          showing: true,
        },
        {
          id: 'gone',
          storage_path: 'u3/gone.jpg',
          event_title: 'Canal pop-up',
          shared_at: '2026-11-10T10:00:00Z',
          featured_at: null,
          showing: false,
        },
      ],
      error: null,
    });
    // No link for a file that's gone: that photo is left out.
    urls.mockResolvedValue(
      new Map([
        ['u1/new.jpg', 'https://files/new'],
        ['u2/picked.jpg', 'https://files/picked'],
      ]),
    );

    expect(await getOfferedPhotos()).toEqual([
      {
        id: 'new',
        url: 'https://files/new',
        path: 'u1/new.jpg',
        eventTitle: 'Night market',
        offeredAt: '2026-11-14T10:00:00Z',
        showing: false,
        showsUntil: null,
      },
      {
        id: 'picked',
        url: 'https://files/picked',
        path: 'u2/picked.jpg',
        eventTitle: 'Canal pop-up',
        offeredAt: '2026-11-10T10:00:00Z',
        showing: true,
        showsUntil: '2026-11-19T09:00:00.000Z',
      },
    ]);
    expect(rpc).toHaveBeenCalledWith('offered_photos');
    // No names: staff pick a photo, not a person.
    expect(Object.keys((await getOfferedPhotos())[0])).not.toContain('userId');
  });

  it('asks for no links when nothing is shared', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await getOfferedPhotos()).toEqual([]);
    expect(urls).not.toHaveBeenCalled();
  });

  it('picks a photo, or takes it out', async () => {
    rpc.mockResolvedValue({ error: null });
    await setPhotoFeatured('photo-1', true);
    expect(rpc).toHaveBeenLastCalledWith('set_photo_featured', { p_photo_id: 'photo-1', p_featured: true });
    await setPhotoFeatured('photo-1', false);
    expect(rpc).toHaveBeenLastCalledWith('set_photo_featured', { p_photo_id: 'photo-1', p_featured: false });
  });

  it('says when someone who is not staff tries', async () => {
    rpc.mockResolvedValue({
      error: { message: 'Only Mongmo staff can choose Photos of the week', code: '42501' },
    });
    await expect(setPhotoFeatured('photo-1', true)).rejects.toThrow();
  });
});
