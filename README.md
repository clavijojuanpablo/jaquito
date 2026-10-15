# Jaquito — sitio web (Astro)

Maquetación fiel del diseño de Claude Design ("Jaquito — Artista visual · Medellín"), hecha en [Astro](https://astro.build) con la meta de que sea **lo más rápido posible**:

- HTML estático, **sin React ni frameworks en el navegador**. Todo el JavaScript de la web son ~4 scripts pequeños (menú, filtros, lightbox, formulario) que solo se cargan en la página que los usa.
- CSS inline y recortado por página en el build (solo lo que esa página usa).
- Fotos optimizadas automáticamente (AVIF + WebP, varios tamaños, `srcset`, carga diferida, sin saltos de layout).
- Fuente Inter propia (sin Google Fonts), precargada.
- Transiciones entre páginas y "vuelo" de la imagen de la obra con View Transitions nativas (cero JS de librería) y precarga de páginas con Speculation Rules.
- Español (`/`) e inglés (`/en/`) con `hreflang`, sitemap y metadatos.

## Comandos

```sh
npm install          # una sola vez
npm run dev          # desarrollo en http://localhost:4321
npm run build        # genera la carpeta dist/ lista para subir
npm run preview      # prueba local del build
```

Necesita Node 22.12 o superior.

---

## Panel de edición (para el artista) — Pages CMS

Las obras, precios, fotos (también las portadas) y datos de contacto se editan desde un panel web, sin tocar código ni git. No hay base de datos: el panel edita los mismos archivos JSON del repo y hace el commit; Hostinger publica solo.

**Configuración (una sola vez):**
1. El artista crea una cuenta en GitHub y se le agrega como colaborador del repo (Settings → Collaborators).
2. Entra a https://app.pagescms.org, inicia sesión con GitHub, autoriza la app de Pages CMS para este repo y lo abre.
3. Listo. El formulario lo define `.pages.yml` en la raíz.

**Uso:** Obras → abrir una obra → cambiar lo que quiera (precio, disponible, fotos, texto…) → Guardar. Para una obra nueva, el botón "Agregar". Unos minutos después el cambio está en la web.

- Las fotos que se suben desde el panel quedan en `src/assets/obras/` y su ruta se guarda en `foto` / `detalles` del JSON.
- El precio en USD se calcula solo con `copPorUsd` de `src/data/site.json` (editable en "Datos del sitio") si la obra no tiene `priceUSD`.
- Los años del filtro de "Obra" salen de las obras: no hay que mantener una lista.
- Si se agrega una serie nueva en "Datos del sitio", hay que añadirla también en las opciones de `series` de `.pages.yml`.

---

## Cómo cambiar las imágenes (sin tocar código)

### Fotos de las obras — `src/assets/obras/<id-de-la-obra>/`

Ya existe una carpeta por obra (`manglar`, `febrero-580`, `laguna-1`, …). Solo suelta ahí las fotos:

```
src/assets/obras/manglar/
   principal.jpg     ← la obra (es la que sale en tarjetas, ficha y lightbox)
   detalle-1.jpg     ← fotos de detalle, en orden de nombre
   detalle-2.jpg
   ...
```

- Cualquier tamaño y formato (`jpg`, `png`, `webp`, `avif`). Sube el original en buena resolución (≥ 2400 px de ancho si quieres zoom); el build genera las versiones livianas.
- La foto se llama **`principal`** (también vale `main`, `portada` o `cover`). Si no existe, se usa la primera por orden alfabético.
- Los **detalles** son todas las demás fotos de la carpeta, ordenadas por nombre (`detalle-1`, `detalle-2`, … `detalle-10`: el orden numérico se respeta). No hay que decir cuántos son: si hay 1 se muestra una sola, si hay varias, un carrusel con puntos.
- La proporción de cada tarjeta sale de la foto real. Mientras no haya foto se ve el bloque de color del diseño.

### Fotos del sitio — `src/assets/site/`

Desde el panel: "Fotos del sitio" (guarda las rutas en `src/data/fotos.json`). A mano: deja el archivo con uno de estos nombres; se usa cuando la ruta del panel está vacía.

| Archivo (cualquier extensión de imagen)                     | Dónde se usa                        |
| ----------------------------------------------------------- | ----------------------------------- |
| `home-hero-mobile` · `home-hero-desktop`                    | Portada de Inicio                   |
| `sobremi-hero-mobile` · `sobremi-hero-desktop`              | Portada de Sobre mí                 |
| `sobremi-jaquito-mobile` · `sobremi-jaquito-desktop`        | Foto de infancia en "Quién es Jaquito" |

Si solo subes una de las dos versiones (móvil o escritorio), se usa para ambas.

### PDFs de "Documentos" — `public/docs/`

`jaquito-cv-es.pdf`, `jaquito-statement-es.pdf`, `jaquito-dossier-es.pdf` y las versiones `-en`. Solo se muestran en Sobre mí los que existen.

---

## Cómo agregar o editar una obra

Lo normal es hacerlo desde el panel. A mano: cada obra es un archivo en `src/content/obras/<id>.json` (el `<id>` es la URL y el nombre de la carpeta de fotos):

```json
{
  "catalog": "JB-2026-006",
  "year": 2026,
  "title": "Nombre de la obra",
  "series": "atmos",
  "tech": { "es": "Acrílico sobre lienzo", "en": "Acrylic on canvas" },
  "dim": "100 × 85 cm",
  "available": true,
  "priceCOP": 500000,
  "priceUSD": 128,
  "featured": null,
  "ph": "ph-stone",
  "curatorial": { "es": ["Párrafo 1", "Párrafo 2"], "en": ["Paragraph 1", "Paragraph 2"] }
}
```

- `series`: `laguna`, `dorada`, `atmos`, `ventanas` o `null` (se definen en `src/data/site.json`).
- `featured`: `1`, `2`, `3`… para que salga en "Obras destacadas" del inicio (en ese orden); `null` si no.
- `available`: `true` muestra la etiqueta verde, el precio y el botón de WhatsApp.
- `dim` es `alto × ancho cm`. `curatorial` puede ser `null`.
- `priceUSD` es opcional (se calcula). `foto` / `detalles` son opcionales: si no están, se usan las fotos de la carpeta.
- Después crea la carpeta `src/assets/obras/<id>/` con sus fotos. El orden en las listas es por año y número de catálogo (más reciente primero).

## Textos, contacto y redes

- Todos los textos (ES/EN) están en `src/data/copy.json`.
- Correo, WhatsApp, Instagram, Pinterest y TikTok: `src/data/site.json` → `contact` (también desde el panel, en "Datos del sitio").

## Formulario de contacto

El sitio es estático, así que el formulario necesita un destino para enviar el mensaje:

1. Crea un formulario en un servicio como Formspree, Web3Forms o Getform.
2. Copia `.env.example` a `.env` y pon la URL en `PUBLIC_CONTACT_ENDPOINT=...` (también en las variables de entorno de tu hosting).

Sin esa variable, al enviar se abre el correo del visitante con el mensaje ya redactado (`mailto:`).

## Publicar

`npm run build` genera `dist/`. Sirve en cualquier hosting estático (Netlify, Cloudflare Pages, Vercel, GitHub Pages…). `public/_headers` ya configura caché larga para Netlify / Cloudflare Pages. Cambia el dominio en `astro.config.mjs` (`site`) y `public/robots.txt` si no es `jaquito.art`.

## Estructura

```
src/
  assets/obras/<id>/     fotos de cada obra
  assets/site/           fotos de portadas
  content/obras/*.json   datos de cada obra
  data/                  copy.json (textos) · site.json (contacto, series)
  components/ layouts/ views/ pages/   maquetación
  styles/design.css      CSS del diseño, adaptado a página real
  styles/adapt.css       ajustes de la adaptación
  scripts/               JS mínimo (menú, filtros, lightbox, formulario)
integrations/optimize.mjs   recorta CSS por página y limpia originales tras el build
_referencia/             exportación original de Claude Design
```
