import { useEffect, useState } from 'react';

// Tiny hash router: works on any static host (Bolt, Netlify, Vercel) with no rewrite rules.
export type Route =
  | { name: 'home' }
  | { name: 'report'; id: string }
  | { name: 'guides' }
  | { name: 'guide'; key: string }
  | { name: 'signin'; next?: string }
  | { name: 'homes' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').split('?')[0];
  const qs = new URLSearchParams(hash.split('?')[1] ?? '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'r' && parts[1]) return { name: 'report', id: parts[1] };
  if (parts[0] === 'guides' && parts[1]) return { name: 'guide', key: parts[1] };
  if (parts[0] === 'guides') return { name: 'guides' };
  if (parts[0] === 'signin') return { name: 'signin', next: qs.get('next') ?? undefined };
  if (parts[0] === 'homes') return { name: 'homes' };
  return { name: 'home' };
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home': return '#/';
    case 'report': return `#/r/${r.id}`;
    case 'guides': return '#/guides';
    case 'guide': return `#/guides/${r.key}`;
    case 'signin': return `#/signin${r.next ? `?next=${encodeURIComponent(r.next)}` : ''}`;
    case 'homes': return '#/homes';
  }
}

export function go(r: Route) {
  window.location.hash = href(r);
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
