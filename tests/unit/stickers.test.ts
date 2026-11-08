import { categorySticker } from '@/components/order/CategoryIcon';
import { levelSticker, rewardSticker, Stickers } from '@/constants/stickers';

describe('stickers', () => {
  it('gives each of the café’s rewards its sticker', () => {
    expect(rewardSticker('Mongmo sticker pack')).toBe('pack');
    expect(rewardSticker('€2 off your order')).toBe('oMark');
    expect(rewardSticker('Free springrolls')).toBe('springrolls');
    expect(rewardSticker('Free bánh mì')).toBe('banhMi');
    expect(rewardSticker('Mongmo tote bag')).toBe('logo');
    expect(rewardSticker('Free Vietnamese stew')).toBe('stewBowl');
  });

  it('reads coffee as coffee, not as "off"', () => {
    expect(rewardSticker('Free iced coffee')).toBe('phin');
  });

  it('leaves a reward it doesn’t know with its gift icon', () => {
    expect(rewardSticker('Mystery prize')).toBeNull();
  });

  it('has a sticker for every level, and none for an unknown one', () => {
    for (const key of ['dough', 'rising', 'golden', 'crisp']) expect(levelSticker(key)).not.toBeNull();
    expect(levelSticker('platinum')).toBeNull();
  });

  it('picks a menu section’s sticker from its name, accents or not', () => {
    expect(categorySticker('Bánh mì')).toBe('openBanhMi');
    expect(categorySticker('Bánh mì without filling')).toBe('banhMi');
    expect(categorySticker('Springrolls')).toBe('springrolls');
    expect(categorySticker('Vietnamese stews')).toBe('stewBowl');
    expect(categorySticker('Extras')).toBe('chillies');
    expect(categorySticker('Cà phê')).toBe('phin');
    expect(categorySticker('Something new')).toBe('oMark');
  });

  it('only names stickers that exist', () => {
    const names = [rewardSticker('Mongmo sticker pack'), levelSticker('dough'), categorySticker('Drinks')];
    for (const name of names) expect(Stickers[name!]).toBeDefined();
  });
});
