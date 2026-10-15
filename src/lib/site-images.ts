import type { ImageMetadata } from 'astro';
import fotos from '../data/fotos.json';

/**
 * IMÁGENES DEL SITIO
 *  1. Las rutas de src/data/fotos.json (lo que guarda el panel, "Fotos del sitio").
 *  2. Si una está vacía, el archivo de src/assets/site/ con uno de estos nombres
 *     (cualquier formato jpg/png/webp/avif):
 *       home-hero-mobile   home-hero-desktop
 *       sobremi-hero-mobile   sobremi-hero-desktop
 *       sobremi-jaquito-mobile   sobremi-jaquito-desktop
 * Si solo hay versión móvil o escritorio, se usa para ambas. Si no hay ninguna,
 * se muestra el placeholder de color del diseño.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/site/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true }
);
const byName = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(/\/([^/]+)\.[a-z0-9]+$/i);
  if (m) byName.set(m[1].toLowerCase(), mod.default);
}

type Slot = { movil?: string | null; escritorio?: string | null };
const PANEL: Record<string, [keyof typeof fotos, keyof Slot]> = {
  'home-hero-mobile': ['inicio', 'movil'],
  'home-hero-desktop': ['inicio', 'escritorio'],
  'sobremi-hero-mobile': ['sobremi', 'movil'],
  'sobremi-hero-desktop': ['sobremi', 'escritorio'],
  'sobremi-jaquito-mobile': ['infancia', 'movil'],
  'sobremi-jaquito-desktop': ['infancia', 'escritorio']
};

function fromPanel(ref: string | null | undefined): ImageMetadata | null {
  if (!ref) return null;
  const clean = ref.replace(/\\/g, '/').replace(/^\.?\/+/, '');
  const i = clean.indexOf('assets/site/');
  const hit = modules[`/src/${i >= 0 ? clean.slice(i) : `assets/site/${clean}`}`];
  if (!hit) console.warn(`[fotos del sitio] no encuentro "${ref}", se usa la de la carpeta`);
  return hit?.default ?? null;
}

export const siteImage = (name: string): ImageMetadata | null => {
  const key = name.toLowerCase();
  const p = PANEL[key];
  return (p && fromPanel((fotos[p[0]] as Slot)?.[p[1]])) || byName.get(key) || null;
};
