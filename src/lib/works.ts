import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { SERIES, COP_PER_USD, type Lang } from './i18n';

/**
 * FOTOS DE LAS OBRAS
 *  1. Si la obra tiene "foto" / "detalles" (lo que guarda el panel), se usan esas rutas.
 *  2. Si no, se toman de la carpeta, sin tocar código:
 *       src/assets/obras/<id-de-la-obra>/principal.jpg   ← la obra
 *       src/assets/obras/<id-de-la-obra>/detalle-1.jpg   ← fotos de detalle (en orden alfabético/numérico)
 * Cualquier tamaño y formato (jpg, png, webp, avif): el sitio genera las versiones optimizadas.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/obras/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true }
);

/** "/src/assets/obras/aura/x.jpg", "src/assets/obras/aura/x.jpg", "aura/x.jpg"… → la imagen */
function resolvePath(ref: string | null | undefined, id: string): ImageMetadata | null {
  if (!ref) return null;
  const clean = ref.replace(/\\/g, '/').replace(/^\.?\/+/, '');
  const i = clean.indexOf('assets/obras/');
  const hit = modules[`/src/${i >= 0 ? clean.slice(i) : `assets/obras/${clean}`}`];
  if (!hit) console.warn(`[obras] ${id}: no encuentro la foto "${ref}", se ignora`);
  return hit?.default ?? null;
}

const MAIN_NAMES = /^(principal|main|portada|cover)$/i;
const natural = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

const byFolder = new Map<string, { name: string; img: ImageMetadata }[]>();
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(/\/obras\/([^/]+)\/([^/]+)\.[a-z0-9]+$/i);
  if (!m) continue;
  const [, id, name] = m;
  if (!byFolder.has(id)) byFolder.set(id, []);
  byFolder.get(id)!.push({ name, img: mod.default });
}

export interface Work {
  id: string;
  catalog: string;
  year: number;
  title: string;
  titleEn: string;
  series: { id: string; es: string; en: string } | null;
  tech: { es: string; en: string };
  dim: string | null;
  available: boolean;
  priceCOP: number | null;
  priceUSD: number | null;
  featured: number | null;
  ph: string;
  curatorial: { es: string[]; en: string[] } | null;
  main: ImageMetadata | null;
  details: ImageMetadata[];
}

/** "100 × 84 cm" → "100 / 84" (forma del placeholder hasta que haya foto) */
export function ratioFromDim(dim: string | null) {
  const m = dim && String(dim).match(/([\d.]+)\s*[×x]\s*([\d.]+)/);
  return m ? `${m[1]} / ${m[2]}` : '4 / 5';
}

/** "100 × 84 cm" → { h, w, unit } */
export function splitDim(dim: string | null) {
  const m = dim && String(dim).match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*([a-z]+)?/i);
  return m ? { h: m[1], w: m[2], unit: m[3] || 'cm' } : null;
}

export const ratioOf = (w: Work) => (w.main ? `${w.main.width} / ${w.main.height}` : ratioFromDim(w.dim));

export async function getWorks(): Promise<Work[]> {
  const entries = await getCollection('obras');
  const works = entries.map((e): Work => {
    const files = (byFolder.get(e.id) ?? []).slice().sort((a, b) => natural.compare(a.name, b.name));
    const mainFile = files.find((f) => MAIN_NAMES.test(f.name)) ?? files[0];
    const { foto, detalles, curatorial, tech, ...data } = e.data;
    const listed = (detalles ?? []).map((d) => resolvePath(d, e.id)).filter((x): x is ImageMetadata => !!x);
    // si falta un idioma se usa el otro
    const cEs = curatorial?.es?.filter((p) => p.trim()) ?? [];
    const cEn = curatorial?.en?.filter((p) => p.trim()) ?? [];
    return {
      id: e.id,
      ...data,
      catalog: data.catalog ?? '',
      titleEn: data.titleEn ?? data.title,
      tech: { es: tech.es, en: tech.en ?? tech.es },
      priceUSD: data.priceUSD ?? (data.priceCOP != null ? Math.round(data.priceCOP / COP_PER_USD) : null),
      curatorial: cEs.length || cEn.length ? { es: cEs.length ? cEs : cEn, en: cEn.length ? cEn : cEs } : null,
      series: SERIES.find((s) => s.id === data.series) ?? null,
      // con "foto" manda el panel; sin ella, la carpeta
      main: foto ? resolvePath(foto, e.id) : (mainFile?.img ?? null),
      details: foto ? listed : files.filter((f) => f !== mainFile).map((f) => f.img)
    };
  });
  // más reciente primero: por año y luego por número de catálogo
  return works.sort((a, b) => b.year - a.year || natural.compare(b.catalog, a.catalog));
}

export const workTitle = (w: Work, lang: Lang) => (lang === 'en' ? w.titleEn : w.title);
