// Optimización posterior al build (sin tocar el código fuente):
//  1. Borra los originales de las fotos que Astro copia a dist/_astro pero nunca se sirven.
//  2. Recorta el CSS de cada página a lo que esa página realmente usa.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PurgeCSS } from 'purgecss';

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const posix = (p) => p.split(path.sep).join('/');

// Clases que agregan los scripts en tiempo de ejecución (no están en el HTML inicial).
const SAFELIST = [
  'on', 'open', 'in', 'is-scrolled', 'nav--over', 'nav--solid', 'has-err', 'focused', 'is-editing',
  'zoomed', 'arch--list', 'arch--grid', 'lock', 'is-en'
];

export default function optimize() {
  return {
    name: 'jaquito-optimize',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = walk(out);
        const html = files.filter((f) => f.endsWith('.html'));
        const text = files.filter((f) => /\.(html|css|js)$/.test(f));

        // 1) originales sin usar
        const corpus = text.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
        let removed = 0;
        let bytes = 0;
        for (const f of files) {
          if (!/\/_astro\//.test(posix(f)) || !/\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(f)) continue;
          if (!corpus.includes(path.basename(f))) {
            bytes += fs.statSync(f).size;
            fs.unlinkSync(f);
            removed++;
          }
        }
        logger.info(`originales sin usar eliminados: ${removed} (${(bytes / 1048576).toFixed(1)} MB)`);

        // 2) CSS por página
        let before = 0;
        let after = 0;
        for (const file of html) {
          let src = fs.readFileSync(file, 'utf8');
          const m = src.match(/<style>([\s\S]*?)<\/style>/);
          if (!m || !m[1].includes(':root')) continue;
          const [res] = await new PurgeCSS().purge({
            content: [{ raw: src.replace(m[0], ''), extension: 'html' }],
            css: [{ raw: m[1] }],
            safelist: { standard: SAFELIST },
            keyframes: true,
            variables: false
          });
          before += m[1].length;
          after += res.css.length;
          src = src.replace(m[0], () => `<style>${res.css}</style>`);
          fs.writeFileSync(file, src);
        }
        logger.info(`CSS inline: ${(before / html.length / 1024).toFixed(1)} KB → ${(after / html.length / 1024).toFixed(1)} KB por página (media)`);
      }
    }
  };
}
