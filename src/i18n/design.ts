// Presentation-only copy for the redesigned landing page. Kept apart from strings.ts so
// copy and pricing changes there don't collide with layout work here.
import type { Lang } from './strings';

const en = {
  eyebrow: 'Home privacy scanner',
  trust1: 'Only public pages',
  trust2: 'No ads, never sold',
  trust3: 'Bilingual guides',
  sampleLabel: 'Sample scan',
  sampleFound: 'places found',
  sampleTour: '3D tour',
  samplePhotos: 'photos',
  sampleVideo: 'video',
  stepLabel: 'Step',
  sitesCount: '60+ sites checked on every scan',
  scanSub: 'Checking the sites below for your exact address',
};

const es: typeof en = {
  eyebrow: 'Escáner de privacidad del hogar',
  trust1: 'Solo páginas públicas',
  trust2: 'Sin anuncios, nunca vendemos datos',
  trust3: 'Guías en inglés y español',
  sampleLabel: 'Escaneo de ejemplo',
  sampleFound: 'lugares encontrados',
  sampleTour: 'Recorrido 3D',
  samplePhotos: 'fotos',
  sampleVideo: 'video',
  stepLabel: 'Paso',
  sitesCount: 'Más de 60 sitios revisados en cada escaneo',
  scanSub: 'Revisando estos sitios con tu dirección exacta',
};

export const DESIGN: Record<Lang, typeof en> = { en, es };
