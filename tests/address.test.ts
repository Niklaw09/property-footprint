import { describe, it, expect } from 'vitest';
import { parseAddress, matchAddress, urlText, displayAddress, streetPhrases } from '@engine/address.ts';

describe('parseAddress', () => {
  const cases: [string, Partial<ReturnType<typeof parseAddress>>][] = [
    ['14425 American Kestrel Dr, Austin, TX 78738', { number: '14425', street: 'american kestrel', suffix: 'dr', city: 'Austin', state: 'TX', zip: '78738' }],
    ['4138 E Tanglewood Dr, Phoenix, AZ 85048', { preDir: 'e', street: 'tanglewood', suffix: 'dr' }],
    ['89 Montgomery St SE, Atlanta, GA 30317', { street: 'montgomery', suffix: 'st', postDir: 'se' }],
    ['2727 W 43rd St #402, Minneapolis, MN 55410', { preDir: 'w', street: '43rd', suffix: 'st', unit: '402' }],
    ['3114 SE Lincoln St, Portland, OR 97214', { preDir: 'se', street: 'lincoln' }],
    ['2727 West Forty-Third Street Apt 402, Minneapolis, Minnesota 55410', { preDir: 'w', unit: '402', state: 'MN' }],
    ['123 Main Street Springfield IL 62704', { street: 'main', suffix: 'st', city: 'Springfield', state: 'IL', zip: '62704' }],
    ['500 N Lake Shore Dr, Unit 1204, Chicago, IL 60611', { preDir: 'n', street: 'lake shore', unit: '1204', city: 'Chicago' }],
    ['14732 San Marsala Ct, Tampa, FL 33626', { street: 'san marsala', suffix: 'ct' }],
    ['10 Park Ave, New York, NY', { street: 'park', suffix: 'ave', city: 'New York', state: 'NY' }],
  ];
  for (const [input, expected] of cases) {
    it(input, () => expect(parseAddress(input)).toMatchObject(expected));
  }
  it('rejects missing number', () => expect(() => parseAddress('Main St, Austin, TX')).toThrow());
});

describe('matchAddress', () => {
  const kestrel = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
  it('matches zillow-style slug', () => {
    expect(matchAddress(kestrel, urlText('https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2')).level).toBe('exact');
  });
  it('matches spelled out suffix', () => {
    expect(matchAddress(kestrel, urlText('https://www.spyglassrealty.com/listing/5322164-14425-american-kestrel-drive-austin-tx-78738')).level).toBe('exact');
  });
  it('rejects a different house number', () => {
    expect(matchAddress(kestrel, '14427 American Kestrel Dr Austin TX 78738').level).toBe('none');
  });
  it('rejects different suffix', () => {
    expect(matchAddress(kestrel, '14425 American Kestrel Ct Austin TX 78738').level).toBe('none');
  });
  it('rejects different zip without city', () => {
    expect(matchAddress(kestrel, '14425 American Kestrel Dr 78701').level).toBe('none');
  });
  const unit = parseAddress('2727 W 43rd St #402, Minneapolis, MN 55410');
  it('rejects other units in the building', () => {
    expect(matchAddress(unit, '2727 W 43rd St #408, Minneapolis, MN 55410').level).toBe('none');
    expect(matchAddress(unit, urlText('https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-409/home/1')).level).toBe('none');
  });
  it('accepts the right unit', () => {
    expect(matchAddress(unit, urlText('https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-402/home/49888403')).level).toBe('exact');
  });
  it('building page without unit is only likely', () => {
    expect(matchAddress(unit, '2727 W 43rd St, Minneapolis, MN 55410').level).toBe('likely');
  });
  const se = parseAddress('89 Montgomery St SE, Atlanta, GA 30317');
  it('accepts a page that drops trailing directional', () => {
    expect(matchAddress(se, urlText('https://homesbymarco.com/properties/89-montgomery-st-atlanta-ga-30317/1436273')).level).toBe('exact');
  });
  it('rejects a different directional', () => {
    expect(matchAddress(se, '89 Montgomery St NE Atlanta GA 30317').level).toBe('none');
  });
  it('rejects school district false positive', () => {
    expect(matchAddress(se, 'Atlanta Public Schools 89 students Montgomery').level).toBe('none');
  });
  it('display and phrases', () => {
    expect(displayAddress(unit)).toBe('2727 W 43rd St #402, Minneapolis, MN 55410');
    expect(streetPhrases(se)).toEqual(['89 Montgomery St SE', '89 Montgomery Street Southeast', '89 Montgomery St']);
  });
});
