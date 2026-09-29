import type { ImageMetadata } from 'astro';

/**
 * IMÁGENES DEL SITIO — sin tocar código: deja el archivo en src/assets/site/
 * con uno de estos nombres (cualquier formato jpg/png/webp/avif):
 *   home-hero-mobile   home-hero-desktop
 *   sobremi-hero-mobile   sobremi-hero-desktop
 *   sobremi-jaquito-mobile   sobremi-jaquito-desktop
 * Si falta alguna se muestra el placeholder de color del diseño.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/site/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true }
);
const byName = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(/\/([^/]+)\.[a-z0-9]+$/i);
  if (m) byName.set(m[1].toLowerCase(), mod.default);
}
export const siteImage = (name: string): ImageMetadata | null => byName.get(name.toLowerCase()) ?? null;
