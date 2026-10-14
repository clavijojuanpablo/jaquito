import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// El panel (Pages CMS) guarda "" cuando un campo queda vacío: lo tratamos como null.
const blank = (v: unknown) => (v === '' || v === undefined ? null : v);
const optNumber = z.preprocess(blank, z.coerce.number().nullable()).default(null);
const optString = z.preprocess(blank, z.string().nullable()).default(null);

const bilingual = z.object({ es: z.string(), en: z.preprocess(blank, z.string().nullable()).default(null) });
const paragraphs = z.object({
  es: z.array(z.string()).nullable().default([]),
  en: z.array(z.string()).nullable().default([])
});

/**
 * Una obra = un archivo JSON en src/content/obras/<id>.json
 * Lo normal es editarlas desde el panel (Pages CMS, ver README) — el archivo
 * .pages.yml de la raíz define el formulario.
 */
const obras = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/obras' }),
  schema: z.object({
    catalog: z.preprocess(blank, z.string().nullable()).default(null),
    year: z.coerce.number(),
    title: z.string(),
    titleEn: optString,
    series: optString,
    tech: bilingual,
    dim: optString,
    available: z.boolean().default(false),
    priceCOP: optNumber,
    // si está vacío se calcula con copPorUsd de src/data/site.json
    priceUSD: optNumber,
    // 1, 2, 3… = aparece en "Obras destacadas" del inicio, en ese orden
    featured: optNumber,
    // color del placeholder mientras no haya foto
    ph: z
      .preprocess(blank, z.enum(['ph-clay', 'ph-sage', 'ph-slate', 'ph-ochre', 'ph-rose', 'ph-ink', 'ph-olive', 'ph-stone']).nullable())
      .transform((v) => v ?? 'ph-stone'),
    curatorial: paragraphs.nullable().default(null),
    // rutas que guarda el panel; si están vacías se usan las fotos de src/assets/obras/<id>/
    foto: z.preprocess((v) => blank(Array.isArray(v) ? v[0] : v), z.string().nullable()).default(null),
    detalles: z
      .preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(z.string()).nullable())
      .transform((v) => (v ?? []).filter(Boolean))
      .default([])
  })
});

export const collections = { obras };
