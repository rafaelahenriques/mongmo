import { getLeaderboard, removeProfilePhoto, setProfilePhoto } from '@/api/endpoints';
import { uploadImage } from '@/api/storage';
import { getCurrentUserId, supabase } from '@/lib/supabase';

const mockBucket = { remove: jest.fn(), createSignedUrls: jest.fn() };
const mockProfiles = {
  current: null as string | null,
  updateError: null as { message: string; code?: string } | null,
  updates: [] as unknown[],
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    storage: { from: jest.fn(() => mockBucket) },
    from: jest.fn(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { avatar_path: mockProfiles.current }, error: null }) }),
      }),
      update: (values: unknown) => {
        mockProfiles.updates.push(values);
        return { eq: async () => ({ error: mockProfiles.updateError }) };
      },
    })),
  },
  getCurrentUserId: jest.fn(),
}));
jest.mock('@/api/storage', () => ({
  ...jest.requireActual('@/api/storage'),
  uploadImage: jest.fn(),
}));

const rpc = supabase.rpc as unknown as jest.Mock;
const upload = jest.mocked(uploadImage);

beforeEach(() => {
  jest.clearAllMocks();
  mockProfiles.current = null;
  mockProfiles.updateError = null;
  mockProfiles.updates = [];
  jest.mocked(getCurrentUserId).mockResolvedValue('user-1');
  mockBucket.remove.mockResolvedValue({ error: null });
});

describe('setting a profile photo', () => {
  it('uploads to your own folder, saves it, then deletes the one it replaces', async () => {
    mockProfiles.current = 'user-1/old.jpg';
    upload.mockResolvedValue('user-1/new.jpg');

    await setProfilePhoto({ uri: 'file:///photo.jpg', mimeType: 'image/jpeg' });

    expect(upload).toHaveBeenCalledWith({
      bucket: 'avatars',
      folder: 'user-1',
      uri: 'file:///photo.jpg',
      mimeType: 'image/jpeg',
    });
    expect(mockProfiles.updates).toEqual([{ avatar_path: 'user-1/new.jpg' }]);
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
    expect(mockBucket.remove).toHaveBeenCalledWith(['user-1/old.jpg']);
  });

  it("deletes the upload again when the profile can't be saved", async () => {
    upload.mockResolvedValue('user-1/new.jpg');
    mockProfiles.updateError = { message: 'nope' };

    await expect(setProfilePhoto({ uri: 'file:///photo.jpg' })).rejects.toThrow();
    expect(mockBucket.remove).toHaveBeenCalledWith(['user-1/new.jpg']);
  });

  it('removes the photo: the path first, then the file', async () => {
    mockProfiles.current = 'user-1/old.jpg';
    await removeProfilePhoto();
    expect(mockProfiles.updates).toEqual([{ avatar_path: null }]);
    expect(mockBucket.remove).toHaveBeenCalledWith(['user-1/old.jpg']);
  });
});

describe('the leaderboard', () => {
  const ROWS = [
    { user_id: 'a', name: 'Ana', points: 300, avatar_path: 'a/me.jpg' },
    { user_id: 'b', name: 'Bo', points: 200, avatar_path: null },
  ];

  it('comes with a short-lived link to each photo, and none for those without', async () => {
    rpc.mockResolvedValue({ data: ROWS, error: null });
    mockBucket.createSignedUrls.mockResolvedValue({
      data: [{ path: 'a/me.jpg', signedUrl: 'https://signed/a', error: null }],
      error: null,
    });

    expect(await getLeaderboard('weekly')).toEqual([
      { userId: 'a', name: 'Ana', points: 300, photoPath: 'a/me.jpg', photoUrl: 'https://signed/a' },
      { userId: 'b', name: 'Bo', points: 200, photoPath: '', photoUrl: '' },
    ]);
    expect(mockBucket.createSignedUrls).toHaveBeenCalledWith(['a/me.jpg'], 3600);
  });

  it("still shows, with initials, when the photos can't be signed", async () => {
    rpc.mockResolvedValue({ data: ROWS, error: null });
    mockBucket.createSignedUrls.mockResolvedValue({ data: null, error: { message: 'Storage is down' } });

    const rows = await getLeaderboard('all');
    expect(rows.map((row) => row.photoUrl)).toEqual(['', '']);
  });
});
