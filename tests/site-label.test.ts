import { describe, it, expect } from 'vitest';
import { siteLabel } from '../src/lib/siteLabel';

describe('site labels in Spanish', () => {
  it('translates the generic words and keeps brand names', () => {
    expect(siteLabel('Agent website (Real Geeks)', 'es')).toBe('Sitio web de agente (Real Geeks)');
    expect(siteLabel('Aryeo property website', 'es')).toBe('Sitio web de la propiedad (Aryeo)');
    expect(siteLabel('Property website', 'es')).toBe('Sitio web de la propiedad');
    expect(siteLabel('Zillow', 'es')).toBe('Zillow');
    expect(siteLabel('Agent website (Real Geeks)', 'en')).toBe('Agent website (Real Geeks)');
  });
});
