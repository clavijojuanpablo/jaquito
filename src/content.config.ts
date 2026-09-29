import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const bilingual = z.object({ es: z.string(), en: z.string() });
const paragraphs = z.object({ es: z.array(z.string()), en: z.array(z.string()) });

/**
 * Una obra = un archivo JSON en src/content/obras/<id>.json
 * Las fotos NO van aquí: van en src/assets/obras/<id>/ (ver README).
 */
const obras = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/obras' }),
  schema: z.object({
    catalog: z.string(),
    year: z.number(),
    title: z.string(),
    titleEn: z.string().optional(),
    series: z.string().nullable().default(null),
    tech: bilingual,
    dim: z.string().nullable().default(null),
    available: z.boolean().default(false),
    priceCOP: z.number().nullable().default(null),
    priceUSD: z.number().nullable().default(null),
    // 1, 2, 3… = aparece en "Obras destacadas" del inicio, en ese orden
    featured: z.number().nullable().default(null),
    // color del placeholder mientras no haya foto
    ph: z
      .enum(['ph-clay', 'ph-sage', 'ph-slate', 'ph-ochre', 'ph-rose', 'ph-ink', 'ph-olive', 'ph-stone'])
      .default('ph-stone'),
    curatorial: paragraphs.nullable().default(null)
  })
});

export const collections = { obras };
