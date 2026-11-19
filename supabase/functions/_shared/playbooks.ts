// Removal playbooks. Each one says what is realistically possible, the exact steps, and where it came from.
// status: "verified" = steps checked against the site's own help pages or a current, specific guide;
//         "researched" = route confirmed (contact, portal) but the screens weren't walked through;
//         "general" = a sound method for a whole class of sites (brokerage IDX sites, tour hosts).
// Re-check every playbook at least every 90 days: these flows change.

export type L = { en: string; es: string };
export interface Step extends L {
  link?: { url: string } & L;
}
export type LetterKind = 'site_support' | 'listing_agent' | 'photographer' | 'privacy_rights' | 'uploader';
export type VerifyMode = 'page_gone' | 'photos_hidden' | 'manual';

export interface Playbook {
  key: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  minutes: number;
  status: 'verified' | 'researched' | 'general';
  checkedOn: string;
  outcome: L; // what removal realistically looks like
  steps: Step[];
  letters: LetterKind[];
  contacts?: { kind: 'email' | 'phone' | 'url'; value: string; label: L }[];
  tips?: L[];
  verify: VerifyMode;
  sources: string[];
}

const CHECKED = '2026-11-18';

const MLS_TIP: L = {
  en: 'Most listing photos start in the local MLS and are copied to dozens of sites. Asking the listing agent to mark the photos private (or delete them) in the MLS can stop new copies and remove them from many agent sites at once. Some MLSs require photos of sold listings to stay on file, so this doesn’t always work: ask the site directly as well.',
  es: 'La mayoría de las fotos de un anuncio salen del MLS local y se copian a decenas de sitios. Pedir al agente del anuncio que marque las fotos como privadas (o las borre) en el MLS puede detener nuevas copias y quitarlas de muchos sitios de agentes a la vez. Algunos MLS exigen conservar las fotos de anuncios vendidos, así que no siempre funciona: pídalo también al sitio directamente.',
};
const SEARCH_TIP: L = {
  en: 'After a page is updated or removed, Google and Bing can keep showing the old photos for weeks. Use the search-engine playbooks to ask them to refresh.',
  es: 'Después de que una página se actualiza o elimina, Google y Bing pueden seguir mostrando las fotos antiguas durante semanas. Use las guías de buscadores para pedirles que actualicen.',
};
const KEEP_RECORDS: Step = {
  en: 'Keep a screenshot of the page today and write down the date and any case number you receive. Mark the request as sent in your tracker so we re-check it for you.',
  es: 'Guarde una captura de la página hoy y anote la fecha y cualquier número de caso que reciba. Marque la solicitud como enviada en su lista para que la volvamos a revisar por usted.',
};

export const PLAYBOOKS: Record<string, Playbook> = {
  zillow: {
    key: 'zillow', name: 'Zillow', difficulty: 'easy', minutes: 15, status: 'verified', checkedOn: CHECKED,
    outcome: {
      en: 'Zillow will not delete the property page, but as the verified owner you can remove or hide every listing photo. Removing them on Zillow also removes them from Trulia.',
      es: 'Zillow no elimina la página de la propiedad, pero como propietario verificado puede quitar u ocultar todas las fotos del anuncio. Quitarlas en Zillow también las quita de Trulia.',
    },
    steps: [
      { en: 'Sign in to Zillow (or create a free account) and open your home’s page.', es: 'Inicie sesión en Zillow (o cree una cuenta gratis) y abra la página de su casa.', link: { url: 'https://www.zillow.com/', en: 'Open Zillow', es: 'Abrir Zillow' } },
      { en: 'Click “More” (or the ⋯ menu) and choose “Claim ownership” / “Verify your ownership”. Answer the verification questions and accept the terms.', es: 'Haga clic en “More” (o el menú ⋯) y elija “Claim ownership” / “Verify your ownership”. Responda las preguntas de verificación y acepte los términos.' },
      { en: 'Open your profile menu → “Your home” → your property. This is Owner View.', es: 'Abra el menú de su perfil → “Your home” → su propiedad. Esto es Owner View.' },
      { en: 'Click “Edit facts”. In the photos section, either check “Hide photos displayed on your home’s Zillow page” or click each photo and choose “Remove photo”.', es: 'Haga clic en “Edit facts”. En la sección de fotos, marque “Hide photos displayed on your home’s Zillow page” o haga clic en cada foto y elija “Remove photo”.', link: { url: 'https://zillow.zendesk.com/hc/en-us/articles/202036344-How-do-I-hide-or-remove-photos-of-my-home', en: 'Zillow help: hide or remove photos', es: 'Ayuda de Zillow: ocultar o quitar fotos' } },
      { en: 'Click “Save changes”, then open the page while signed out to confirm the photos are gone.', es: 'Haga clic en “Save changes” y luego abra la página sin iniciar sesión para confirmar que las fotos ya no aparecen.' },
      { en: 'If verification fails or the photos come back, contact Zillow support with the page link and proof of ownership (deed or tax bill).', es: 'Si la verificación falla o las fotos vuelven a aparecer, contacte al soporte de Zillow con el enlace de la página y prueba de propiedad (escritura o recibo de impuestos).', link: { url: 'https://zillow.zendesk.com/hc/en-us/requests/new', en: 'Zillow support request', es: 'Solicitud de soporte de Zillow' } },
      KEEP_RECORDS,
    ],
    letters: ['site_support', 'listing_agent'],
    tips: [
      { en: 'Some guides note Zillow may require at least one photo to remain when removing individually; the “hide photos” option avoids that.', es: 'Algunas guías indican que Zillow puede exigir que quede al menos una foto al quitarlas una por una; la opción “hide photos” lo evita.' },
      { en: 'If Zillow shows a Google Street View image after the photos are gone, use the Google Street View playbook to blur your house.', es: 'Si Zillow muestra una imagen de Google Street View después de quitar las fotos, use la guía de Google Street View para difuminar su casa.' },
    ],
    verify: 'photos_hidden',
    sources: ['https://www.offlist.me/blog/remove-home-from-zillow-redfin-blockshopper', 'https://sebfrey.com/removing-your-homes-photos-from-the-internet/', 'https://www.security.org/data-removal/house-photos/'],
  },
  trulia: {
    key: 'trulia', name: 'Trulia', difficulty: 'easy', minutes: 5, status: 'verified', checkedOn: CHECKED,
    outcome: {
      en: 'Trulia is owned by Zillow and shows Zillow’s photos. Removing the photos on Zillow removes them here too.',
      es: 'Trulia pertenece a Zillow y muestra las fotos de Zillow. Quitar las fotos en Zillow también las quita aquí.',
    },
    steps: [
      { en: 'Follow the Zillow playbook first. It is the fastest route.', es: 'Siga primero la guía de Zillow. Es el camino más rápido.', link: { url: 'https://www.zillow.com/', en: 'Open Zillow', es: 'Abrir Zillow' } },
      { en: 'Wait a few days, then open the Trulia page while signed out to confirm the photos are gone.', es: 'Espere unos días y abra la página de Trulia sin iniciar sesión para confirmar que las fotos ya no aparecen.' },
      { en: 'If they remain, contact Zillow Group support and mention the Trulia link.', es: 'Si siguen apareciendo, contacte al soporte de Zillow Group y mencione el enlace de Trulia.', link: { url: 'https://zillow.zendesk.com/hc/en-us/requests/new', en: 'Zillow Group support', es: 'Soporte de Zillow Group' } },
    ],
    letters: ['site_support'],
    verify: 'photos_hidden',
    sources: ['https://help.joindeleteme.com/hc/en-us/articles/14673955471635-Trulia-Redaction-Guide'],
  },
  zillow_rentals: {
    key: 'zillow_rentals', name: 'HotPads / Zillow Rentals', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Old rental listings usually come from a landlord or property manager account. Ask them to deactivate it, or ask Zillow Rentals support.', es: 'Los anuncios de alquiler antiguos suelen venir de la cuenta de un propietario o administrador. Pídales que lo desactiven, o pida al soporte de Zillow Rentals.' },
    steps: [
      { en: 'Find who posted the rental (shown on the listing). Ask them to deactivate the listing and delete its photos.', es: 'Identifique quién publicó el alquiler (aparece en el anuncio). Pídale que desactive el anuncio y borre sus fotos.' },
      { en: 'If you own the home and cannot reach them, contact Zillow support with the link and proof of ownership.', es: 'Si es dueño de la casa y no puede contactarlos, comuníquese con el soporte de Zillow con el enlace y prueba de propiedad.', link: { url: 'https://zillow.zendesk.com/hc/en-us/requests/new', en: 'Zillow support request', es: 'Solicitud de soporte de Zillow' } },
      KEEP_RECORDS,
    ],
    letters: ['site_support'],
    verify: 'page_gone',
    sources: [],
  },
  redfin: {
    key: 'redfin', name: 'Redfin', difficulty: 'easy', minutes: 10, status: 'verified', checkedOn: CHECKED,
    outcome: { en: 'Redfin keeps the property page, but a verified owner can hide all listing photos. Redfin then shows a Street View image instead.', es: 'Redfin mantiene la página de la propiedad, pero un propietario verificado puede ocultar todas las fotos del anuncio. Redfin muestra entonces una imagen de Street View.' },
    steps: [
      { en: 'Sign in to Redfin on a computer (this is not available in the mobile app).', es: 'Inicie sesión en Redfin desde una computadora (no está disponible en la app móvil).', link: { url: 'https://www.redfin.com/', en: 'Open Redfin', es: 'Abrir Redfin' } },
      { en: 'Open your home’s page and claim it (“Claim this home” / Owner Dashboard), then complete the ownership check.', es: 'Abra la página de su casa y reclámela (“Claim this home” / Owner Dashboard), luego complete la verificación de propiedad.' },
      { en: 'From the menu under your name choose “My homes” (Owner Dashboard) and select the property.', es: 'En el menú bajo su nombre elija “My homes” (Owner Dashboard) y seleccione la propiedad.' },
      { en: 'Click “Edit Photos”, check “Hide listing photos”, and confirm with “Yes, Hide Photos”.', es: 'Haga clic en “Edit Photos”, marque “Hide listing photos” y confirme con “Yes, Hide Photos”.', link: { url: 'https://support.redfin.com/hc/en-us/articles/360013247432-Removing-Photos-on-a-Sold-Home', en: 'Redfin help: removing photos', es: 'Ayuda de Redfin: quitar fotos' } },
      { en: 'If you cannot claim the home, read Redfin’s Photos FAQ and contact support with the link.', es: 'Si no puede reclamar la casa, lea las preguntas frecuentes de fotos de Redfin y contacte al soporte con el enlace.', link: { url: 'https://support.redfin.com/hc/en-us/articles/45556093357595-Photos-FAQ', en: 'Redfin Photos FAQ', es: 'Preguntas frecuentes de fotos de Redfin' } },
      KEEP_RECORDS,
    ],
    letters: ['site_support', 'listing_agent'],
    verify: 'photos_hidden',
    sources: ['https://support.redfin.com/hc/en-us/articles/360013247432-Removing-Photos-on-a-Sold-Home', 'https://support.redfin.com/hc/en-us/articles/45556093357595-Photos-FAQ'],
  },
  realtor: {
    key: 'realtor', name: 'Realtor.com', difficulty: 'medium', minutes: 20, status: 'verified', checkedOn: CHECKED,
    outcome: { en: 'Once the listing is off-market (closed, expired or canceled), Realtor.com will remove the photos for the verified owner.', es: 'Cuando el anuncio ya no está en el mercado (vendido, vencido o cancelado), Realtor.com quita las fotos para el propietario verificado.' },
    steps: [
      { en: 'Option 1: claim the home. Go to Realtor.com “My Home”, look up your address and follow the ownership steps. In your owner dashboard choose “Remove photos”.', es: 'Opción 1: reclame la casa. Vaya a “My Home” de Realtor.com, busque su dirección y siga los pasos de propiedad. En su panel de propietario elija “Remove photos”.', link: { url: 'https://www.realtor.com/myhome', en: 'Realtor.com My Home', es: 'Realtor.com My Home' } },
      { en: 'Option 2: contact Customer Care by email or phone and ask for the photos to be removed. Attach proof of ownership: deed, title, recent tax bill, trust documents, HOA statement or a public-record link (utility bills are not accepted). You may black out sensitive numbers.', es: 'Opción 2: contacte a Customer Care por correo o teléfono y pida que quiten las fotos. Adjunte prueba de propiedad: escritura, título, recibo de impuestos reciente, documentos de fideicomiso, estado de cuenta de la HOA o un enlace al registro público (no aceptan facturas de servicios). Puede tachar números sensibles.' },
      { en: 'Realtor.com support form, if you prefer a web form.', es: 'Formulario de soporte de Realtor.com, si prefiere un formulario web.', link: { url: 'https://support.realtor.com/s/contactsupport', en: 'Realtor.com support', es: 'Soporte de Realtor.com' } },
      KEEP_RECORDS,
    ],
    contacts: [
      { kind: 'email', value: 'customercare@realtor.com', label: { en: 'Customer Care email', es: 'Correo de Customer Care' } },
      { kind: 'phone', value: '(800) 878-4166', label: { en: 'Customer Care phone', es: 'Teléfono de Customer Care' } },
    ],
    letters: ['site_support'],
    tips: [{ en: 'Some owners report a waiting period of a few months after a sale before the owner tools allow edits. Customer Care can act sooner.', es: 'Algunos propietarios reportan una espera de algunos meses después de la venta antes de poder editar. Customer Care puede actuar antes.' }],
    verify: 'photos_hidden',
    sources: ['https://connectmls.smartmls.com/hc/en-us/articles/29527808816155-Remove-photos-from-Realtor-com', 'https://sebfrey.com/removing-your-homes-photos-from-the-internet/'],
  },
  homes: {
    key: 'homes', name: 'Homes.com', difficulty: 'medium', minutes: 20, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Homes.com (owned by CoStar) has no self-service photo removal. Support can remove photos, tours and floor plans after verifying you.', es: 'Homes.com (de CoStar) no tiene una opción para quitar fotos uno mismo. El soporte puede quitar fotos, recorridos y planos después de verificarlo.' },
    steps: [
      { en: 'Copy the exact Homes.com page link (from your report).', es: 'Copie el enlace exacto de la página de Homes.com (de su informe).' },
      { en: 'Email support (or call) as the homeowner. Ask them to remove interior photos, floor plans and virtual tours, and ask for a case number.', es: 'Escriba al soporte (o llame) como propietario. Pida que quiten fotos interiores, planos y recorridos virtuales, y pida un número de caso.', link: { url: 'https://www.homes.com/about/contact-us/', en: 'Homes.com contact page', es: 'Página de contacto de Homes.com' } },
      { en: 'Ask what proof they need and send it only through their official process. Ask which feed or agent supplied the photos if they say they cannot remove them.', es: 'Pregunte qué prueba necesitan y envíela solo por su proceso oficial. Si dicen que no pueden quitarlas, pregunte qué fuente o agente proporcionó las fotos.' },
      { en: 'For a formal privacy (deletion) request, use CoStar’s privacy-rights portal linked in the Homes.com footer (“Exercise your Privacy Rights”).', es: 'Para una solicitud formal de privacidad (eliminación), use el portal de derechos de privacidad de CoStar enlazado al pie de Homes.com (“Exercise your Privacy Rights”).', link: { url: 'https://privacy.costar.com/DSAR-submission/', en: 'CoStar privacy portal', es: 'Portal de privacidad de CoStar' } },
      KEEP_RECORDS,
    ],
    contacts: [
      { kind: 'email', value: 'support@homes.com', label: { en: 'Homes.com support', es: 'Soporte de Homes.com' } },
      { kind: 'phone', value: '(800) 431-5509', label: { en: 'Homes.com support phone', es: 'Teléfono de soporte de Homes.com' } },
    ],
    letters: ['site_support', 'privacy_rights'],
    verify: 'photos_hidden',
    sources: ['https://www.data-hound.com/guides/homes-com', 'https://myprivacyagent.com/remove/homes'],
  },
  costar_rentals: {
    key: 'costar_rentals', name: 'Apartments.com', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Rental listings are controlled by the landlord or manager who posted them. Apartments.com is owned by CoStar, which runs one privacy portal for its sites.', es: 'Los anuncios de alquiler los controla el propietario o administrador que los publicó. Apartments.com es de CoStar, que tiene un portal de privacidad para sus sitios.' },
    steps: [
      { en: 'Ask the landlord or property manager on the listing to deactivate it and remove its photos.', es: 'Pida al propietario o administrador del anuncio que lo desactive y quite sus fotos.' },
      { en: 'If that fails, submit a request through CoStar’s privacy portal with the page link.', es: 'Si eso falla, envíe una solicitud por el portal de privacidad de CoStar con el enlace de la página.', link: { url: 'https://privacy.costar.com/DSAR-submission/', en: 'CoStar privacy portal', es: 'Portal de privacidad de CoStar' } },
      KEEP_RECORDS,
    ],
    letters: ['uploader', 'privacy_rights'],
    verify: 'page_gone',
    sources: ['https://myprivacyagent.com/remove/homes'],
  },
  matterport: {
    key: 'matterport', name: 'Matterport 3D tour', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'A Matterport tour belongs to whoever scanned it (usually the listing agent or their photographer). They can unpublish or delete it in seconds. Matterport is now owned by CoStar.', es: 'Un recorrido de Matterport pertenece a quien lo escaneó (normalmente el agente del anuncio o su fotógrafo). Pueden despublicarlo o borrarlo en segundos. Matterport ahora pertenece a CoStar.' },
    steps: [
      { en: 'Open the tour and note the name or brokerage shown in it (often in the corner or the “About” panel).', es: 'Abra el recorrido y anote el nombre o la correduría que aparece (a menudo en la esquina o en el panel “About”).' },
      { en: 'Send the listing agent or photographer the request letter asking them to set the space to private or delete it, and to remove any embeds on property websites.', es: 'Envíe al agente o fotógrafo la carta de solicitud pidiendo que pongan el espacio como privado o lo borren, y que quiten las inserciones en sitios de la propiedad.' },
      { en: 'If you cannot reach the owner, submit a privacy request to CoStar (Matterport’s parent) with the tour link and proof that you own the home.', es: 'Si no puede contactar al dueño, envíe una solicitud de privacidad a CoStar (dueña de Matterport) con el enlace del recorrido y prueba de que es dueño de la casa.', link: { url: 'https://privacy.costar.com/DSAR-submission/', en: 'CoStar privacy portal', es: 'Portal de privacidad de CoStar' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'photographer', 'privacy_rights'],
    verify: 'page_gone',
    sources: ['https://matterport.com/blog/matterport-customers-remain-free-to-publish-their-3d-tours-anywhere'],
  },
  tour_host: {
    key: 'tour_host', name: 'Virtual tour host', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Tours on iGUIDE, Kuula, CloudPano and similar hosts are controlled by the account that uploaded them. The uploader can unpublish them right away.', es: 'Los recorridos en iGUIDE, Kuula, CloudPano y servicios similares los controla la cuenta que los subió. Quien los subió puede despublicarlos de inmediato.' },
    steps: [
      { en: 'Note the photographer or agent branding on the tour.', es: 'Anote la marca del fotógrafo o agente en el recorrido.' },
      { en: 'Send them the request letter asking them to unpublish the tour.', es: 'Envíeles la carta de solicitud pidiendo que despubliquen el recorrido.' },
      { en: 'If there is no response in 7 days, use the host’s “Contact” or “Report” link (in the site footer) and include the link and proof of ownership.', es: 'Si no hay respuesta en 7 días, use el enlace “Contact” o “Report” del servicio (al pie del sitio) e incluya el enlace y prueba de propiedad.' },
      KEEP_RECORDS,
    ],
    letters: ['photographer', 'site_support'],
    verify: 'page_gone',
    sources: [],
  },
  property_site: {
    key: 'property_site', name: 'Single-property website', difficulty: 'easy', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Photographers publish a marketing website for each listing (Aryeo, HD Photo Hub, Tourbuzz, Spiro and others). The photographer or agent can turn it off in their dashboard.', es: 'Los fotógrafos publican un sitio web de mercadeo para cada anuncio (Aryeo, HD Photo Hub, Tourbuzz, Spiro y otros). El fotógrafo o el agente pueden apagarlo desde su panel.' },
    steps: [
      { en: 'Find the photographer or media company name on the page (usually at the bottom).', es: 'Busque el nombre del fotógrafo o empresa de medios en la página (normalmente abajo).' },
      { en: 'Send them the request letter. Ask them to unpublish the property website, video and tour, and to confirm by email.', es: 'Envíeles la carta de solicitud. Pida que despubliquen el sitio de la propiedad, el video y el recorrido, y que lo confirmen por correo.' },
      { en: 'Also ask your listing agent to tell the photographer. Agents order these sites and photographers act fastest on their request.', es: 'Pida también a su agente del anuncio que se lo diga al fotógrafo. Los agentes encargan estos sitios y los fotógrafos actúan más rápido a su pedido.' },
      { en: 'If nobody responds, use the platform’s support link in the page footer.', es: 'Si nadie responde, use el enlace de soporte de la plataforma al pie de la página.' },
      KEEP_RECORDS,
    ],
    letters: ['photographer', 'listing_agent'],
    verify: 'page_gone',
    sources: [],
  },
  youtube: {
    key: 'youtube', name: 'YouTube', difficulty: 'medium', minutes: 15, status: 'verified', checkedOn: CHECKED,
    outcome: { en: 'The uploader (often the agent) can delete or make the video private. If they won’t, YouTube’s privacy process can remove videos that identify you or your home without consent.', es: 'Quien subió el video (a menudo el agente) puede borrarlo o hacerlo privado. Si no lo hace, el proceso de privacidad de YouTube puede quitar videos que lo identifican a usted o su casa sin consentimiento.' },
    steps: [
      { en: 'Ask the channel owner to remove the video or set it to private (use the uploader letter).', es: 'Pida al dueño del canal que quite el video o lo haga privado (use la carta para quien lo subió).' },
      { en: 'If there is no response after 48 hours, file a privacy complaint with YouTube. Read the privacy guidelines first; the form is linked from that page.', es: 'Si no hay respuesta después de 48 horas, presente una queja de privacidad a YouTube. Lea primero las pautas de privacidad; el formulario está enlazado desde esa página.', link: { url: 'https://support.google.com/youtube/answer/7671399', en: 'YouTube privacy guidelines', es: 'Pautas de privacidad de YouTube' } },
      KEEP_RECORDS,
    ],
    letters: ['uploader'],
    verify: 'page_gone',
    sources: ['https://support.google.com/youtube/answer/7671399'],
  },
  vimeo: {
    key: 'vimeo', name: 'Vimeo', difficulty: 'medium', minutes: 15, status: 'verified', checkedOn: CHECKED,
    outcome: { en: 'The uploader can delete the video. Vimeo also reviews privacy claims.', es: 'Quien subió el video puede borrarlo. Vimeo también revisa reclamos de privacidad.' },
    steps: [
      { en: 'Ask the uploader to delete the video or make it private.', es: 'Pida a quien subió el video que lo borre o lo haga privado.' },
      { en: 'If that fails, file a privacy claim following Vimeo’s guidelines.', es: 'Si eso falla, presente un reclamo de privacidad según las pautas de Vimeo.', link: { url: 'https://help.vimeo.com/hc/en-us/articles/12427640658065-Guidelines-for-Privacy-Claims', en: 'Vimeo privacy claims', es: 'Reclamos de privacidad de Vimeo' } },
      KEEP_RECORDS,
    ],
    letters: ['uploader'],
    verify: 'page_gone',
    sources: ['https://help.vimeo.com/hc/en-us/articles/12427640658065-Guidelines-for-Privacy-Claims'],
  },
  facebook: {
    key: 'facebook', name: 'Facebook', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Agent and brokerage posts can be deleted by whoever posted them. Ask them first; Facebook rarely removes photos of a house alone.', es: 'Las publicaciones de agentes y corredurías las puede borrar quien las publicó. Pídales primero; Facebook rara vez quita fotos solo de una casa.' },
    steps: [
      { en: 'Message the page or person who posted the listing and ask them to delete the post or album.', es: 'Escriba a la página o persona que publicó el anuncio y pida que borre la publicación o el álbum.' },
      { en: 'If the photos show you, your family, or private details, report the post as a privacy violation from the ⋯ menu.', es: 'Si las fotos lo muestran a usted, a su familia o detalles privados, reporte la publicación como violación de privacidad desde el menú ⋯.' },
      KEEP_RECORDS,
    ],
    letters: ['uploader'],
    verify: 'page_gone',
    sources: [],
  },
  instagram: {
    key: 'instagram', name: 'Instagram', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'The account that posted the photos or reel can delete them. Ask them first.', es: 'La cuenta que publicó las fotos o el reel puede borrarlos. Pídales primero.' },
    steps: [
      { en: 'Send the account a direct message (or the uploader letter by email) asking them to delete the post.', es: 'Envíe a la cuenta un mensaje directo (o la carta por correo) pidiendo que borre la publicación.' },
      { en: 'If the post shows people or private details, report it as a privacy violation from the ⋯ menu.', es: 'Si la publicación muestra personas o detalles privados, repórtela como violación de privacidad desde el menú ⋯.' },
      KEEP_RECORDS,
    ],
    letters: ['uploader'],
    verify: 'page_gone',
    sources: [],
  },
  pinterest: {
    key: 'pinterest', name: 'Pinterest', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Pins usually copy listing photos. When the original page is gone, the pin often breaks; you can also ask the pinner or report the pin.', es: 'Los pines suelen copiar fotos de anuncios. Cuando la página original desaparece, el pin suele dejar de funcionar; también puede pedir al autor o reportar el pin.' },
    steps: [
      { en: 'Remove the original source first (see the other items in your report).', es: 'Quite primero la fuente original (vea los demás elementos de su informe).' },
      { en: 'Open the pin, click ⋯ → “Report Pin”, and choose the privacy option.', es: 'Abra el pin, haga clic en ⋯ → “Report Pin” y elija la opción de privacidad.' },
      KEEP_RECORDS,
    ],
    letters: ['site_support'],
    verify: 'page_gone',
    sources: [],
  },
  tiktok: {
    key: 'tiktok', name: 'TikTok', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'The account that posted the tour video can delete it. Ask first, then report it if it exposes private details.', es: 'La cuenta que publicó el video puede borrarlo. Pida primero y luego repórtelo si expone detalles privados.' },
    steps: [
      { en: 'Ask the poster to delete the video.', es: 'Pida a quien lo publicó que borre el video.' },
      { en: 'Press and hold the video (or tap Share) → “Report” → privacy, if it shows people or private details.', es: 'Mantenga presionado el video (o toque Compartir) → “Report” → privacidad, si muestra personas o detalles privados.' },
      KEEP_RECORDS,
    ],
    letters: ['uploader'],
    verify: 'page_gone',
    sources: [],
  },
  craigslist: {
    key: 'craigslist', name: 'Craigslist', difficulty: 'easy', minutes: 5, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Craigslist posts expire on their own. Scam posts that reuse your listing photos can be flagged and are removed quickly.', es: 'Las publicaciones de Craigslist vencen solas. Las publicaciones fraudulentas que reutilizan sus fotos pueden marcarse y se quitan rápido.' },
    steps: [
      { en: 'Open the post and click “flag” (prohibited) if it is a fake rental using your photos.', es: 'Abra la publicación y haga clic en “flag” (prohibited) si es un alquiler falso con sus fotos.' },
      { en: 'If it is a scam, also report it to the FTC.', es: 'Si es un fraude, repórtelo también a la FTC.', link: { url: 'https://reportfraud.ftc.gov/', en: 'Report to the FTC', es: 'Reportar a la FTC' } },
    ],
    letters: [],
    verify: 'page_gone',
    sources: [],
  },
  movoto: {
    key: 'movoto', name: 'Movoto', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Movoto shows MLS listing data. Photos usually disappear after the listing agent marks them private in the MLS; Movoto also takes privacy requests.', es: 'Movoto muestra datos de anuncios del MLS. Las fotos suelen desaparecer cuando el agente las marca como privadas en el MLS; Movoto también acepta solicitudes de privacidad.' },
    steps: [
      { en: 'Ask your listing agent to mark the photos private or remove them in the MLS (listing agent letter).', es: 'Pida a su agente del anuncio que marque las fotos como privadas o las quite en el MLS (carta para el agente).' },
      { en: 'Send Movoto a privacy request with the page link, using the contact details on its privacy page.', es: 'Envíe a Movoto una solicitud de privacidad con el enlace de la página, usando los datos de contacto de su página de privacidad.', link: { url: 'https://www.movoto.com/about/ca_privacy/', en: 'Movoto privacy page', es: 'Página de privacidad de Movoto' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'privacy_rights'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: ['https://www.movoto.com/about/ca_privacy/'],
  },
  estately: {
    key: 'estately', name: 'Estately', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Estately is a brokerage site fed by the MLS. Photos go away when the listing agent marks them private in the MLS, or when Estately removes them on request.', es: 'Estately es un sitio de correduría alimentado por el MLS. Las fotos desaparecen cuando el agente las marca como privadas en el MLS, o cuando Estately las quita a pedido.' },
    steps: [
      { en: 'Ask your listing agent to update the MLS (listing agent letter).', es: 'Pida a su agente del anuncio que actualice el MLS (carta para el agente).' },
      { en: 'Email Estately’s support from its Contact page with the link and ask them to remove the photos.', es: 'Escriba al soporte de Estately desde su página de contacto con el enlace y pida que quiten las fotos.', link: { url: 'https://www.estately.com/', en: 'Open Estately (Contact is in the footer)', es: 'Abrir Estately (Contacto está al pie)' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: [],
  },
  har: {
    key: 'har', name: 'HAR.com', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'HAR.com is run by the Houston Association of Realtors and shows Texas MLS data. The listing agent can mark photos private in the MLS; HAR support can help owners.', es: 'HAR.com lo administra la Asociación de Realtors de Houston y muestra datos del MLS de Texas. El agente puede marcar las fotos como privadas en el MLS; el soporte de HAR puede ayudar a los propietarios.' },
    steps: [
      { en: 'Ask the listing agent to make the photos private in the MLS.', es: 'Pida al agente del anuncio que haga privadas las fotos en el MLS.' },
      { en: 'Contact HAR.com support with the page link (Contact Us is in the site footer).', es: 'Contacte al soporte de HAR.com con el enlace de la página (Contact Us está al pie del sitio).', link: { url: 'https://www.har.com/', en: 'Open HAR.com', es: 'Abrir HAR.com' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: [],
  },
  houzeo: {
    key: 'houzeo', name: 'Houzeo', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Houzeo shows MLS listings. MLS changes flow through; Houzeo support can also remove the photos.', es: 'Houzeo muestra anuncios del MLS. Los cambios del MLS se reflejan; el soporte de Houzeo también puede quitar las fotos.' },
    steps: [
      { en: 'Ask your listing agent to update the MLS.', es: 'Pida a su agente del anuncio que actualice el MLS.' },
      { en: 'Contact Houzeo support with the link.', es: 'Contacte al soporte de Houzeo con el enlace.', link: { url: 'https://www.houzeo.com/', en: 'Open Houzeo', es: 'Abrir Houzeo' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    verify: 'photos_hidden',
    sources: [],
  },
  compass: {
    key: 'compass', name: 'Compass', difficulty: 'medium', minutes: 15, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Compass shows its own agents’ listings and MLS data. Your Compass agent (if you used one) can remove the photos; otherwise the MLS route and Compass’s privacy center work.', es: 'Compass muestra anuncios de sus agentes y datos del MLS. Su agente de Compass (si usó uno) puede quitar las fotos; si no, funcionan el MLS y el centro de privacidad de Compass.' },
    steps: [
      { en: 'If Compass listed your home, ask that agent to remove the photos from Compass and the MLS.', es: 'Si Compass publicó su casa, pida a ese agente que quite las fotos de Compass y del MLS.' },
      { en: 'Otherwise ask your listing agent to update the MLS (listing agent letter).', es: 'Si no, pida a su agente del anuncio que actualice el MLS (carta para el agente).' },
      { en: 'Submit a request through the Compass privacy center with the page link.', es: 'Envíe una solicitud por el centro de privacidad de Compass con el enlace de la página.', link: { url: 'https://compass.com/legal/privacy-center', en: 'Compass privacy center', es: 'Centro de privacidad de Compass' } },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'privacy_rights'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: ['https://compass.com/legal/privacy-center'],
  },
  anywhere: {
    key: 'anywhere', name: 'Coldwell Banker / Century 21 / Sotheby’s / BHGRE / ERA', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'These brokerage sites show MLS listings in their markets. The MLS route removes the photos from most of them; their privacy request forms cover the rest.', es: 'Estos sitios de corredurías muestran anuncios del MLS de sus mercados. El camino del MLS quita las fotos de la mayoría; sus formularios de privacidad cubren el resto.' },
    steps: [
      { en: 'Ask your listing agent to mark the photos private or delete them in the MLS.', es: 'Pida a su agente del anuncio que marque las fotos como privadas o las borre en el MLS.' },
      { en: 'Use the “Privacy” or “Do Not Sell / Your Privacy Choices” link in the site footer to send a removal request with the page link.', es: 'Use el enlace “Privacy” o “Do Not Sell / Your Privacy Choices” al pie del sitio para enviar una solicitud con el enlace de la página.' },
      { en: 'Or call the local office shown on the listing and ask for the photos to be removed from the brokerage site.', es: 'O llame a la oficina local que aparece en el anuncio y pida que quiten las fotos del sitio de la correduría.' },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: [],
  },
  brokerage: {
    key: 'brokerage', name: 'Agent or brokerage website', difficulty: 'medium', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Agent and brokerage websites copy listings from the MLS (IDX). If the photos are marked private or deleted in the MLS, they usually drop off these sites at the next update, but some MLSs keep sold-listing photos on file. Either way, you can ask the site or the agent named on the page to remove theirs.', es: 'Los sitios de agentes y corredurías copian anuncios del MLS (IDX). Si las fotos se marcan como privadas o se borran en el MLS, suelen desaparecer de estos sitios en la siguiente actualización, pero algunos MLS conservan las fotos de anuncios vendidos. En cualquier caso, puede pedir al sitio o al agente que aparece en la página que quite las suyas.' },
    steps: [
      { en: 'Ask your listing agent to make the photos private in the MLS and in syndication feeds (listing agent letter). Where the MLS allows it, this fixes many sites at once.', es: 'Pida a su agente del anuncio que haga privadas las fotos en el MLS y en las distribuciones (carta para el agente). Donde el MLS lo permite, esto arregla muchos sitios a la vez.' },
      { en: 'For this site, use its Contact page (or the agent’s email on the page) and send the site request letter with the exact link.', es: 'Para este sitio, use su página de contacto (o el correo del agente en la página) y envíe la carta con el enlace exacto.' },
      { en: 'Wait 7 to 14 days, then press “Re-scan now” on your report to check that the page is gone.', es: 'Espere de 7 a 14 días y luego pulse “Volver a escanear” en su informe para comprobar que la página ya no está.' },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP, SEARCH_TIP],
    verify: 'page_gone',
    sources: ['https://www.reso.org/blog/media-permissions-private-photos/', 'https://blog.crmls.org/updates/safety-first-why-crmls-is-removing-most-images-of-closed-listings-from-idx-syndication/'],
  },
  idx_platform: {
    key: 'idx_platform', name: 'Agent website platform (Real Geeks, IDX Broker, Union Street Media)', difficulty: 'easy', minutes: 10, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'These pages are generated automatically from the MLS for many agents at once. If the MLS hides the photos, they disappear from all of them; if your MLS keeps sold-listing photos, email the agent named on the page.', es: 'Estas páginas se generan automáticamente desde el MLS para muchos agentes a la vez. Si el MLS oculta las fotos, desaparecen de todas; si su MLS conserva las fotos de anuncios vendidos, escriba al agente que aparece en la página.' },
    steps: [
      { en: 'Send the listing agent letter: if your MLS lets photos be made private, every page on these platforms updates within days.', es: 'Envíe la carta al agente del anuncio: si su MLS permite hacer privadas las fotos, todas las páginas de estas plataformas se actualizan en días.' },
      { en: 'If the page still shows photos after two weeks, email the agent named on it with the site request letter. Agents can hide or delete a listing on their own site.', es: 'Si la página sigue mostrando fotos después de dos semanas, escriba al agente que aparece en ella con la carta para el sitio. Los agentes pueden ocultar o borrar un anuncio en su propio sitio.' },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent', 'site_support'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: [],
  },
  generic_portal: {
    key: 'generic_portal', name: 'Listing website', difficulty: 'medium', minutes: 15, status: 'general', checkedOn: CHECKED,
    outcome: { en: 'Most listing sites will remove photos for a verified owner, and MLS changes flow through to them.', es: 'La mayoría de los sitios de anuncios quitan fotos para un propietario verificado, y los cambios del MLS se reflejan en ellos.' },
    steps: [
      { en: 'Look for an owner tool on the page (“Claim this home”, “Are you the owner?”). If there is one, use it to hide the photos.', es: 'Busque una herramienta para propietarios en la página (“Claim this home”, “Are you the owner?”). Si existe, úsela para ocultar las fotos.' },
      { en: 'Otherwise send the site request letter to its support or privacy contact (footer).', es: 'Si no, envíe la carta a su contacto de soporte o privacidad (al pie de la página).' },
      { en: 'Ask your listing agent to update the MLS so the photos don’t come back.', es: 'Pida a su agente del anuncio que actualice el MLS para que las fotos no vuelvan.' },
      KEEP_RECORDS,
    ],
    letters: ['site_support', 'listing_agent'],
    tips: [MLS_TIP],
    verify: 'photos_hidden',
    sources: [],
  },

  // Root causes and search engines: shown on every report
  mls: {
    key: 'mls', name: 'Your listing agent and the MLS (the source)', difficulty: 'easy', minutes: 10, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Often the step that clears the most at once. Many MLSs let the listing agent mark photos private after closing, which removes them from agent (IDX) sites and stops new copies. Rules differ: some MLSs (for example CRMLS in California) strip most closed-listing photos automatically, while others require the photos to stay on file. Where the MLS keeps them, ask each site directly using the steps on its card.', es: 'Suele ser el paso que más limpia de una vez. Muchos MLS permiten que el agente marque las fotos como privadas después del cierre, lo que las quita de los sitios de agentes (IDX) y detiene nuevas copias. Las reglas varían: algunos MLS (por ejemplo CRMLS en California) quitan automáticamente la mayoría de las fotos de anuncios cerrados, y otros exigen conservarlas. Donde el MLS las conserva, pídalo a cada sitio directamente con los pasos de su tarjeta.' },
    steps: [
      { en: 'Find the listing agent: it is on the old listing page (Zillow, Redfin or Realtor.com) or on your closing documents. If you bought the home, it is the seller’s agent.', es: 'Encuentre al agente del anuncio: aparece en la página del anuncio antiguo (Zillow, Redfin o Realtor.com) o en sus documentos de cierre. Si compró la casa, es el agente del vendedor.' },
      { en: 'Send the listing agent letter. It asks them to mark the photos, tours and floor plans private (or delete them) in the MLS, turn off syndication, and unpublish any property website and tour they ordered.', es: 'Envíe la carta para el agente. Pide marcar las fotos, recorridos y planos como privados (o borrarlos) en el MLS, apagar la distribución y despublicar cualquier sitio o recorrido que hayan encargado.' },
      { en: 'Be patient with your agent. Marketing a home online is part of their job and most follow proper procedures; once photos are published, copies spread to sites they don’t control, and some MLSs require photos to stay on file. Agents aren’t legally required to do this in most states, but most will help. If you don’t hear back in a week, a friendly follow-up or a call to their office usually does it.', es: 'Tenga paciencia con su agente. Promocionar una casa en internet es parte de su trabajo y la mayoría sigue los procedimientos correctos; una vez publicadas, las fotos se copian a sitios que no controlan, y algunos MLS exigen conservarlas. En la mayoría de los estados no están obligados por ley, pero la mayoría ayudará. Si no recibe respuesta en una semana, un recordatorio amable o una llamada a su oficina suele bastar.' },
      KEEP_RECORDS,
    ],
    letters: ['listing_agent'],
    tips: [{ en: 'Buying or selling soon? Add a clause to the contract asking the listing agent to remove interior photos from the MLS at closing.', es: '¿Va a comprar o vender pronto? Agregue una cláusula al contrato pidiendo que el agente quite las fotos interiores del MLS al cierre.' }],
    verify: 'manual',
    sources: ['https://www.reso.org/blog/media-permissions-private-photos/', 'https://blog.crmls.org/updates/safety-first-why-crmls-is-removing-most-images-of-closed-listings-from-idx-syndication/', 'https://www.rismedia.com/2026/09/24/new-jersey-bill-takes-aim-at-listing-photo-removal-after-home-sales-as-privacy-concerns-mount/'],
  },
  google: {
    key: 'google', name: 'Google Search and Images', difficulty: 'easy', minutes: 5, status: 'verified', checkedOn: CHECKED,
    outcome: { en: 'Google can’t delete another site’s page, but once a page or photo is gone or changed, Google’s outdated-content tool clears the old copy from search and image results.', es: 'Google no puede borrar la página de otro sitio, pero cuando una página o foto ya no existe o cambió, la herramienta de contenido desactualizado de Google borra la copia antigua de la búsqueda y de imágenes.' },
    steps: [
      { en: 'Wait until the site has removed the photo or page (use the other playbooks first).', es: 'Espere a que el sitio haya quitado la foto o la página (use primero las otras guías).' },
      { en: 'For a page: open the Refresh Outdated Content tool, choose “New request”, paste the page link and submit.', es: 'Para una página: abra la herramienta Refresh Outdated Content, elija “New request”, pegue el enlace de la página y envíe.', link: { url: 'https://search.google.com/search-console/remove-outdated-content', en: 'Refresh outdated content', es: 'Actualizar contenido desactualizado' } },
      { en: 'For an image: search Google Images, right-click the thumbnail and copy its link address, then submit it in the same tool using the image option.', es: 'Para una imagen: busque en Google Imágenes, haga clic derecho en la miniatura y copie la dirección del enlace, luego envíela en la misma herramienta con la opción de imagen.', link: { url: 'https://support.google.com/websearch/answer/6349986', en: 'Google help: refresh outdated content', es: 'Ayuda de Google: actualizar contenido' } },
      { en: 'If a result shows your personal contact information, use Google’s “Results about you” removal request.', es: 'Si un resultado muestra su información de contacto personal, use la solicitud de eliminación “Results about you” de Google.', link: { url: 'https://support.google.com/websearch/answer/13652412', en: 'Remove personal info from Google', es: 'Quitar información personal de Google' } },
    ],
    letters: [],
    verify: 'manual',
    sources: ['https://support.google.com/websearch/answer/6349986'],
  },
  bing: {
    key: 'bing', name: 'Bing', difficulty: 'easy', minutes: 5, status: 'researched', checkedOn: CHECKED,
    outcome: { en: 'Bing’s Content Removal Tool clears outdated pages and cached images once the original is gone. It can take up to four weeks.', es: 'La herramienta de eliminación de contenido de Bing borra páginas desactualizadas e imágenes en caché cuando el original ya no existe. Puede tardar hasta cuatro semanas.' },
    steps: [
      { en: 'After the site removes the page or photo, open Bing’s Content Removal Tool and submit the link.', es: 'Después de que el sitio quite la página o la foto, abra la herramienta de eliminación de contenido de Bing y envíe el enlace.', link: { url: 'https://www.bing.com/webmasters/help/bing-content-removal-tool-cb6c294d', en: 'Bing content removal', es: 'Eliminación de contenido de Bing' } },
    ],
    letters: [],
    verify: 'manual',
    sources: ['https://learn.microsoft.com/en-my/answers/questions/2343598/remove-outdated-url-image-from-bing-cache'],
  },
  streetview: {
    key: 'streetview', name: 'Google Street View', difficulty: 'easy', minutes: 5, status: 'verified', checkedOn: CHECKED,
    outcome: { en: 'Google will permanently blur your house in Street View. Zillow, Redfin and others often show Street View once listing photos are hidden, so this closes the last gap. Blurring cannot be undone.', es: 'Google difumina su casa en Street View de forma permanente. Zillow, Redfin y otros suelen mostrar Street View cuando se ocultan las fotos, así que esto cierra el último hueco. El difuminado no se puede deshacer.' },
    steps: [
      { en: 'Open Google Maps, find your address and enter Street View.', es: 'Abra Google Maps, busque su dirección y entre a Street View.', link: { url: 'https://www.google.com/maps', en: 'Open Google Maps', es: 'Abrir Google Maps' } },
      { en: 'Click “Report a problem” in the lower-right corner.', es: 'Haga clic en “Report a problem” en la esquina inferior derecha.' },
      { en: 'Frame your house in the preview, choose “Request blurring” → “My home”, add details, enter your email and submit.', es: 'Encuadre su casa en la vista previa, elija “Request blurring” → “My home”, agregue detalles, ingrese su correo y envíe.' },
    ],
    letters: [],
    verify: 'manual',
    sources: ['https://www.security.org/data-removal/house-photos/'],
  },
};

/** Playbooks that apply to every home regardless of what the scan found. */
export const ALWAYS: string[] = ['mls', 'google', 'bing', 'streetview'];

export function playbookFor(key: string): Playbook {
  return PLAYBOOKS[key] ?? PLAYBOOKS.brokerage;
}
