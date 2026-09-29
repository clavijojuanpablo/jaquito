import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export interface Pic {
  sources: { type: string; srcset: string }[];
  src: string;
  width: number;
  height: number;
  ratio: string;
}

const cache = new Map<string, Promise<Pic>>();

/** Anchos ≤ al original (nunca amplía); si el original es más chico que todos, usa el original. */
function pickWidths(img: ImageMetadata, widths: number[]) {
  const w = [...new Set(widths.filter((x) => x < img.width))];
  if (!w.length || Math.max(...w) < img.width * 0.85) w.push(Math.min(img.width, Math.max(...widths)));
  return [...new Set(w)].sort((a, b) => a - b);
}

/**
 * Genera en build AVIF + WebP en varios anchos a partir del original que el
 * usuario dejó en la carpeta. El <img> de respaldo es WebP.
 */
export function pic(img: ImageMetadata, widths: number[] = [480, 800, 1200, 1600]): Promise<Pic> {
  const key = `${img.src}|${widths.join(',')}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async () => {
      const ws = pickWidths(img, widths);
      const build = async (format: 'avif' | 'webp', quality: number) =>
        Promise.all(ws.map((width) => getImage({ src: img, width, format, quality })));
      const [avif, webp] = await Promise.all([build('avif', 58), build('webp', 76)]);
      const toSet = (list: Awaited<ReturnType<typeof build>>) =>
        list.map((g, i) => `${g.src} ${ws[i]}w`).join(', ');
      const mid = webp[Math.min(1, webp.length - 1)];
      return {
        sources: [
          { type: 'image/avif', srcset: toSet(avif) },
          { type: 'image/webp', srcset: toSet(webp) }
        ],
        src: mid.src,
        width: img.width,
        height: img.height,
        ratio: `${img.width} / ${img.height}`
      };
    })();
    cache.set(key, hit);
  }
  return hit;
}

/** Versión grande (zoom del lightbox). */
export async function full(img: ImageMetadata, width = 2400) {
  const g = await getImage({ src: img, width: Math.min(width, img.width), format: 'webp', quality: 82 });
  return g.src;
}
