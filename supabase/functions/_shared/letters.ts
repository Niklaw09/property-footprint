// Pre-written request letters. Plain text, ready to paste into an email or a support form.
import type { LetterKind } from './playbooks.ts';

export interface LetterContext {
  lang: 'en' | 'es';
  ownerName: string; // may be blank; we leave a placeholder
  address: string;
  siteName: string;
  urls: string[];
  date?: string;
  relation?: 'owner' | 'buyer' | 'tenant';
}

export interface Letter {
  subject: string;
  body: string;
}

const LABEL: Record<LetterKind, { en: string; es: string }> = {
  site_support: { en: 'Request to the website', es: 'Solicitud al sitio web' },
  listing_agent: { en: 'Request to the listing agent', es: 'Solicitud al agente del anuncio' },
  photographer: { en: 'Request to the photographer', es: 'Solicitud al fotógrafo' },
  privacy_rights: { en: 'Formal privacy (deletion) request', es: 'Solicitud formal de privacidad (eliminación)' },
  uploader: { en: 'Request to the person who posted it', es: 'Solicitud a quien lo publicó' },
};

export function letterLabel(kind: LetterKind, lang: 'en' | 'es'): string {
  return LABEL[kind][lang];
}

export function buildLetter(kind: LetterKind, c: LetterContext): Letter {
  const name = c.ownerName.trim() || (c.lang === 'en' ? '[Your name]' : '[Su nombre]');
  const links = c.urls.length ? c.urls.map((u) => `- ${u}`).join('\n') : c.lang === 'en' ? '- [link]' : '- [enlace]';
  const date = c.date ?? new Date().toISOString().slice(0, 10);
  const rel = c.relation ?? 'owner';
  const en = c.lang === 'en';
  const who = en
    ? rel === 'tenant' ? `I live at ${c.address}` : `I am the current owner of ${c.address}`
    : rel === 'tenant' ? `Vivo en ${c.address}` : `Soy el propietario actual de ${c.address}`;

  switch (kind) {
    case 'site_support':
      return en
        ? {
            subject: `Photo removal request: ${c.address}`,
            body: `Hello ${c.siteName} team,

${who}. The following page still shows listing photos, tours and/or floor plans of the inside of my home from a past sale:

${links}

The listing is no longer active, and these images expose the layout and contents of my home. Please remove or hide all interior and exterior photos, virtual tours, videos and floor plans for this property, and stop displaying any new copies you receive from listing feeds.

I can provide proof of ownership (deed or property tax bill) through your secure process. Please reply with a case number and let me know when the images have been removed.

Thank you,
${name}
${date}`,
          }
        : {
            subject: `Solicitud para quitar fotos: ${c.address}`,
            body: `Hola, equipo de ${c.siteName}:

${who}. La siguiente página todavía muestra fotos, recorridos y/o planos del interior de mi casa de una venta anterior:

${links}

El anuncio ya no está activo y estas imágenes exponen la distribución y el contenido de mi hogar. Les pido que quiten u oculten todas las fotos interiores y exteriores, recorridos virtuales, videos y planos de esta propiedad, y que no muestren nuevas copias que reciban de los anuncios.

Puedo enviar prueba de propiedad (escritura o recibo de impuestos) por su proceso seguro. Por favor respondan con un número de caso y avísenme cuando las imágenes se hayan quitado.

Gracias,
${name}
${date}`,
          };

    case 'listing_agent':
      return en
        ? {
            subject: `Please remove listing photos for ${c.address}`,
            body: `Hi,

${who}. You (or your brokerage) were the listing agent for this home. I understand that once a home is marketed online, its photos are copied to many sites outside your control, so I'm only asking for what you're able to do. The photos are still online, including:

${links}

If possible, could you please:
1. In the MLS, mark all photos, virtual tours, videos and floor plans for this listing as private (or delete them), and turn off syndication/IDX display for them.
2. Remove the listing and its media from your own and your brokerage's websites.
3. Unpublish any single-property website, Matterport or other 3D tour, and video you or your photographer created for this listing.
4. Ask your photographer or media company to do the same on their platform.

Many MLSs allow this after closing, though I know some require photos to stay on file. If any of these aren't possible, just let me know and I'll contact the sites directly. Thank you for your help with this, I really appreciate it.

Thank you,
${name}
${date}`,
          }
        : {
            subject: `Por favor quite las fotos del anuncio de ${c.address}`,
            body: `Hola:

${who}. Usted (o su correduría) fue el agente del anuncio de esta casa. Entiendo que, una vez que una casa se promociona en internet, sus fotos se copian a muchos sitios que usted no controla, así que solo le pido lo que esté a su alcance. Las fotos siguen en internet, por ejemplo:

${links}

Si es posible, ¿podría:
1. En el MLS, marcar como privadas (o borrar) todas las fotos, recorridos virtuales, videos y planos de este anuncio, y apagar su distribución/IDX.
2. Quitar el anuncio y sus imágenes de su sitio web y del de su correduría.
3. Despublicar cualquier sitio web de la propiedad, recorrido de Matterport u otro recorrido 3D y video que usted o su fotógrafo hayan creado para este anuncio.
4. Pedir a su fotógrafo o empresa de medios que haga lo mismo en su plataforma.

Muchos MLS lo permiten después del cierre, aunque sé que algunos exigen conservar las fotos. Si algo de esto no es posible, avíseme y me comunicaré con los sitios directamente. Muchas gracias por su ayuda.

Gracias,
${name}
${date}`,
          };

    case 'photographer':
      return en
        ? {
            subject: `Unpublish property media for ${c.address}`,
            body: `Hello,

${who}. The photos, video and/or 3D tour you produced for the past listing of this home are still public here:

${links}

The sale is complete. Please unpublish the property website, tour and videos for this address, and remove any embeds you control. As the copyright holder, you may also be able to ask other sites that copied your photos to take them down; I would be grateful if you would.

Please confirm by email once it's done.

Thank you,
${name}
${date}`,
          }
        : {
            subject: `Despublicar el material de la propiedad en ${c.address}`,
            body: `Hola:

${who}. Las fotos, el video y/o el recorrido 3D que usted produjo para el anuncio anterior de esta casa siguen públicos aquí:

${links}

La venta ya terminó. Le pido que despublique el sitio web de la propiedad, el recorrido y los videos de esta dirección, y que quite cualquier inserción que usted controle. Como titular de los derechos de autor, también puede pedir a otros sitios que copiaron sus fotos que las quiten; se lo agradecería mucho.

Por favor confirme por correo cuando esté hecho.

Gracias,
${name}
${date}`,
          };

    case 'privacy_rights':
      return en
        ? {
            subject: `Privacy request: delete personal information about ${c.address}`,
            body: `To the ${c.siteName} privacy team,

${who}. Under applicable state privacy law (for example the California Consumer Privacy Act and similar laws in other states), I request that you delete the personal information you hold and display about me and my home, including the listing photos, virtual tours, videos and floor plans shown at:

${links}

Please also confirm that you will not sell or share this information, and tell me what verification you need. If you believe an exemption applies, please explain which one and remove the interior images voluntarily, as they reveal the layout and contents of my home.

Sincerely,
${name}
${date}`,
          }
        : {
            subject: `Solicitud de privacidad: eliminar información personal sobre ${c.address}`,
            body: `Al equipo de privacidad de ${c.siteName}:

${who}. De acuerdo con la ley de privacidad estatal aplicable (por ejemplo la Ley de Privacidad del Consumidor de California y leyes similares en otros estados), solicito que eliminen la información personal que tienen y muestran sobre mí y mi casa, incluidas las fotos del anuncio, recorridos virtuales, videos y planos que aparecen en:

${links}

Les pido también que confirmen que no venderán ni compartirán esta información, y que me indiquen qué verificación necesitan. Si consideran que aplica alguna excepción, expliquen cuál y quiten voluntariamente las imágenes interiores, ya que revelan la distribución y el contenido de mi hogar.

Atentamente,
${name}
${date}`,
          };

    case 'uploader':
      return en
        ? {
            subject: `Please take down the video/photos of ${c.address}`,
            body: `Hi,

${who}. You posted photos or a video of my home from its past listing here:

${links}

The home has sold and these images show the inside of where my family lives. Would you please delete the post or set it to private? Thank you for understanding.

${name}
${date}`,
          }
        : {
            subject: `Por favor quite el video/las fotos de ${c.address}`,
            body: `Hola:

${who}. Usted publicó fotos o un video de mi casa de su anuncio anterior aquí:

${links}

La casa ya se vendió y estas imágenes muestran el interior de donde vive mi familia. ¿Podría borrar la publicación o hacerla privada? Gracias por su comprensión.

${name}
${date}`,
          };
  }
}
