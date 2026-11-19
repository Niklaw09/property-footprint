// Removal playbooks. Each one says what is realistically possible, the exact steps, and where it came from.
// status: "verified" = steps checked against the site's own help page or form on checkedOn;
//         "researched" = route and contacts confirmed on the site itself, but the owner screens weren't walked through;
//         "general" = a sound method for a whole class of sites (agent IDX sites, tour hosts).
// Re-check every playbook at least every 90 days: these flows change.
//
// Copy rules: be fair to listing agents (marketing a home online is their job; most follow procedure, and
// copies spread to sites they don't control). The MLS route is one option, not the fix: some MLSs keep
// sold-listing photos on file. HomePrint never sends requests for people; it makes doing it yourself easy.
// Spanish uses "tú" to match the rest of the app. The letters (letters.ts) stay formal ("usted").

export type L = { en: string; es: string };

/** A drawn, generic "what to click" illustration: the exact on-screen labels in order. Not a screenshot. */
export interface UiTrail {
  surface: 'web' | 'app';
  site?: string; // shown in the mock address bar, e.g. "zillow.com"
  trail: string[]; // literal button/menu labels as the site shows them (sites are in English)
}

export interface Step extends L {
  link?: { url: string } & L;
  more?: L; // "More info" expandable text under the step
  ui?: UiTrail;
}
export type LetterKind = 'site_support' | 'listing_agent' | 'photographer' | 'privacy_rights' | 'uploader';
export type VerifyMode = 'page_gone' | 'photos_hidden' | 'manual';
export type PlaybookGroup = 'source' | 'portal' | 'brokerage' | 'social' | 'tour' | 'rental' | 'search';

export interface MoreInfo {
  q: L;
  a: L;
}

export interface Playbook {
  key: string;
  name: string;
  nameEs?: string; // only when the English name is a description, not a brand
  group: PlaybookGroup;
  covers?: string[]; // other brands/sites this guide also handles
  difficulty: 'easy' | 'medium' | 'hard';
  minutes: number;
  status: 'verified' | 'researched' | 'general';
  checkedOn: string;
  outcome: L; // what removal realistically looks like
  flow: L[]; // the route at a glance, drawn as a small diagram (3 to 5 stops)
  steps: Step[];
  letters: LetterKind[];
  contacts?: { kind: 'email' | 'phone' | 'url'; value: string; label: L }[];
  tips?: L[];
  more?: MoreInfo[]; // guide-level "More info" questions
  verify: VerifyMode;
  sources: string[];
}

const NOV18 = '2026-11-18';
const NOV19 = '2026-11-19';

// ---------- Shared pieces ----------

const MLS_TIP: L = {
  en: 'Most listing photos start in the local MLS and are copied to many sites. If your MLS allows it, the listing agent can mark the photos private, which removes them from agent (IDX) sites at the next update. Some MLSs require sold-listing photos to stay on file, so ask this site directly too.',
  es: 'La mayoría de las fotos salen del MLS local y se copian a muchos sitios. Si tu MLS lo permite, el agente del anuncio puede marcarlas como privadas, y desaparecen de los sitios de agentes (IDX) en la siguiente actualización. Algunos MLS exigen conservar las fotos de casas vendidas, así que pídelo también a este sitio directamente.',
};
const SEARCH_TIP: L = {
  en: 'After a page changes, Google and Bing can keep showing the old photos for weeks. Use the Google and Bing guides to ask them to refresh.',
  es: 'Después de que una página cambia, Google y Bing pueden seguir mostrando las fotos viejas durante semanas. Usa las guías de Google y Bing para pedirles que actualicen.',
};
const AGENT_FAIR: L = {
  en: 'Be kind to the agent. Marketing your home online was part of their job, most followed proper procedure, and once photos are published, copies spread to sites they don’t control. Ask for what they can do; don’t expect them to fix every site.',
  es: 'Sé amable con el agente. Promocionar la casa en internet era parte de su trabajo, la mayoría siguió el procedimiento correcto y, una vez publicadas, las fotos se copian a sitios que no controla. Pide lo que esté a su alcance; no esperes que arregle todos los sitios.',
};
const PRIVACY_LAW_INFO: MoreInfo = {
  q: { en: 'Does a privacy-law request force them to delete the photos?', es: '¿Una solicitud por ley de privacidad los obliga a borrar las fotos?' },
  a: {
    en: 'Not always. State privacy laws (California’s and similar ones in about 20 states) cover personal information a company holds about you. Listing photos came from the MLS, not from you, and companies may say an exemption applies. Many still remove them as a courtesy, so the request is worth sending, but treat it as one route, not a guarantee.',
    es: 'No siempre. Las leyes estatales de privacidad (la de California y otras parecidas en unos 20 estados) cubren la información personal que una empresa tiene sobre ti. Las fotos del anuncio vinieron del MLS, no de ti, y la empresa puede decir que aplica una excepción. Muchas las quitan por cortesía, así que vale la pena enviarla, pero tómala como una vía, no como una garantía.',
  },
};
const PROOF_INFO: MoreInfo = {
  q: { en: 'What counts as proof that I own the home?', es: '¿Qué sirve como prueba de que soy dueño de la casa?' },
  a: {
    en: 'A recorded deed, a recent property tax bill, title or trust papers, or a recent HOA statement, showing your name and the address. A link to your county’s public property record often works too. Black out account numbers and anything else they don’t need. Send it only through the site’s own form or the email address on its official contact page.',
    es: 'Una escritura registrada, un recibo reciente de impuestos a la propiedad, documentos de título o de fideicomiso, o un estado de cuenta reciente de la HOA, con tu nombre y la dirección. Un enlace al registro público de propiedad de tu condado también suele servir. Tacha números de cuenta y todo lo que no necesiten. Envíala solo por el formulario del sitio o al correo de su página oficial de contacto.',
  },
};
const UPLOADER_FIRST: MoreInfo = {
  q: { en: 'Why ask the person who posted it first?', es: '¿Por qué pedírselo primero a quien lo publicó?' },
  a: {
    en: 'Platforms usually leave listing photos and tour videos up because they don’t break their rules: they show a house, not a person. The account that posted them can delete or hide them in seconds, and most agents and photographers will when a homeowner asks politely.',
    es: 'Las plataformas suelen dejar las fotos y videos de anuncios porque no rompen sus reglas: muestran una casa, no a una persona. La cuenta que los publicó puede borrarlos u ocultarlos en segundos, y la mayoría de los agentes y fotógrafos lo hacen cuando un dueño lo pide con amabilidad.',
  },
};
const KEEP_RECORDS: Step = {
  en: 'Save a screenshot of the page today and note the date and any case number you get. Mark the request as sent in your tracker so we re-check it for you.',
  es: 'Guarda una captura de la página hoy y anota la fecha y cualquier número de caso que recibas. Marca la solicitud como enviada en tu lista para que la volvamos a revisar por ti.',
};
const WAIT_AND_RECHECK: Step = {
  en: 'Give it 7 to 14 days, then press “Re-scan now” on your report (or open the page while signed out) to check that it changed.',
  es: 'Espera de 7 a 14 días y luego pulsa “Volver a escanear” en tu informe (o abre la página sin iniciar sesión) para comprobar que cambió.',
};

const COSTAR_PORTAL = 'https://privacy.costar.com/DSAR-submission/';
const COMPASS_WEBFORM = 'https://preferences.compass.com/';

// ---------- Brokerage helper ----------
// National brokerages show their own agents' listings plus MLS (IDX) listings in their markets.
// Most pages are run by a local franchise office, so the office or agent is the fastest route.

interface BrokerageInput {
  key: string;
  name: string;
  nameEs?: string;
  covers?: string[];
  status: Playbook['status'];
  checkedOn: string;
  outcome: L;
  privacy?: { step: L; link?: { url: string } & L };
  contacts?: Playbook['contacts'];
  extraMore?: MoreInfo[];
  sources: string[];
}

function brokerage(b: BrokerageInput): Playbook {
  const steps: Step[] = [
    {
      en: 'Look at the page and find who is named on it: the listing agent and their office, or a line like “Listing courtesy of …”. That tells you whether this brokerage sold your home or is only showing another brokerage’s MLS listing.',
      es: 'Mira la página y busca quién aparece: el agente del anuncio y su oficina, o una línea como “Listing courtesy of …”. Eso te dice si esta agencia inmobiliaria vendió tu casa o solo muestra un anuncio del MLS de otra agencia inmobiliaria.',
      more: {
        en: 'If this brokerage listed your home, its agent can take the listing down from the brokerage site directly and is your best first contact. If it only shows another brokerage’s listing through the MLS, the photos usually disappear here once the listing agent marks them private in the MLS, where the MLS allows it.',
        es: 'Si esta agencia inmobiliaria publicó tu casa, su agente puede quitar el anuncio del sitio directamente y es tu mejor primer contacto. Si solo muestra el anuncio de otra agencia inmobiliaria a través del MLS, las fotos suelen desaparecer aquí cuando el agente del anuncio las marca como privadas en el MLS, donde el MLS lo permite.',
      },
    },
    {
      en: 'Send the listing agent the request letter. Ask them to mark the photos, tours and floor plans private in the MLS if their MLS allows it, and to remove the listing from their own and their brokerage’s website.',
      es: 'Envía al agente del anuncio la carta de solicitud. Pídele que marque como privadas las fotos, recorridos y planos en el MLS si su MLS lo permite, y que quite el anuncio de su sitio y del de su agencia inmobiliaria.',
      more: AGENT_FAIR,
    },
    {
      en: 'If the photos are still on this site after two weeks, contact the local office named on the page (phone or email) and ask them to hide the listing’s photos on the brokerage website. Paste the site request letter with the exact link.',
      es: 'Si las fotos siguen en este sitio después de dos semanas, contacta a la oficina local que aparece en la página (teléfono o correo) y pide que oculten las fotos del anuncio en el sitio de la agencia inmobiliaria. Pega la carta para el sitio con el enlace exacto.',
    },
  ];
  if (b.privacy) steps.push({ ...b.privacy.step, link: b.privacy.link, more: PRIVACY_LAW_INFO.a });
  steps.push(WAIT_AND_RECHECK, KEEP_RECORDS);
  return {
    key: b.key,
    name: b.name,
    nameEs: b.nameEs,
    group: 'brokerage',
    covers: b.covers,
    difficulty: 'medium',
    minutes: 15,
    status: b.status,
    checkedOn: b.checkedOn,
    outcome: b.outcome,
    flow: [
      { en: 'Find who listed it', es: 'Ver quién lo publicó' },
      { en: 'Ask the agent (MLS + their site)', es: 'Pedir al agente (MLS + su sitio)' },
      { en: 'Ask the local office', es: 'Pedir a la oficina local' },
      ...(b.privacy ? [{ en: 'Privacy request', es: 'Solicitud de privacidad' }] : []),
    ],
    steps,
    letters: b.privacy ? ['listing_agent', 'site_support', 'privacy_rights'] : ['listing_agent', 'site_support'],
    contacts: b.contacts,
    tips: [MLS_TIP, SEARCH_TIP],
    more: [
      {
        q: { en: 'Why is a brokerage I never used showing my home?', es: '¿Por qué una agencia inmobiliaria que nunca usé muestra mi casa?' },
        a: {
          en: 'Brokerages share listings with each other through the MLS (this is called IDX), so every brokerage site in your area can show every listing. They keep showing sold homes because the MLS feed allows it. When the photos are marked private or removed in the MLS, they drop off these sites too.',
          es: 'Las agencias inmobiliarias comparten anuncios entre sí a través del MLS (se llama IDX), así que cada sitio de agencia inmobiliaria de tu zona puede mostrar todos los anuncios. Siguen mostrando casas vendidas porque el MLS lo permite. Cuando las fotos se marcan como privadas o se quitan en el MLS, también desaparecen de estos sitios.',
        },
      },
      ...(b.extraMore ?? []),
      ...(b.privacy ? [PRIVACY_LAW_INFO] : []),
    ],
    verify: 'photos_hidden',
    sources: b.sources,
  };
}

// ---------- Social and video helper ----------

interface SocialInput {
  key: string;
  name: string;
  outcome: L;
  report: Step; // the platform's own route
  extra?: Step[];
  status: Playbook['status'];
  checkedOn: string;
  more?: MoreInfo[];
  sources: string[];
  minutes?: number;
}

function social(s: SocialInput): Playbook {
  return {
    key: s.key,
    name: s.name,
    group: 'social',
    difficulty: 'medium',
    minutes: s.minutes ?? 10,
    status: s.status,
    checkedOn: s.checkedOn,
    outcome: s.outcome,
    flow: [
      { en: 'Ask the account that posted it', es: 'Pedir a la cuenta que lo publicó' },
      { en: 'No answer in 7 days?', es: '¿Sin respuesta en 7 días?' },
      { en: `Report to ${s.name}`, es: `Reportar a ${s.name}` },
      { en: 'Refresh Google', es: 'Actualizar Google' },
    ],
    steps: [
      {
        en: 'Open the post and note the account name. Agents and brokerages usually list an email or website on their profile. Send them the request letter (or a short direct message) asking them to delete the post or make it private.',
        es: 'Abre la publicación y anota el nombre de la cuenta. Los agentes y agencias inmobiliarias suelen poner un correo o sitio web en su perfil. Envíales la carta de solicitud (o un mensaje directo corto) pidiendo que borren la publicación o la hagan privada.',
        more: UPLOADER_FIRST.a,
      },
      ...(s.extra ?? []),
      s.report,
      KEEP_RECORDS,
    ],
    letters: ['uploader'],
    tips: [SEARCH_TIP],
    more: [UPLOADER_FIRST, ...(s.more ?? [])],
    verify: 'page_gone',
    sources: s.sources,
  };
}

// ---------- Playbooks ----------

export const PLAYBOOKS: Record<string, Playbook> = {
  // ===== Major portals =====
  zillow: {
    key: 'zillow', name: 'Zillow', group: 'portal', covers: ['Trulia', 'Zillow 3D Home'], difficulty: 'easy', minutes: 15, status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'Zillow keeps the property page, but once you claim the home you can hide every listing photo with one checkbox. Hiding them on Zillow also removes them from Trulia. The main image then switches to Google Street View.',
      es: 'Zillow mantiene la página de la propiedad, pero cuando reclamas la casa puedes ocultar todas las fotos del anuncio con una casilla. Ocultarlas en Zillow también las quita de Trulia. La imagen principal pasa a ser Google Street View.',
    },
    flow: [
      { en: 'Claim ownership', es: 'Reclamar la casa' },
      { en: 'Owner View → Edit Facts', es: 'Owner View → Edit Facts' },
      { en: 'Hide photos', es: 'Ocultar fotos' },
      { en: 'Gone from Zillow and Trulia', es: 'Fuera de Zillow y Trulia' },
    ],
    steps: [
      {
        en: 'Sign in to Zillow (a free account is fine) and open your home’s page. You can find it by searching your address.',
        es: 'Inicia sesión en Zillow (una cuenta gratis sirve) y abre la página de tu casa. La encuentras buscando tu dirección.',
        link: { url: 'https://www.zillow.com/', en: 'Open Zillow', es: 'Abrir Zillow' },
      },
      {
        en: 'On the property page, select “More”, then “Claim ownership”. Answer the verification questions and agree to the Terms of Use.',
        es: 'En la página de la propiedad, selecciona “More” y luego “Claim ownership”. Responde las preguntas de verificación y acepta los Terms of Use.',
        ui: { surface: 'web', site: 'zillow.com', trail: ['More', 'Claim ownership'] },
        more: {
          en: 'Zillow asks questions only the owner is likely to know, drawn from public records. If you just bought the home, the records may not show you yet: wait for the deed to record (usually a few weeks), or contact Zillow support with your deed.',
          es: 'Zillow hace preguntas que probablemente solo sabe el dueño, tomadas de registros públicos. Si acabas de comprar, puede que los registros aún no te muestren: espera a que se registre la escritura (suele tardar unas semanas) o contacta al soporte de Zillow con tu escritura.',
        },
      },
      {
        en: 'Select your profile icon, then “Your Home”, and pick your home. This opens it in Owner View.',
        es: 'Selecciona el ícono de tu perfil, luego “Your Home”, y elige tu casa. Se abre en Owner View.',
        ui: { surface: 'web', site: 'zillow.com', trail: ['Profile icon', 'Your Home', 'Your property'] },
      },
      {
        en: 'In Owner View, select “Edit Facts”. Check “Hide photos displayed on your home’s Zillow page”, then select “Save Changes”.',
        es: 'En Owner View, selecciona “Edit Facts”. Marca “Hide photos displayed on your home’s Zillow page” y luego selecciona “Save Changes”.',
        ui: { surface: 'web', site: 'zillow.com', trail: ['Edit Facts', '☑ Hide photos displayed on your home’s Zillow page', 'Save Changes'] },
        link: { url: 'https://www.zillow.help/article/how-do-i-remove-or-delete-photos-of-my-home-zd4405400686995', en: 'Zillow help: hide your home’s photos', es: 'Ayuda de Zillow: ocultar las fotos' },
      },
      {
        en: 'Open the page in a private browser window (signed out) to confirm the photos are gone. Trulia updates from Zillow within a few days.',
        es: 'Abre la página en una ventana privada (sin sesión) para confirmar que las fotos ya no aparecen. Trulia se actualiza desde Zillow en unos días.',
      },
      {
        en: 'If you can’t claim the home or don’t see the checkbox, contact Zillow through its help center with the page link and proof of ownership.',
        es: 'Si no puedes reclamar la casa o no ves la casilla, contacta a Zillow desde su centro de ayuda con el enlace de la página y prueba de propiedad.',
        link: { url: 'https://www.zillow.help/contact-us', en: 'Contact Zillow', es: 'Contactar a Zillow' },
      },
      KEEP_RECORDS,
    ],
    letters: ['site_support', 'listing_agent'],
    tips: [
      { en: 'Hiding is better than removing photos one by one: it hides them all at once and covers photos that arrive later from the MLS feed.', es: 'Ocultar es mejor que quitar las fotos una por una: las oculta todas a la vez y cubre las que lleguen después desde el MLS.' },
      { en: 'Zillow can’t change the Street View picture. Use the Google Street View guide to blur your house; Zillow picks up the blur when Google refreshes your area.', es: 'Zillow no puede cambiar la imagen de Street View. Usa la guía de Google Street View para difuminar tu casa; Zillow lo toma cuando Google actualiza tu zona.' },
    ],
    more: [
      {
        q: { en: 'Why won’t Zillow delete the whole page?', es: '¿Por qué Zillow no borra la página completa?' },
        a: {
          en: 'Zillow keeps a page for nearly every home, built from public records (beds, baths, tax history, sale prices). Those facts are public. The listing photos are the part you control as the owner, and they are what shows the inside of your home.',
          es: 'Zillow tiene una página para casi todas las casas, armada con registros públicos (habitaciones, baños, impuestos, precios de venta). Esos datos son públicos. Las fotos del anuncio son la parte que controlas como dueño, y son las que muestran el interior de tu casa.',
        },
      },
      {
        q: { en: 'My home is for sale or for rent right now. Can I hide them?', es: 'Mi casa está en venta o en alquiler ahora. ¿Puedo ocultarlas?' },
        a: {
          en: 'Not while it’s an active listing. Zillow says changes to active-listing photos go through the listing agent. Hide them once the listing is closed or withdrawn.',
          es: 'No mientras sea un anuncio activo. Zillow indica que los cambios a las fotos de un anuncio activo se hacen con el agente del anuncio. Ocúltalas cuando el anuncio se cierre o se retire.',
        },
      },
      PROOF_INFO,
    ],
    verify: 'photos_hidden',
    sources: ['https://www.zillow.help/article/how-do-i-remove-or-delete-photos-of-my-home-zd4405400686995', 'https://www.security.org/data-removal/house-photos/'],
  },

  trulia: {
    key: 'trulia', name: 'Trulia', group: 'portal', difficulty: 'easy', minutes: 5, status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'Trulia gets its photos from Zillow (same company). Hide the photos on Zillow and they disappear from Trulia too.',
      es: 'Trulia toma sus fotos de Zillow (la misma empresa). Oculta las fotos en Zillow y también desaparecen de Trulia.',
    },
    flow: [
      { en: 'Hide photos on Zillow', es: 'Ocultar fotos en Zillow' },
      { en: 'Trulia updates', es: 'Trulia se actualiza' },
      { en: 'Check Trulia', es: 'Revisar Trulia' },
    ],
    steps: [
      {
        en: 'Follow the Zillow guide first. It is the only step Trulia needs.',
        es: 'Sigue primero la guía de Zillow. Es el único paso que Trulia necesita.',
        link: { url: 'https://www.zillow.help/article/how-do-i-remove-or-delete-photos-of-my-home-zd4405400686995', en: 'Zillow help: hide your home’s photos', es: 'Ayuda de Zillow: ocultar las fotos' },
      },
      {
        en: 'After a few days, open the Trulia page in a private window to confirm the photos are gone.',
        es: 'Después de unos días, abre la página de Trulia en una ventana privada para confirmar que ya no están.',
      },
      {
        en: 'If they remain, contact Zillow support and include the Trulia link.',
        es: 'Si siguen, contacta al soporte de Zillow e incluye el enlace de Trulia.',
        link: { url: 'https://www.zillow.help/contact-us', en: 'Contact Zillow', es: 'Contactar a Zillow' },
      },
    ],
    letters: ['site_support'],
    verify: 'photos_hidden',
    sources: ['https://www.zillow.help/article/how-do-i-remove-or-delete-photos-of-my-home-zd4405400686995'],
  },

  zillow_rentals: {
    key: 'zillow_rentals', name: 'HotPads / Zillow Rentals', group: 'rental', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Old rental listings come from a landlord or property manager account. They can deactivate the listing; Zillow Rentals support can step in if they don’t.',
      es: 'Los anuncios de alquiler viejos vienen de la cuenta de un propietario o administrador. Pueden desactivar el anuncio; el soporte de Zillow Rentals puede intervenir si no lo hacen.',
    },
    flow: [
      { en: 'Ask whoever posted the rental', es: 'Pedir a quien publicó el alquiler' },
      { en: 'Zillow support', es: 'Soporte de Zillow' },
      { en: 'Check HotPads', es: 'Revisar HotPads' },
    ],
    steps: [
      { en: 'Find who posted the rental (it’s on the listing) and ask them to deactivate it and delete its photos.', es: 'Busca quién publicó el alquiler (aparece en el anuncio) y pídele que lo desactive y borre las fotos.' },
      {
        en: 'If you own the home and can’t reach them, contact Zillow support with the link and proof of ownership.',
        es: 'Si eres dueño y no logras contactarlos, comunícate con el soporte de Zillow con el enlace y prueba de propiedad.',
        link: { url: 'https://www.zillow.help/contact-us', en: 'Contact Zillow', es: 'Contactar a Zillow' },
      },
      KEEP_RECORDS,
    ],
    letters: ['site_support'],
    more: [PROOF_INFO],
    verify: 'page_gone',
    sources: ['https://www.zillow.help/contact-us'],
  },

  redfin: {
    key: 'redfin', name: 'Redfin', group: 'portal', difficulty: 'easy', minutes: 10, status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'Redfin keeps the property page, but once you claim the home you can hide all the old MLS photos yourself. Redfin then shows a Street View image.',
      es: 'Redfin mantiene la página de la propiedad, pero cuando reclamas la casa puedes ocultar tú mismo todas las fotos viejas del MLS. Redfin muestra entonces una imagen de Street View.',
    },
    flow: [
      { en: 'Claim home (computer)', es: 'Reclamar la casa (computadora)' },
      { en: 'My homes → Edit Photos', es: 'My homes → Edit Photos' },
      { en: 'Hide listing photos', es: 'Ocultar fotos' },
    ],
    steps: [
      {
        en: 'Use a computer: this isn’t available in the Redfin app. Sign in to Redfin and make sure your account has a password set and is verified.',
        es: 'Usa una computadora: no está disponible en la app de Redfin. Inicia sesión en Redfin y asegúrate de que tu cuenta tenga contraseña y esté verificada.',
        link: { url: 'https://www.redfin.com/', en: 'Open Redfin', es: 'Abrir Redfin' },
      },
      {
        en: 'Open your home’s page. In the “Is this your home?” section, select “Claim home” and complete the ownership check.',
        es: 'Abre la página de tu casa. En la sección “Is this your home?”, selecciona “Claim home” y completa la verificación de propiedad.',
        ui: { surface: 'web', site: 'redfin.com', trail: ['Is this your home?', 'Claim home'] },
      },
      {
        en: 'From the menu under your name (top right), choose “My homes”, then select the home if you claimed more than one.',
        es: 'En el menú bajo tu nombre (arriba a la derecha), elige “My homes” y selecciona la casa si reclamaste más de una.',
        ui: { surface: 'web', site: 'redfin.com', trail: ['Your name ▾', 'My homes', 'Your property'] },
      },
      {
        en: 'Select “Edit Photos”, check “Hide listing photos”, and confirm with “Yes, Hide Photos”.',
        es: 'Selecciona “Edit Photos”, marca “Hide listing photos” y confirma con “Yes, Hide Photos”.',
        ui: { surface: 'web', site: 'redfin.com', trail: ['Edit Photos', '☑ Hide listing photos', 'Yes, Hide Photos'] },
        link: { url: 'https://support.redfin.com/hc/en-us/articles/360013247432-Removing-Photos-on-a-Sold-Home', en: 'Redfin help: removing photos on a sold home', es: 'Ayuda de Redfin: quitar fotos de una casa vendida' },
      },
      {
        en: 'If you can’t claim the home, read Redfin’s Photos FAQ and use “Submit a request” at the bottom of any help article.',
        es: 'Si no puedes reclamar la casa, lee las preguntas frecuentes de fotos de Redfin y usa “Submit a request” al final de cualquier artículo de ayuda.',
        link: { url: 'https://support.redfin.com/hc/en-us/articles/45556093357595-Photos-FAQ', en: 'Redfin Photos FAQ', es: 'Preguntas frecuentes de fotos de Redfin' },
      },
      KEEP_RECORDS,
    ],
    letters: ['site_support', 'listing_agent'],
    tips: [{ en: 'Once the photos are hidden, Redfin shows Street View. Use the Google Street View guide if you want that blurred too.', es: 'Cuando se ocultan las fotos, Redfin muestra Street View. Usa la guía de Google Street View si también quieres difuminarla.' }],
    more: [
      {
        q: { en: 'The home isn’t off-market yet. Can I hide photos?', es: 'La casa todavía no salió del mercado. ¿Puedo ocultar las fotos?' },
        a: {
          en: 'Redfin’s photo hiding is for homes that are off-market. If it’s still listed, ask the listing agent; after closing, the option appears in your Owner Dashboard.',
          es: 'La opción de ocultar fotos de Redfin es para casas fuera del mercado. Si sigue publicada, pídeselo al agente; después del cierre, la opción aparece en tu Owner Dashboard.',
        },
      },
      PROOF_INFO,
    ],
    verify: 'photos_hidden',
    sources: ['https://support.redfin.com/hc/en-us/articles/360013247432-Removing-Photos-on-a-Sold-Home', 'https://support.redfin.com/hc/en-us/articles/45556093357595-Photos-FAQ'],
  },

  realtor: {
    key: 'realtor', name: 'Realtor.com', group: 'portal', covers: ['HomeFinder'], difficulty: 'medium', minutes: 20, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Once the listing is off-market (closed, expired or canceled), Realtor.com removes the photos for the verified owner, either through the owner tools or by Customer Care. HomeFinder shares Realtor.com’s listings and follows.',
      es: 'Cuando el anuncio sale del mercado (vendido, vencido o cancelado), Realtor.com quita las fotos para el dueño verificado, ya sea con las herramientas para dueños o por Customer Care. HomeFinder comparte los anuncios de Realtor.com y se actualiza igual.',
    },
    flow: [
      { en: 'Claim in My Home', es: 'Reclamar en My Home' },
      { en: 'Edit home → remove photos', es: 'Edit home → quitar fotos' },
      { en: 'Or email Customer Care with proof', es: 'O escribir a Customer Care con prueba' },
    ],
    steps: [
      {
        en: 'Option 1, owner tools: go to Realtor.com “My Home”, look up your address and claim it, then verify ownership.',
        es: 'Opción 1, herramientas para dueños: ve a “My Home” de Realtor.com, busca tu dirección y reclámala, luego verifica que eres el dueño.',
        link: { url: 'https://www.realtor.com/myhome', en: 'Realtor.com My Home', es: 'Realtor.com My Home' },
        ui: { surface: 'web', site: 'realtor.com', trail: ['My Home', 'Enter your address', 'Claim'] },
      },
      {
        en: 'Hover over your profile icon, choose your home under “My home”, select “Edit home” and remove the photos.',
        es: 'Pasa el cursor por el ícono de tu perfil, elige tu casa en “My home”, selecciona “Edit home” y quita las fotos.',
        ui: { surface: 'web', site: 'realtor.com', trail: ['Profile icon', 'My home', 'Edit home', 'Remove photos'] },
        more: {
          en: 'Some owners report that edits are blocked for up to six months after a sale. If so, use option 2: Customer Care can act sooner.',
          es: 'Algunos dueños cuentan que no se puede editar hasta seis meses después de la venta. Si te pasa, usa la opción 2: Customer Care puede actuar antes.',
        },
      },
      {
        en: 'Option 2, Customer Care: email or call and ask them to remove the photos from the off-market listing. Attach proof with your name and the address. They accept a deed, title, recent tax bill, trust papers, a recent HOA statement or a public-record link. Utility bills are not accepted.',
        es: 'Opción 2, Customer Care: escribe o llama y pide que quiten las fotos del anuncio fuera del mercado. Adjunta una prueba con tu nombre y la dirección. Aceptan escritura, título, recibo reciente de impuestos, documentos de fideicomiso, estado de cuenta reciente de la HOA o un enlace al registro público. No aceptan facturas de servicios.',
        more: PROOF_INFO.a,
      },
      KEEP_RECORDS,
    ],
    contacts: [
      { kind: 'email', value: 'customercare@realtor.com', label: { en: 'Customer Care email', es: 'Correo de Customer Care' } },
      { kind: 'phone', value: '(800) 878-4166', label: { en: 'Customer Care phone', es: 'Teléfono de Customer Care' } },
    ],
    letters: ['site_support'],
    more: [
      {
        q: { en: 'Why does the listing have to be off-market?', es: '¿Por qué el anuncio tiene que estar fuera del mercado?' },
        a: {
          en: 'While a home is for sale, the listing agent controls its photos through the MLS. After it closes, expires or is canceled, Realtor.com lets the owner have them removed.',
          es: 'Mientras la casa está en venta, el agente controla las fotos a través del MLS. Cuando se cierra, vence o se cancela, Realtor.com permite que el dueño pida quitarlas.',
        },
      },
    ],
    verify: 'photos_hidden',
    sources: ['https://connectmls.smartmls.com/hc/en-us/articles/29527808816155-Remove-photos-from-Realtor-com', 'https://www.security.org/data-removal/house-photos/'],
  },

  homes: {
    key: 'homes', name: 'Homes.com', group: 'portal', difficulty: 'medium', minutes: 20, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Homes.com (owned by CoStar) has no button for owners to hide photos. Its support team can remove photos, tours and floor plans after confirming you own the home. CoStar’s privacy form is a second route.',
      es: 'Homes.com (de CoStar) no tiene un botón para que los dueños oculten las fotos. Su equipo de soporte puede quitar fotos, recorridos y planos después de confirmar que eres el dueño. El formulario de privacidad de CoStar es una segunda vía.',
    },
    flow: [
      { en: 'Email or call support', es: 'Escribir o llamar al soporte' },
      { en: 'Send proof when asked', es: 'Enviar prueba si la piden' },
      { en: 'Or CoStar privacy form', es: 'O formulario de privacidad de CoStar' },
    ],
    steps: [
      { en: 'Copy the exact Homes.com page link from your report.', es: 'Copia el enlace exacto de la página de Homes.com de tu informe.' },
      {
        en: 'Email support@homes.com (or call) as the homeowner. Use the site request letter: it asks them to remove interior photos, floor plans and virtual tours and to give you a case number.',
        es: 'Escribe a support@homes.com (o llama) como dueño. Usa la carta para el sitio: pide quitar fotos interiores, planos y recorridos virtuales, y que te den un número de caso.',
        link: { url: 'https://www.homes.com/about/contact-us/', en: 'Homes.com contact page', es: 'Página de contacto de Homes.com' },
      },
      {
        en: 'Send proof of ownership only when they ask, and only by replying to their email. If they say they can’t, ask which agent or feed supplied the photos.',
        es: 'Envía la prueba de propiedad solo cuando la pidan, y solo respondiendo a su correo. Si dicen que no pueden, pregunta qué agente o fuente envió las fotos.',
        more: PROOF_INFO.a,
      },
      {
        en: 'For a formal request, use “Exercise your Privacy Rights” at the bottom of Homes.com. It opens CoStar’s privacy form, which also covers Apartments.com and other CoStar sites.',
        es: 'Para una solicitud formal, usa “Exercise your Privacy Rights” al pie de Homes.com. Abre el formulario de privacidad de CoStar, que también cubre Apartments.com y otros sitios de CoStar.',
        link: { url: COSTAR_PORTAL, en: 'CoStar privacy form', es: 'Formulario de privacidad de CoStar' },
        ui: { surface: 'web', site: 'homes.com', trail: ['Footer', 'Exercise your Privacy Rights'] },
      },
      KEEP_RECORDS,
    ],
    contacts: [
      { kind: 'email', value: 'support@homes.com', label: { en: 'Homes.com support', es: 'Soporte de Homes.com' } },
      { kind: 'phone', value: '(800) 431-5509', label: { en: 'Homes.com support phone', es: 'Teléfono de soporte de Homes.com' } },
    ],
    letters: ['site_support', 'privacy_rights'],
    more: [PROOF_INFO, PRIVACY_LAW_INFO],
    verify: 'photos_hidden',
    sources: ['https://www.homes.com/about/contact-us/', COSTAR_PORTAL],
  },

  movoto: {
    key: 'movoto', name: 'Movoto', group: 'portal', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Movoto (run by OJO) shows MLS listings. Photos usually disappear when the listing agent marks them private in the MLS, where the MLS allows it. Movoto’s privacy team takes requests by email and phone.',
      es: 'Movoto (de OJO) muestra anuncios del MLS. Las fotos suelen desaparecer cuando el agente las marca como privadas en el MLS, donde el MLS lo permite. El equipo de privacidad de Movoto recibe solicitudes por correo y teléfono.',
    },
    flow: [
      { en: 'Ask the listing agent (MLS)', es: 'Pedir al agente (MLS)' },
      { en: 'Email Movoto privacy', es: 'Escribir a privacidad de Movoto' },
      { en: 'Check the page', es: 'Revisar la página' },
    ],
    steps: [
      { en: 'Ask your listing agent to mark the photos private in the MLS if their MLS allows it (listing agent letter).', es: 'Pide a tu agente del anuncio que marque las fotos como privadas en el MLS si su MLS lo permite (carta para el agente).', more: AGENT_FAIR },
      {
        en: 'Email privacy@ojolabs.com with the page link and ask them to remove the photos. You can also call (877) 375-0727.',
        es: 'Escribe a privacy@ojolabs.com con el enlace de la página y pide que quiten las fotos. También puedes llamar al (877) 375-0727.',
        link: { url: 'https://www.movoto.com/about/ca_privacy/', en: 'Movoto privacy page', es: 'Página de privacidad de Movoto' },
      },
      WAIT_AND_RECHECK,
      KEEP_RECORDS,
    ],
    contacts: [
      { kind: 'email', value: 'privacy@ojolabs.com', label: { en: 'Movoto (OJO) privacy', es: 'Privacidad de Movoto (OJO)' } },
      { kind: 'phone', value: '(877) 375-0727', label: { en: 'Privacy requests phone', es: 'Teléfono para solicitudes de privacidad' } },
    ],
    letters: ['site_support', 'listing_agent', 'privacy_rights'],
    tips: [MLS_TIP],
    more: [PRIVACY_LAW_INFO],
    verify: 'photos_hidden',
    sources: ['https://www.movoto.com/about/ca_privacy/'],
  },

  estately: {
    key: 'estately', name: 'Estately', group: 'portal', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Estately is a brokerage site fed by the MLS. Photos go away when the listing agent marks them private in the MLS (where allowed), or when Estately removes them on request.',
      es: 'Estately es un sitio de agencia inmobiliaria alimentado por el MLS. Las fotos desaparecen cuando el agente las marca como privadas en el MLS (donde se permite) o cuando Estately las quita a pedido.',
    },
    flow: [
      { en: 'Ask the listing agent (MLS)', es: 'Pedir al agente (MLS)' },
      { en: 'Email Estately', es: 'Escribir a Estately' },
      { en: 'Check the page', es: 'Revisar la página' },
    ],
    steps: [
      { en: 'Ask your listing agent to mark the photos private in the MLS if their MLS allows it (listing agent letter).', es: 'Pide a tu agente del anuncio que marque las fotos como privadas en el MLS si su MLS lo permite (carta para el agente).', more: AGENT_FAIR },
      {
        en: 'Email dataprivacy@estately.com (or call (888) 545-5523) with the page link and ask them to remove the photos.',
        es: 'Escribe a dataprivacy@estately.com (o llama al (888) 545-5523) con el enlace de la página y pide que quiten las fotos.',
        link: { url: 'https://www.estately.com/about/privacy', en: 'Estately privacy page', es: 'Página de privacidad de Estately' },
      },
      WAIT_AND_RECHECK,
      KEEP_RECORDS,
    ],
    contacts: [
      { kind: 'email', value: 'dataprivacy@estately.com', label: { en: 'Estately privacy', es: 'Privacidad de Estately' } },
      { kind: 'phone', value: '(888) 545-5523', label: { en: 'Estately phone', es: 'Teléfono de Estately' } },
    ],
    letters: ['site_support', 'listing_agent', 'privacy_rights'],
    tips: [MLS_TIP],
    more: [PRIVACY_LAW_INFO],
    verify: 'photos_hidden',
    sources: ['https://www.estately.com/about/privacy'],
  },

  har: {
    key: 'har', name: 'HAR.com', group: 'portal', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: NOV19,
    outcome: {
      en: 'HAR.com is run by the Houston Association of Realtors and shows Texas MLS listings. The listing agent can change the photos in the MLS; HAR’s support team can help owners.',
      es: 'HAR.com lo maneja la Asociación de Realtors de Houston y muestra anuncios del MLS de Texas. El agente puede cambiar las fotos en el MLS; el equipo de soporte de HAR puede ayudar a los dueños.',
    },
    flow: [
      { en: 'Ask the listing agent (MLS)', es: 'Pedir al agente (MLS)' },
      { en: 'Contact HAR.com', es: 'Contactar a HAR.com' },
      { en: 'Check the page', es: 'Revisar la página' },
    ],
    steps: [
      { en: 'Ask the listing agent to mark the photos private in the MLS (listing agent letter).', es: 'Pide al agente del anuncio que marque las fotos como privadas en el MLS (carta para el agente).', more: AGENT_FAIR },
      {
        en: 'Use HAR.com’s Contact us page and paste the site request letter with the page link.',
        es: 'Usa la página Contact us de HAR.com y pega la carta para el sitio con el enlace de la página.',
        link: { url: 'https://www.har.com/contact-us/', en: 'HAR.com Contact us', es: 'Contacto de HAR.com' },
      },
      WAIT_AND_RECHECK,
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: ['https://www.har.com/contact-us/'],
  },

  houzeo: {
    key: 'houzeo', name: 'Houzeo', group: 'portal', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: NOV18,
    outcome: {
      en: 'Houzeo shows MLS listings. MLS changes flow through, and Houzeo support can also remove the photos.',
      es: 'Houzeo muestra anuncios del MLS. Los cambios del MLS se reflejan, y el soporte de Houzeo también puede quitar las fotos.',
    },
    flow: [
      { en: 'Ask the listing agent (MLS)', es: 'Pedir al agente (MLS)' },
      { en: 'Contact Houzeo', es: 'Contactar a Houzeo' },
    ],
    steps: [
      { en: 'Ask your listing agent to update the MLS (listing agent letter).', es: 'Pide a tu agente del anuncio que actualice el MLS (carta para el agente).', more: AGENT_FAIR },
      { en: 'Contact Houzeo support (link in the site footer) with the page link.', es: 'Contacta al soporte de Houzeo (enlace al pie del sitio) con el enlace de la página.', link: { url: 'https://www.houzeo.com/', en: 'Open Houzeo', es: 'Abrir Houzeo' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    verify: 'photos_hidden',
    sources: [],
  },

  generic_portal: {
    key: 'generic_portal', name: 'Listing website', nameEs: 'Sitio de anuncios', group: 'portal', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: NOV18,
    outcome: {
      en: 'Most listing sites will remove photos for a verified owner, and MLS changes flow through to them.',
      es: 'La mayoría de los sitios de anuncios quitan las fotos para un dueño verificado, y los cambios del MLS se reflejan en ellos.',
    },
    flow: [
      { en: 'Owner tool on the page?', es: '¿Herramienta para dueños?' },
      { en: 'Else: support or privacy contact', es: 'Si no: soporte o privacidad' },
      { en: 'Ask the agent (MLS)', es: 'Pedir al agente (MLS)' },
    ],
    steps: [
      {
        en: 'Look for an owner tool on the page (“Claim this home”, “Are you the owner?”, “Owner dashboard”). If there is one, use it to hide the photos.',
        es: 'Busca una herramienta para dueños en la página (“Claim this home”, “Are you the owner?”, “Owner dashboard”). Si existe, úsala para ocultar las fotos.',
        ui: { surface: 'web', trail: ['Claim this home', 'Verify', 'Hide photos'] },
      },
      {
        en: 'Otherwise send the site request letter to its support or privacy contact. Look in the footer for “Contact”, “Privacy” or “Your Privacy Choices”.',
        es: 'Si no, envía la carta para el sitio a su contacto de soporte o privacidad. Busca al pie de la página “Contact”, “Privacy” o “Your Privacy Choices”.',
        ui: { surface: 'web', trail: ['Footer', 'Contact / Privacy'] },
      },
      { en: 'Ask your listing agent to update the MLS so the photos don’t come back.', es: 'Pide a tu agente del anuncio que actualice el MLS para que las fotos no vuelvan.', more: AGENT_FAIR },
      KEEP_RECORDS,
    ],
    letters: ['site_support', 'listing_agent'],
    tips: [MLS_TIP],
    more: [PROOF_INFO],
    verify: 'photos_hidden',
    sources: [],
  },

  // ===== National brokerages =====
  kw: brokerage({
    key: 'kw', name: 'Keller Williams', covers: ['kw.com'], status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'kw.com and Keller Williams agent sites show KW listings and MLS listings in each market. Each listing is controlled by the agent and their local Market Center. Keller Williams also takes deletion requests by email and web form.',
      es: 'kw.com y los sitios de agentes de Keller Williams muestran anuncios de KW y del MLS de cada mercado. Cada anuncio lo controla el agente y su Market Center local. Keller Williams también recibe solicitudes de eliminación por correo y formulario web.',
    },
    privacy: {
      step: {
        en: 'For a formal request, email DSAR-KW@kw.com (say it’s a deletion request in the subject) or use Keller Williams’ privacy request form, and include the page link.',
        es: 'Para una solicitud formal, escribe a DSAR-KW@kw.com (indica en el asunto que es una solicitud de eliminación) o usa el formulario de privacidad de Keller Williams, e incluye el enlace de la página.',
      },
      link: { url: 'https://kwdsar.zendesk.com/hc/en-us/requests/new', en: 'Keller Williams privacy request form', es: 'Formulario de privacidad de Keller Williams' },
    },
    contacts: [{ kind: 'email', value: 'DSAR-KW@kw.com', label: { en: 'Keller Williams privacy requests', es: 'Solicitudes de privacidad de Keller Williams' } }],
    sources: ['https://legal.kw.com/privacy-policy'],
  }),

  remax: brokerage({
    key: 'remax', name: 'RE/MAX', covers: ['Real Brokerage (onereal.com)'], status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'remax.com shows RE/MAX listings and MLS listings. Local RE/MAX offices are independently owned and run their own sites. RE/MAX’s privacy notice is now shared with Real Brokerage, and their privacy team takes requests by email.',
      es: 'remax.com muestra anuncios de RE/MAX y del MLS. Las oficinas locales de RE/MAX son independientes y manejan sus propios sitios. El aviso de privacidad de RE/MAX ahora es el mismo que el de Real Brokerage, y su equipo de privacidad recibe solicitudes por correo.',
    },
    privacy: {
      step: {
        en: 'For a formal request, email privacy@realremaxgroup.com with the page link.',
        es: 'Para una solicitud formal, escribe a privacy@realremaxgroup.com con el enlace de la página.',
      },
      link: { url: 'https://www.remax.com/privacy-notice', en: 'RE/MAX privacy notice', es: 'Aviso de privacidad de RE/MAX' },
    },
    contacts: [{ kind: 'email', value: 'privacy@realremaxgroup.com', label: { en: 'RE/MAX and Real privacy team', es: 'Equipo de privacidad de RE/MAX y Real' } }],
    extraMore: [{
      q: { en: 'The page is on a local RE/MAX office’s own website.', es: 'La página está en el sitio propio de una oficina local de RE/MAX.' },
      a: {
        en: 'Independently owned offices follow their own privacy notice. Contact that office directly; it can hide the listing on its site in minutes.',
        es: 'Las oficinas independientes siguen su propio aviso de privacidad. Contacta directamente a esa oficina; puede ocultar el anuncio en su sitio en minutos.',
      },
    }],
    sources: ['https://www.remax.com/privacy-notice'],
  }),

  real: brokerage({
    key: 'real', name: 'Real Brokerage', status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Real Brokerage (onereal.com) shows its agents’ listings and MLS listings. Real and RE/MAX share one privacy team.',
      es: 'Real Brokerage (onereal.com) muestra anuncios de sus agentes y del MLS. Real y RE/MAX comparten un equipo de privacidad.',
    },
    privacy: {
      step: { en: 'For a formal request, email privacy@realremaxgroup.com with the page link.', es: 'Para una solicitud formal, escribe a privacy@realremaxgroup.com con el enlace de la página.' },
      link: { url: 'https://www.onereal.com/pages/privacy-policy/', en: 'Real privacy policy', es: 'Política de privacidad de Real' },
    },
    contacts: [{ kind: 'email', value: 'privacy@realremaxgroup.com', label: { en: 'Real privacy team', es: 'Equipo de privacidad de Real' } }],
    sources: ['https://www.onereal.com/pages/privacy-policy/'],
  }),

  exp: brokerage({
    key: 'exp', name: 'eXp Realty', status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'exprealty.com and eXp agent sites show eXp and MLS listings. eXp agents work independently and can remove a listing from their own site; eXp takes privacy requests through a web form.',
      es: 'exprealty.com y los sitios de agentes de eXp muestran anuncios de eXp y del MLS. Los agentes de eXp trabajan de forma independiente y pueden quitar un anuncio de su sitio; eXp recibe solicitudes de privacidad por un formulario web.',
    },
    privacy: {
      step: { en: 'For a formal request, use “Privacy Rights Request” in the exprealty.com footer and include the page link.', es: 'Para una solicitud formal, usa “Privacy Rights Request” al pie de exprealty.com e incluye el enlace de la página.' },
      link: { url: 'https://submit-irm.trustarc.com/services/validation/e6d7516d-df9c-4404-bd9f-21a2f0d2a6a4/', en: 'eXp privacy rights request', es: 'Solicitud de privacidad de eXp' },
    },
    sources: ['https://www.exprealty.com/', 'https://expworldholdings.com/privacy-policy/'],
  }),

  compass: brokerage({
    key: 'compass', name: 'Compass', status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Compass shows its agents’ listings and MLS listings. If a Compass agent sold your home, they can take it down. Compass takes privacy requests through one web form in its Privacy Center.',
      es: 'Compass muestra anuncios de sus agentes y del MLS. Si un agente de Compass vendió tu casa, puede quitarla. Compass recibe solicitudes de privacidad por un formulario web en su Privacy Center.',
    },
    privacy: {
      step: { en: 'For a formal request, use the webform in Compass’s Privacy Center and include the page link.', es: 'Para una solicitud formal, usa el formulario del Privacy Center de Compass e incluye el enlace de la página.' },
      link: { url: COMPASS_WEBFORM, en: 'Compass privacy webform', es: 'Formulario de privacidad de Compass' },
    },
    sources: ['https://www.compass.com/legal/privacy-policy/'],
  }),

  anywhere: brokerage({
    key: 'anywhere', name: 'Coldwell Banker / Century 21 / Sotheby’s / BHGRE / ERA / Corcoran',
    covers: ['Coldwell Banker', 'Century 21', 'Sotheby’s International Realty', 'Better Homes and Gardens Real Estate', 'ERA', 'Corcoran'],
    status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'These brands (formerly Anywhere Real Estate) show their own and MLS listings in each market, mostly through locally owned offices. Their privacy links now lead to Compass’s privacy policy and request form, which covers all of them.',
      es: 'Estas marcas (antes Anywhere Real Estate) muestran anuncios propios y del MLS de cada mercado, casi siempre a través de oficinas locales independientes. Sus enlaces de privacidad ahora llevan a la política y al formulario de Compass, que las cubre a todas.',
    },
    privacy: {
      step: {
        en: 'For a formal request, use the privacy request form (the brand’s “Privacy” or “Do Not Sell” link in the footer leads there) and include the page link.',
        es: 'Para una solicitud formal, usa el formulario de privacidad (el enlace “Privacy” o “Do Not Sell” al pie del sitio de la marca lleva ahí) e incluye el enlace de la página.',
      },
      link: { url: COMPASS_WEBFORM, en: 'Privacy request form', es: 'Formulario de privacidad' },
    },
    sources: ['https://www.coldwellbankerhomes.com/', 'https://www.century21.com/', 'https://privacy.anywhere.re/en/global-privacy-notice/'],
  }),

  bhhs: brokerage({
    key: 'bhhs', name: 'Berkshire Hathaway HomeServices', status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'bhhs.com and the regional BHHS sites show BHHS and MLS listings. Each regional company is independently operated and controls its own site. The national brand takes privacy requests through a web form.',
      es: 'bhhs.com y los sitios regionales de BHHS muestran anuncios de BHHS y del MLS. Cada empresa regional es independiente y controla su propio sitio. La marca nacional recibe solicitudes de privacidad por un formulario web.',
    },
    privacy: {
      step: { en: 'For a formal request, use “Do Not Sell My Personal Information” at the bottom of bhhs.com (it opens the privacy request form) and include the page link. You can also call 800-999-1120.', es: 'Para una solicitud formal, usa “Do Not Sell My Personal Information” al pie de bhhs.com (abre el formulario de privacidad) e incluye el enlace de la página. También puedes llamar al 800-999-1120.' },
      link: { url: 'https://privacyportal-cdn.onetrust.com/dsarwebform/b54c596e-12ac-4af7-8bd3-3876905378fa/c2c623ed-e1e7-4a60-847e-93393d137e78.html', en: 'BHHS privacy request form', es: 'Formulario de privacidad de BHHS' },
    },
    contacts: [{ kind: 'phone', value: '800-999-1120', label: { en: 'BHHS privacy line', es: 'Línea de privacidad de BHHS' } }],
    sources: ['https://www.bhhs.com/privacy-policy'],
  }),

  howardhanna: brokerage({
    key: 'howardhanna', name: 'Howard Hanna', status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'howardhanna.com shows Howard Hanna and MLS listings. Its compliance team takes privacy requests by email.',
      es: 'howardhanna.com muestra anuncios de Howard Hanna y del MLS. Su equipo de cumplimiento recibe solicitudes de privacidad por correo.',
    },
    privacy: {
      step: { en: 'For a formal request, email Compliance@howardhanna.com with the subject “Data Privacy Request” and the page link.', es: 'Para una solicitud formal, escribe a Compliance@howardhanna.com con el asunto “Data Privacy Request” y el enlace de la página.' },
      link: { url: 'https://www.howardhanna.com/privacy-policy', en: 'Howard Hanna privacy policy', es: 'Política de privacidad de Howard Hanna' },
    },
    contacts: [{ kind: 'email', value: 'Compliance@howardhanna.com', label: { en: 'Howard Hanna privacy requests', es: 'Solicitudes de privacidad de Howard Hanna' } }],
    sources: ['https://www.howardhanna.com/privacy-policy'],
  }),

  brokerage: brokerage({
    key: 'brokerage', name: 'Agent or brokerage website', nameEs: 'Sitio de agente o agencia inmobiliaria',
    covers: ['Fathom', 'Douglas Elliman', 'Windermere', 'Weichert', 'HomeSmart', 'LPT Realty', 'Realty ONE Group', 'Engel & Völkers', 'Long & Foster', 'United Real Estate', '@properties'],
    status: 'general', checkedOn: NOV19,
    outcome: {
      en: 'Agent and brokerage websites copy listings from the MLS (IDX). Where the MLS lets photos be marked private, they drop off these sites at the next update; some MLSs keep sold-listing photos on file. Either way, the agent or office named on the page can remove theirs.',
      es: 'Los sitios de agentes y agencias inmobiliarias copian anuncios del MLS (IDX). Donde el MLS permite marcar las fotos como privadas, desaparecen de estos sitios en la siguiente actualización; algunos MLS conservan las fotos de casas vendidas. En cualquier caso, el agente u oficina que aparece en la página puede quitar las suyas.',
    },
    privacy: {
      step: {
        en: 'If the office doesn’t respond, look for “Privacy”, “Do Not Sell” or “Your Privacy Choices” in the site footer and send the formal privacy request.',
        es: 'Si la oficina no responde, busca “Privacy”, “Do Not Sell” o “Your Privacy Choices” al pie del sitio y envía la solicitud formal de privacidad.',
      },
    },
    sources: ['https://www.reso.org/blog/media-permissions-private-photos/', 'https://blog.crmls.org/updates/safety-first-why-crmls-is-removing-most-images-of-closed-listings-from-idx-syndication/'],
  }),

  idx_platform: {
    key: 'idx_platform', name: 'Agent website platform', nameEs: 'Plataforma de sitios de agentes', group: 'brokerage', covers: ['Real Geeks', 'IDX Broker', 'Union Street Media', 'rDesk', 'Lofty'], difficulty: 'easy', minutes: 10, status: 'general', checkedOn: NOV18,
    outcome: {
      en: 'These pages are generated automatically from the MLS for many agents at once. If the MLS hides the photos, they disappear from all of them; if your MLS keeps sold-listing photos, email the agent named on the page.',
      es: 'Estas páginas se generan automáticamente desde el MLS para muchos agentes a la vez. Si el MLS oculta las fotos, desaparecen de todas; si tu MLS conserva las fotos de casas vendidas, escribe al agente que aparece en la página.',
    },
    flow: [
      { en: 'Ask the listing agent (MLS)', es: 'Pedir al agente (MLS)' },
      { en: 'Wait two weeks', es: 'Esperar dos semanas' },
      { en: 'Email the agent on the page', es: 'Escribir al agente de la página' },
    ],
    steps: [
      { en: 'Send the listing agent letter: if your MLS lets photos be made private, every page on these platforms updates within days.', es: 'Envía la carta al agente del anuncio: si tu MLS permite hacer privadas las fotos, todas las páginas de estas plataformas se actualizan en días.', more: AGENT_FAIR },
      { en: 'If the page still shows photos after two weeks, email the agent named on it with the site request letter. Agents can hide or delete a listing on their own site.', es: 'Si la página sigue mostrando fotos después de dos semanas, escribe al agente que aparece en ella con la carta para el sitio. Los agentes pueden ocultar o borrar un anuncio en su propio sitio.' },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: [],
  },

  // ===== Tours and property websites =====
  matterport: {
    key: 'matterport', name: 'Matterport 3D tour', nameEs: 'Recorrido 3D de Matterport', group: 'tour', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'A Matterport tour belongs to whoever scanned it, usually the listing agent or their photographer. They can make it private or archive it in seconds, which also breaks every embed of it. Matterport is owned by CoStar, whose privacy form is the backup.',
      es: 'Un recorrido de Matterport pertenece a quien lo escaneó, normalmente el agente o su fotógrafo. Pueden hacerlo privado o archivarlo en segundos, lo que también corta todas las inserciones. Matterport es de CoStar, cuyo formulario de privacidad es la alternativa.',
    },
    flow: [
      { en: 'Find who made the tour', es: 'Ver quién hizo el recorrido' },
      { en: 'Ask them to make it private', es: 'Pedir que lo hagan privado' },
      { en: 'Or CoStar privacy form', es: 'O formulario de privacidad de CoStar' },
    ],
    steps: [
      {
        en: 'Open the tour and look for the name or brokerage on it (top-left corner or the info panel).',
        es: 'Abre el recorrido y busca el nombre o la agencia inmobiliaria (esquina superior izquierda o el panel de información).',
        ui: { surface: 'web', site: 'my.matterport.com', trail: ['ⓘ About', 'Presented by …'] },
      },
      {
        en: 'Send the agent or photographer the request letter asking them to set the space to private (or archive it) and remove it from the property website and listing sites.',
        es: 'Envía al agente o fotógrafo la carta de solicitud pidiendo que pongan el espacio como privado (o lo archiven) y lo quiten del sitio de la propiedad y de los anuncios.',
        more: {
          en: 'In Matterport, the account owner changes a space’s visibility from Public or Unlisted to Private, or archives it. Once it’s private, the link and every embed stop working. It takes them under a minute.',
          es: 'En Matterport, el dueño de la cuenta cambia la visibilidad del espacio de Public o Unlisted a Private, o lo archiva. Cuando es privado, el enlace y todas las inserciones dejan de funcionar. Les toma menos de un minuto.',
        },
      },
      {
        en: 'If you can’t reach them after 7 days, submit CoStar’s privacy form with the tour link and proof that you own the home.',
        es: 'Si no logras contactarlos en 7 días, envía el formulario de privacidad de CoStar con el enlace del recorrido y prueba de que eres dueño.',
        link: { url: COSTAR_PORTAL, en: 'CoStar privacy form', es: 'Formulario de privacidad de CoStar' },
      },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'photographer', 'privacy_rights'],
    more: [
      {
        q: { en: 'Can I see the floor plan and dollhouse view too?', es: '¿También se ven el plano y la vista de maqueta?' },
        a: {
          en: 'Yes. A public Matterport tour usually includes a measured floor plan and a 3D “dollhouse” view of every room, which is why it is worth removing first.',
          es: 'Sí. Un recorrido público de Matterport suele incluir un plano con medidas y una vista 3D de “maqueta” de cada cuarto, por eso conviene quitarlo primero.',
        },
      },
      PROOF_INFO,
    ],
    verify: 'page_gone',
    sources: ['https://matterport.com/blog/matterport-customers-remain-free-to-publish-their-3d-tours-anywhere', COSTAR_PORTAL],
  },

  tour_host: {
    key: 'tour_host', name: 'Virtual tour host', nameEs: 'Servicio de recorridos virtuales', group: 'tour', covers: ['iGUIDE', 'Kuula', 'CloudPano'], difficulty: 'medium', minutes: 15, status: 'general', checkedOn: NOV18,
    outcome: {
      en: 'Tours on iGUIDE, Kuula, CloudPano and similar hosts are controlled by the account that uploaded them, which can unpublish them right away.',
      es: 'Los recorridos en iGUIDE, Kuula, CloudPano y servicios similares los controla la cuenta que los subió, que puede despublicarlos de inmediato.',
    },
    flow: [
      { en: 'Find the photographer or agent', es: 'Ver el fotógrafo o agente' },
      { en: 'Ask them to unpublish', es: 'Pedir que lo despubliquen' },
      { en: 'Else: host’s contact link', es: 'Si no: contacto del servicio' },
    ],
    steps: [
      { en: 'Note the photographer or agent branding on the tour.', es: 'Anota la marca del fotógrafo o agente en el recorrido.' },
      { en: 'Send them the request letter asking them to unpublish the tour.', es: 'Envíales la carta de solicitud pidiendo que despubliquen el recorrido.' },
      { en: 'If there’s no response in 7 days, use the host’s “Contact” or “Report” link in the site footer and include the link and proof of ownership.', es: 'Si no hay respuesta en 7 días, usa el enlace “Contact” o “Report” al pie del servicio e incluye el enlace y prueba de propiedad.' },
      KEEP_RECORDS,
    ],
    letters: ['photographer', 'site_support'],
    more: [PROOF_INFO],
    verify: 'page_gone',
    sources: [],
  },

  property_site: {
    key: 'property_site', name: 'Single-property website', nameEs: 'Sitio web de la propiedad', group: 'tour', covers: ['Aryeo', 'HD Photo Hub', 'Tourbuzz', 'Spiro', 'VirtualTourCafe', 'TourFactory', 'Property Panorama', 'RTV'], difficulty: 'easy', minutes: 10, status: 'general', checkedOn: NOV18,
    outcome: {
      en: 'Photographers publish a marketing website for each listing (Aryeo, HD Photo Hub, Tourbuzz, Spiro and others). The photographer or agent can switch it off in their dashboard.',
      es: 'Los fotógrafos publican un sitio web de promoción para cada anuncio (Aryeo, HD Photo Hub, Tourbuzz, Spiro y otros). El fotógrafo o el agente puede apagarlo desde su panel.',
    },
    flow: [
      { en: 'Find the photographer', es: 'Ver el fotógrafo' },
      { en: 'Ask them (and the agent)', es: 'Pedirles (y al agente)' },
      { en: 'Else: platform support', es: 'Si no: soporte de la plataforma' },
    ],
    steps: [
      { en: 'Find the photographer or media company name on the page (usually at the bottom).', es: 'Busca el nombre del fotógrafo o empresa de medios en la página (normalmente abajo).' },
      { en: 'Send them the request letter. Ask them to unpublish the property website, video and tour, and to confirm by email.', es: 'Envíales la carta de solicitud. Pide que despubliquen el sitio de la propiedad, el video y el recorrido, y que lo confirmen por correo.' },
      { en: 'Also ask your listing agent to tell the photographer. Agents order these sites, and photographers act fastest when the agent asks.', es: 'Pide también a tu agente del anuncio que se lo diga al fotógrafo. Los agentes encargan estos sitios y los fotógrafos actúan más rápido cuando el agente lo pide.' },
      { en: 'If nobody responds, use the platform’s support link in the page footer.', es: 'Si nadie responde, usa el enlace de soporte de la plataforma al pie de la página.' },
      KEEP_RECORDS,
    ],
    letters: ['photographer', 'listing_agent'],
    more: [{
      q: { en: 'Is the photographer allowed to keep them up?', es: '¿El fotógrafo puede dejarlas publicadas?' },
      a: {
        en: 'Photographers usually own the copyright and license the photos to the agent for marketing. Most are glad to unpublish after a sale; it costs them nothing. As copyright holders they can also ask other sites to take down copies.',
        es: 'Los fotógrafos suelen tener los derechos de autor y dan licencia al agente para la promoción. La mayoría despublica con gusto después de la venta; no les cuesta nada. Como dueños de los derechos, también pueden pedir a otros sitios que quiten las copias.',
      },
    }],
    verify: 'page_gone',
    sources: [],
  },

  // ===== Social and video =====
  youtube: social({
    key: 'youtube', name: 'YouTube', status: 'verified', checkedOn: NOV19, minutes: 15,
    outcome: {
      en: 'The channel that posted the video can delete it or set it to private. If they won’t, YouTube’s privacy complaint form covers videos that show your private info without permission, and YouTube lists a home address as private info.',
      es: 'El canal que publicó el video puede borrarlo o hacerlo privado. Si no lo hace, el formulario de privacidad de YouTube cubre videos que muestran tu información privada sin permiso, y YouTube incluye la dirección de la casa como información privada.',
    },
    report: {
      en: 'If the channel doesn’t act, file YouTube’s privacy complaint. Paste the video link, choose the private-info option, and explain how the video identifies you or your home (for example, the address in the title, or a timestamp where it’s shown).',
      es: 'Si el canal no actúa, presenta la queja de privacidad de YouTube. Pega el enlace del video, elige la opción de información privada y explica cómo el video te identifica a ti o a tu casa (por ejemplo, la dirección en el título o el minuto donde aparece).',
      link: { url: 'https://support.google.com/youtube/contact/privacy_complaint', en: 'YouTube privacy complaint form', es: 'Formulario de privacidad de YouTube' },
      more: {
        en: 'YouTube weighs public interest and whether the information is already public, so a tour video alone may not qualify. A video that names your street address has a much better chance. YouTube may email the uploader first and give them time to edit or remove it.',
        es: 'YouTube considera el interés público y si la información ya es pública, así que un video del recorrido por sí solo puede no calificar. Un video que dice tu dirección tiene muchas más posibilidades. YouTube puede escribir primero a quien lo subió y darle tiempo para editarlo o quitarlo.',
      },
    },
    sources: ['https://support.google.com/youtube/contact/privacy_complaint', 'https://support.google.com/youtube/answer/7671399', 'https://support.google.com/youtube/answer/2801895'],
  }),

  vimeo: social({
    key: 'vimeo', name: 'Vimeo', status: 'researched', checkedOn: NOV18,
    outcome: {
      en: 'The uploader can delete the video or make it private. Vimeo also reviews privacy claims.',
      es: 'Quien subió el video puede borrarlo o hacerlo privado. Vimeo también revisa reclamos de privacidad.',
    },
    report: {
      en: 'If the uploader doesn’t act, file a privacy claim following Vimeo’s guidelines.',
      es: 'Si quien lo subió no actúa, presenta un reclamo de privacidad según las pautas de Vimeo.',
      link: { url: 'https://help.vimeo.com/hc/en-us/articles/12427640658065-Guidelines-for-Privacy-Claims', en: 'Vimeo privacy claims', es: 'Reclamos de privacidad de Vimeo' },
    },
    sources: ['https://help.vimeo.com/hc/en-us/articles/12427640658065-Guidelines-for-Privacy-Claims'],
  }),

  facebook: social({
    key: 'facebook', name: 'Facebook', status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'The agent or page that posted the listing can delete the post or album. Facebook’s privacy report is narrow: it mostly removes photos that show people, so asking the poster is the route that works.',
      es: 'El agente o la página que publicó el anuncio puede borrar la publicación o el álbum. El reporte de privacidad de Facebook es limitado: sobre todo quita fotos que muestran personas, así que pedírselo a quien lo publicó es lo que funciona.',
    },
    extra: [{
      en: 'On a post you can also select “⋯” → “Hide post” so you don’t see it, but that doesn’t remove it for anyone else.',
      es: 'En una publicación también puedes seleccionar “⋯” → “Hide post” para no verla, pero eso no la quita para los demás.',
      ui: { surface: 'app', site: 'facebook.com', trail: ['⋯', 'Hide post'] },
    }],
    report: {
      en: 'If the photos show you, your family or private details (mail, documents, kids’ names), report the post: select “⋯” → “Report post” and choose the privacy option. Facebook’s help page links the full privacy form.',
      es: 'Si las fotos te muestran a ti, a tu familia o detalles privados (correo, documentos, nombres de niños), reporta la publicación: selecciona “⋯” → “Report post” y elige la opción de privacidad. La página de ayuda de Facebook enlaza el formulario completo.',
      ui: { surface: 'app', site: 'facebook.com', trail: ['⋯', 'Report post', 'Privacy'] },
      link: { url: 'https://www.facebook.com/help/428478523862899', en: 'Facebook: photos that violate your privacy', es: 'Facebook: fotos que violan tu privacidad' },
      more: {
        en: 'Facebook’s own help page says it usually can’t remove a photo for privacy reasons unless it involves your child or someone you legally represent. Meta’s rules on images of homes are also narrow. That’s why the polite request to the poster comes first.',
        es: 'La propia ayuda de Facebook dice que normalmente no puede quitar una foto por privacidad salvo que involucre a tu hijo o a alguien que representas legalmente. Las reglas de Meta sobre imágenes de casas también son limitadas. Por eso la petición amable a quien publicó va primero.',
      },
    },
    sources: ['https://www.facebook.com/help/428478523862899'],
  }),

  instagram: social({
    key: 'instagram', name: 'Instagram', status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'The account that posted the photos or reel can delete or archive them. Instagram also has a privacy report form for images of you posted without your consent.',
      es: 'La cuenta que publicó las fotos o el reel puede borrarlos o archivarlos. Instagram también tiene un formulario de privacidad para imágenes tuyas publicadas sin tu permiso.',
    },
    report: {
      en: 'If the post shows you or your family, or the account won’t respond, use Instagram’s privacy violation form (you don’t need an Instagram account). In the app you can also tap “⋯” → “Report”.',
      es: 'Si la publicación te muestra a ti o a tu familia, o la cuenta no responde, usa el formulario de violación de privacidad de Instagram (no necesitas cuenta de Instagram). En la app también puedes tocar “⋯” → “Report”.',
      ui: { surface: 'app', site: 'instagram.com', trail: ['⋯', 'Report'] },
      link: { url: 'https://help.instagram.com/contact/1024543072377373', en: 'Instagram privacy violation form', es: 'Formulario de privacidad de Instagram' },
    },
    sources: ['https://help.instagram.com/contact/1024543072377373'],
  }),

  pinterest: social({
    key: 'pinterest', name: 'Pinterest', status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'Pins usually copy a listing photo from another site. Once the original is gone the pin often breaks; you can also ask the pinner or report the pin.',
      es: 'Los pines suelen copiar una foto de un anuncio de otro sitio. Cuando el original desaparece, el pin suele dejar de funcionar; también puedes pedírselo a quien lo guardó o reportar el pin.',
    },
    extra: [{
      en: 'Remove the original source first (the other items in your report). Pins that point to a deleted page often stop showing the photo.',
      es: 'Quita primero la fuente original (los demás elementos de tu informe). Los pines que apuntan a una página borrada suelen dejar de mostrar la foto.',
    }],
    report: {
      en: 'Open the pin, select the “⋯” menu → “Report Pin”, choose your reason, select “Next”, then “Report”.',
      es: 'Abre el pin, selecciona el menú “⋯” → “Report Pin”, elige el motivo, selecciona “Next” y luego “Report”.',
      ui: { surface: 'web', site: 'pinterest.com', trail: ['⋯', 'Report Pin', 'Next', 'Report'] },
      link: { url: 'https://help.pinterest.com/en/article/report-something-on-pinterest', en: 'Pinterest help: report a Pin', es: 'Ayuda de Pinterest: reportar un pin' },
    },
    sources: ['https://help.pinterest.com/en/article/report-something-on-pinterest'],
  }),

  tiktok: social({
    key: 'tiktok', name: 'TikTok', status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'The account that posted the tour video can delete it. Ask first, then report it if it shares your personal information, such as your address.',
      es: 'La cuenta que publicó el video puede borrarlo. Pídelo primero y luego repórtalo si comparte tu información personal, como tu dirección.',
    },
    report: {
      en: 'Press and hold the video (or tap “Share”) → “Report” → “Sharing personal information”, then “Submit”. On a computer, use the “⋯” menu on the video.',
      es: 'Mantén presionado el video (o toca “Share”) → “Report” → “Sharing personal information” y luego “Submit”. En computadora, usa el menú “⋯” del video.',
      ui: { surface: 'app', site: 'tiktok.com', trail: ['Share', 'Report', 'Sharing personal information', 'Submit'] },
      more: {
        en: 'TikTok also has a US privacy web form, but it’s for privacy-law requests about your own data (like deleting your account), not for reporting someone else’s video. The in-app report is the right route.',
        es: 'TikTok también tiene un formulario web de privacidad en EE. UU., pero es para solicitudes sobre tus propios datos (como borrar tu cuenta), no para reportar el video de otra persona. El reporte dentro de la app es la vía correcta.',
      },
    },
    sources: ['https://joindeleteme.com/doxxing/how-to-report-doxxing-on-tiktok/'],
  }),

  // ===== Rentals =====
  costar_rentals: {
    key: 'costar_rentals', name: 'Apartments.com', group: 'rental', covers: ['ApartmentFinder', 'ForRent'], difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Rental listings are controlled by the landlord or manager who posted them. Apartments.com is owned by CoStar, which runs one privacy form for all its sites.',
      es: 'Los anuncios de alquiler los controla el propietario o administrador que los publicó. Apartments.com es de CoStar, que tiene un formulario de privacidad para todos sus sitios.',
    },
    flow: [
      { en: 'Ask the landlord or manager', es: 'Pedir al propietario o administrador' },
      { en: 'CoStar privacy form', es: 'Formulario de privacidad de CoStar' },
    ],
    steps: [
      { en: 'Ask the landlord or property manager on the listing to deactivate it and remove its photos.', es: 'Pide al propietario o administrador del anuncio que lo desactive y quite sus fotos.' },
      {
        en: 'If that fails, submit CoStar’s privacy form with the page link.',
        es: 'Si eso falla, envía el formulario de privacidad de CoStar con el enlace de la página.',
        link: { url: COSTAR_PORTAL, en: 'CoStar privacy form', es: 'Formulario de privacidad de CoStar' },
      },
      KEEP_RECORDS,
    ],
    letters: ['uploader', 'privacy_rights'],
    more: [PRIVACY_LAW_INFO],
    verify: 'page_gone',
    sources: [COSTAR_PORTAL],
  },

  craigslist: {
    key: 'craigslist', name: 'Craigslist', group: 'rental', difficulty: 'easy', minutes: 5, status: 'general', checkedOn: NOV18,
    outcome: {
      en: 'Craigslist posts expire on their own. Scam posts that reuse your listing photos can be flagged and are removed quickly.',
      es: 'Las publicaciones de Craigslist vencen solas. Las publicaciones fraudulentas que reutilizan tus fotos pueden marcarse y se quitan rápido.',
    },
    flow: [
      { en: 'Flag the post', es: 'Marcar la publicación' },
      { en: 'Report scams to the FTC', es: 'Reportar fraudes a la FTC' },
    ],
    steps: [
      { en: 'Open the post and select “flag” (prohibited) if it’s a fake rental using your photos.', es: 'Abre la publicación y selecciona “flag” (prohibited) si es un alquiler falso con tus fotos.', ui: { surface: 'web', site: 'craigslist.org', trail: ['⚑ flag', 'prohibited'] } },
      { en: 'If it’s a scam, also report it to the FTC.', es: 'Si es un fraude, repórtalo también a la FTC.', link: { url: 'https://reportfraud.ftc.gov/', en: 'Report to the FTC', es: 'Reportar a la FTC' } },
    ],
    letters: [],
    verify: 'page_gone',
    sources: [],
  },

  // ===== The source and search engines: shown on every report =====
  mls: {
    key: 'mls', name: 'Your listing agent and the MLS (the source)', nameEs: 'Tu agente del anuncio y el MLS (la fuente)', group: 'source', difficulty: 'easy', minutes: 10, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Often the step that clears the most at once, but not the whole fix. Many MLSs let the listing agent mark photos private after closing, which removes them from agent (IDX) sites and stops new copies. Rules differ: some MLSs (CRMLS in California, for example) strip most closed-listing photos automatically, while others require the photos to stay on file. Big portals like Zillow, Redfin and Realtor.com keep their own copies, so use their guides too.',
      es: 'Suele ser el paso que más limpia de una vez, pero no lo arregla todo. Muchos MLS permiten que el agente marque las fotos como privadas después del cierre, lo que las quita de los sitios de agentes (IDX) y evita nuevas copias. Las reglas varían: algunos MLS (CRMLS en California, por ejemplo) quitan automáticamente casi todas las fotos de casas vendidas, y otros exigen conservarlas. Los portales grandes como Zillow, Redfin y Realtor.com guardan sus propias copias, así que usa también sus guías.',
    },
    flow: [
      { en: 'Find the listing agent', es: 'Encontrar al agente' },
      { en: 'Send the friendly letter', es: 'Enviar la carta amable' },
      { en: 'MLS marks photos private (if allowed)', es: 'El MLS las marca privadas (si se permite)' },
      { en: 'Agent sites update', es: 'Los sitios de agentes se actualizan' },
    ],
    steps: [
      {
        en: 'Find the listing agent. It’s on the old listing page (Zillow, Redfin or Realtor.com) or in your closing documents. If you bought the home, it’s the seller’s agent, not yours.',
        es: 'Encuentra al agente del anuncio. Aparece en la página del anuncio viejo (Zillow, Redfin o Realtor.com) o en tus documentos de cierre. Si compraste la casa, es el agente del vendedor, no el tuyo.',
        more: {
          en: 'Your own buyer’s agent can help too: they know the listing agent and the local MLS rules, and a call from them often gets a faster answer.',
          es: 'Tu propio agente de compra también puede ayudar: conoce al agente del anuncio y las reglas del MLS local, y una llamada suya suele dar una respuesta más rápida.',
        },
      },
      {
        en: 'Send the listing agent letter. It asks, politely, for what they can do: mark photos, tours and floor plans private in the MLS if allowed, remove the listing from their own sites, and unpublish any property website or tour they ordered.',
        es: 'Envía la carta para el agente. Pide, con amabilidad, lo que esté a su alcance: marcar como privadas las fotos, recorridos y planos en el MLS si se permite, quitar el anuncio de sus sitios y despublicar cualquier sitio de la propiedad o recorrido que hayan encargado.',
      },
      {
        en: 'Give them a week. If you don’t hear back, a friendly follow-up or a call to their office usually does it. If they tell you the MLS requires the photos to stay, thank them and move on to each site’s own guide.',
        es: 'Dales una semana. Si no tienes respuesta, un recordatorio amable o una llamada a su oficina suele bastar. Si te dicen que el MLS exige conservar las fotos, agradéceles y sigue con la guía de cada sitio.',
        more: AGENT_FAIR,
      },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent'],
    tips: [{ en: 'Buying or selling soon? Add a line to the contract asking the listing agent to mark interior photos private in the MLS at closing, where the MLS allows it.', es: '¿Vas a comprar o vender pronto? Agrega una línea al contrato pidiendo que el agente marque como privadas las fotos interiores en el MLS al cierre, donde el MLS lo permita.' }],
    more: [
      {
        q: { en: 'Is the agent required to do this?', es: '¿El agente está obligado a hacerlo?' },
        a: {
          en: 'In most states, no. A few states have proposed laws on removing photos after a sale, and MLS rules vary. Most agents will still help when asked kindly, because it’s a reasonable request and good for their reputation.',
          es: 'En la mayoría de los estados, no. Algunos estados han propuesto leyes para quitar fotos después de una venta, y las reglas de cada MLS varían. Aun así, la mayoría de los agentes ayuda cuando se le pide con amabilidad, porque es razonable y bueno para su reputación.',
        },
      },
      {
        q: { en: 'Why are my photos still on Zillow after the MLS change?', es: '¿Por qué mis fotos siguen en Zillow después del cambio en el MLS?' },
        a: {
          en: 'The big portals store their own copy of the listing. An MLS change usually stops new copies and clears agent sites, but Zillow, Redfin, Realtor.com and Homes.com each need their own request. Their guides take 5 to 20 minutes each.',
          es: 'Los portales grandes guardan su propia copia del anuncio. Un cambio en el MLS suele detener nuevas copias y limpiar los sitios de agentes, pero Zillow, Redfin, Realtor.com y Homes.com necesitan cada uno su propia solicitud. Sus guías toman de 5 a 20 minutos cada una.',
        },
      },
    ],
    verify: 'manual',
    sources: ['https://www.reso.org/blog/media-permissions-private-photos/', 'https://blog.crmls.org/updates/safety-first-why-crmls-is-removing-most-images-of-closed-listings-from-idx-syndication/', 'https://www.rismedia.com/2026/09/24/new-jersey-bill-takes-aim-at-listing-photo-removal-after-home-sales-as-privacy-concerns-mount/'],
  },

  google: {
    key: 'google', name: 'Google Search and Images', nameEs: 'Búsqueda e Imágenes de Google', group: 'search', difficulty: 'easy', minutes: 5, status: 'verified', checkedOn: NOV19,
    outcome: {
      en: 'Google can’t delete another site’s page. Once a page or photo is gone or changed, its Refresh Outdated Content tool clears the old copy from search and image results.',
      es: 'Google no puede borrar la página de otro sitio. Cuando una página o foto ya no existe o cambió, su herramienta Refresh Outdated Content borra la copia vieja de la búsqueda y de las imágenes.',
    },
    flow: [
      { en: 'Site removes it first', es: 'Primero lo quita el sitio' },
      { en: 'Request refresh', es: 'Pedir actualización' },
      { en: 'Gone from Google', es: 'Fuera de Google' },
    ],
    steps: [
      { en: 'Wait until the site has removed the photo or page (use the other guides first).', es: 'Espera a que el sitio haya quitado la foto o la página (usa primero las otras guías).' },
      {
        en: 'For a page: open the Refresh Outdated Content tool, select “Request refresh”, enter the page link on the “Page” tab and select “Submit”.',
        es: 'Para una página: abre la herramienta Refresh Outdated Content, selecciona “Request refresh”, escribe el enlace en la pestaña “Page” y selecciona “Submit”.',
        ui: { surface: 'web', site: 'search.google.com', trail: ['Request refresh', 'Page', 'Submit'] },
        link: { url: 'https://search.google.com/search-console/remove-outdated-content', en: 'Refresh outdated content', es: 'Actualizar contenido desactualizado' },
      },
      {
        en: 'For an image: search images.google.com, right-click the thumbnail and choose “Copy link address”. Then in the same tool select “Request refresh” → “New request” → “Image”, paste the link and submit.',
        es: 'Para una imagen: busca en images.google.com, haz clic derecho en la miniatura y elige “Copy link address”. Luego en la misma herramienta selecciona “Request refresh” → “New request” → “Image”, pega el enlace y envía.',
        ui: { surface: 'web', site: 'search.google.com', trail: ['Request refresh', 'New request', 'Image', 'Submit'] },
        link: { url: 'https://support.google.com/websearch/answer/6349986', en: 'Google help: refresh outdated content', es: 'Ayuda de Google: actualizar contenido' },
      },
      {
        en: 'If a result shows your personal contact info (phone, email, home address next to your name), use Google’s “Results about you” removal request.',
        es: 'Si un resultado muestra tu información de contacto (teléfono, correo, dirección junto a tu nombre), usa la solicitud “Results about you” de Google.',
        link: { url: 'https://support.google.com/websearch/answer/13652412', en: 'Remove personal info from Google', es: 'Quitar información personal de Google' },
      },
    ],
    letters: [],
    more: [{
      q: { en: 'Do I need to do this at all?', es: '¿De verdad tengo que hacer esto?' },
      a: {
        en: 'Google re-crawls pages on its own, so old photos fade out eventually. The request just speeds it up from weeks to days. If the live page has already changed, Google says you don’t need the form.',
        es: 'Google vuelve a revisar las páginas por su cuenta, así que las fotos viejas desaparecen con el tiempo. La solicitud solo lo acelera de semanas a días. Si la página ya cambió, Google dice que no necesitas el formulario.',
      },
    }],
    verify: 'manual',
    sources: ['https://support.google.com/websearch/answer/6349986'],
  },

  bing: {
    key: 'bing', name: 'Bing', group: 'search', difficulty: 'easy', minutes: 5, status: 'researched', checkedOn: NOV19,
    outcome: {
      en: 'Bing’s Content Removal Tool clears outdated pages and cached images once the original is gone. It needs a free Microsoft, Google or Facebook sign-in and can take a few weeks.',
      es: 'La herramienta Content Removal de Bing borra páginas desactualizadas e imágenes en caché cuando el original ya no existe. Pide iniciar sesión gratis con Microsoft, Google o Facebook y puede tardar unas semanas.',
    },
    flow: [
      { en: 'Site removes it first', es: 'Primero lo quita el sitio' },
      { en: 'Bing Content Removal', es: 'Bing Content Removal' },
    ],
    steps: [
      {
        en: 'After the site removes the page or photo, open Bing’s Content Removal Tool, sign in, and submit the link.',
        es: 'Después de que el sitio quite la página o la foto, abre la herramienta Content Removal de Bing, inicia sesión y envía el enlace.',
        link: { url: 'https://www.bing.com/webmasters/tools/contentremoval', en: 'Bing Content Removal Tool', es: 'Herramienta Content Removal de Bing' },
      },
    ],
    letters: [],
    verify: 'manual',
    sources: ['https://www.bing.com/webmasters/help/bing-content-removal-tool-cb6c294d'],
  },

  streetview: {
    key: 'streetview', name: 'Google Street View', group: 'search', difficulty: 'easy', minutes: 5, status: 'verified', checkedOn: NOV18,
    outcome: {
      en: 'Google will permanently blur your house in Street View. Zillow and Redfin show Street View once listing photos are hidden, so this closes the last gap. Blurring can’t be undone.',
      es: 'Google difumina tu casa en Street View de forma permanente. Zillow y Redfin muestran Street View cuando se ocultan las fotos, así que esto cierra el último hueco. El difuminado no se puede deshacer.',
    },
    flow: [
      { en: 'Open Street View', es: 'Abrir Street View' },
      { en: 'Report a problem', es: 'Report a problem' },
      { en: 'Request blurring → My home', es: 'Request blurring → My home' },
    ],
    steps: [
      { en: 'Open Google Maps on a computer, search your address and click the Street View thumbnail (bottom left).', es: 'Abre Google Maps en una computadora, busca tu dirección y haz clic en la miniatura de Street View (abajo a la izquierda).', link: { url: 'https://www.google.com/maps', en: 'Open Google Maps', es: 'Abrir Google Maps' } },
      { en: 'Click “Report a problem” in the bottom-right corner.', es: 'Haz clic en “Report a problem” en la esquina inferior derecha.', ui: { surface: 'web', site: 'google.com/maps', trail: ['Street View', 'Report a problem'] } },
      {
        en: 'Center your house in the image preview, choose “Request blurring” → “My home”, add a short description, enter your email and submit.',
        es: 'Centra tu casa en la vista previa, elige “Request blurring” → “My home”, agrega una descripción corta, escribe tu correo y envía.',
        ui: { surface: 'web', site: 'google.com/maps', trail: ['Image preview', 'Request blurring: My home', 'Submit'] },
        more: {
          en: 'Google emails you when it gets the request and again when it’s done. There’s no set timeline; it can take a few weeks.',
          es: 'Google te escribe cuando recibe la solicitud y otra vez cuando termina. No hay un plazo fijo; puede tardar unas semanas.',
        },
      },
    ],
    letters: [],
    verify: 'manual',
    sources: ['https://www.security.org/data-removal/house-photos/'],
  },
};

/** Playbooks that apply to every home regardless of what the scan found. */
export const ALWAYS: string[] = ['mls', 'google', 'bing', 'streetview'];

export function playbookName(pb: Playbook, lang: 'en' | 'es'): string {
  return lang === 'es' && pb.nameEs ? pb.nameEs : pb.name;
}

export function playbookFor(key: string): Playbook {
  return PLAYBOOKS[key] ?? PLAYBOOKS.brokerage;
}
