import copy from '../data/copy.json';
import site from '../data/site.json';

export type Lang = 'es' | 'en';
export type Copy = (typeof copy)['es'];
export const LANGS: Lang[] = ['es', 'en'];
export const CONTACT = site.contact;
export const SERIES = (site.series as { id: string; es: string; en?: string | null }[]).map((s) => ({
  id: s.id,
  es: s.es,
  en: s.en || s.es
}));
/** pesos por dólar, para el "≈ $ USD" cuando una obra no tiene priceUSD */
export const COP_PER_USD = Number(site.copPorUsd) || 3915;

export const getCopy = (lang: Lang): Copy => copy[lang] as Copy;

export type RouteKey = 'home' | 'work' | 'available' | 'about' | 'contact';

const ROUTES: Record<RouteKey, Record<Lang, string>> = {
  home: { es: '/', en: '/en/' },
  work: { es: '/obra/', en: '/en/work/' },
  available: { es: '/disponibles/', en: '/en/available/' },
  about: { es: '/sobre-mi/', en: '/en/about/' },
  contact: { es: '/contacto/', en: '/en/contact/' }
};

export const route = (key: RouteKey, lang: Lang) => ROUTES[key][lang];
export const workHref = (id: string, lang: Lang) => `${ROUTES.work[lang]}${id}/`;
export const otherLang = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es');

export const formatCOP = (n: number) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const pad2 = (n: number) => String(n).padStart(2, '0');

export const waLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
