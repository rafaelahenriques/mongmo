import { popUpImage } from '@/constants/brandPhotos';

describe('popUpImage', () => {
  it("uses the pop-up's own picture when it has one", () => {
    expect(popUpImage({ id: 'a', imageUrl: 'https://x.supabase.co/storage/v1/object/public/event-images/a.jpg' })).toBe(
      'https://x.supabase.co/storage/v1/object/public/event-images/a.jpg',
    );
  });

  it('falls back to a bundled Mongmo photo, the same one each time', () => {
    const first = popUpImage({ id: '00000000-0000-0000-0000-0000000000e1', imageUrl: null });
    expect(typeof first).not.toBe('string');
    expect(popUpImage({ id: '00000000-0000-0000-0000-0000000000e1' })).toBe(first);
  });
});
