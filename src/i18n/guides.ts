// Labels for the removal guides (route diagram, "what to click" illustrations, More info, guide index).
// Kept apart from strings.ts so guide work doesn't collide with copy and layout changes there.
import type { Lang } from './strings';
import type { PlaybookGroup } from '@engine/playbooks.ts';

const en = {
  routeTitle: 'How removal works here',
  whatToClick: 'What to click',
  onComputer: 'On a computer',
  inApp: 'In the app or website',
  illustrationNote: 'Drawing of the buttons to look for, not a screenshot. Labels are shown as the site writes them.',
  moreInfo: 'More info',
  lessInfo: 'Less info',
  questions: 'Questions people ask',
  alsoCovers: 'Also covers',
  guidesSearch: 'Search guides (for example: Zillow, KW, TikTok)',
  guidesNone: 'No guide matches that name. The “Agent or brokerage website” guide works for any agent site.',
  groups: {
    source: 'Start here',
    portal: 'Listing portals',
    brokerage: 'Brokerages and agent sites',
    social: 'Social and video',
    tour: '3D tours and property websites',
    rental: 'Rentals',
    search: 'Search engines and maps',
  } as Record<PlaybookGroup, string>,
};

const es: typeof en = {
  routeTitle: 'Cómo se quita aquí',
  whatToClick: 'Dónde hacer clic',
  onComputer: 'En computadora',
  inApp: 'En la app o el sitio web',
  illustrationNote: 'Dibujo de los botones que debes buscar, no es una captura. Las etiquetas aparecen tal como las escribe el sitio (en inglés).',
  moreInfo: 'Más información',
  lessInfo: 'Menos información',
  questions: 'Preguntas frecuentes',
  alsoCovers: 'También cubre',
  guidesSearch: 'Busca una guía (por ejemplo: Zillow, KW, TikTok)',
  guidesNone: 'Ninguna guía coincide con ese nombre. La guía “Sitio de agente o correduría” sirve para cualquier sitio de agente.',
  groups: {
    source: 'Empieza aquí',
    portal: 'Portales de anuncios',
    brokerage: 'Corredurías y sitios de agentes',
    social: 'Redes sociales y video',
    tour: 'Recorridos 3D y sitios de la propiedad',
    rental: 'Alquileres',
    search: 'Buscadores y mapas',
  },
};

export const GUIDE_STRINGS: Record<Lang, typeof en> = { en, es };
