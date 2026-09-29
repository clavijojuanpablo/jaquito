/* Obra y Disponibles: vista lista/2 columnas, hoja de filtros, orden y rango de precio. */

const root = document.documentElement;
const arch = document.getElementById('arch') as HTMLElement | null;
const sheet = document.querySelector<HTMLElement>('[data-sheet]');
if (arch && sheet) {
  const kind = arch.dataset.kind;
  const panel = sheet.querySelector<HTMLElement>('.sheet')!;
  const items = [...arch.querySelectorAll<HTMLElement>('[data-item]')];
  const groups = [...arch.querySelectorAll<HTMLElement>('[data-group]')];
  const empty = arch.querySelector<HTMLElement>('[data-empty]');
  const badge = document.querySelector<HTMLElement>('[data-active]');
  const countEls = sheet.querySelectorAll<HTMLElement>('[data-count]');
  const opener = document.querySelector<HTMLElement>('[data-sheet-open]');

  /* ---- vista lista / 2 columnas ---- */
  const viewBtns = document.querySelectorAll<HTMLButtonElement>('[data-view]');
  viewBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const v = b.dataset.view!;
      arch.classList.toggle('arch--list', v === 'list');
      arch.classList.toggle('arch--grid', v === 'grid');
      viewBtns.forEach((x) => {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
    })
  );

  /* ---- hoja de filtros ---- */
  const setSheet = (open: boolean) => {
    sheet.classList.toggle('open', open);
    panel.toggleAttribute('inert', !open);
    root.classList.toggle('lock', open);
    if (open) panel.querySelector<HTMLElement>('[data-sheet-close]')?.focus({ preventScroll: true });
    else opener?.focus({ preventScroll: true });
  };
  document.querySelectorAll('[data-sheet-open]').forEach((b) => b.addEventListener('click', () => setSheet(true)));
  sheet.querySelectorAll('[data-sheet-close]').forEach((b) => b.addEventListener('click', () => setSheet(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && sheet.classList.contains('open') && setSheet(false));

  /* ---- estado ---- */
  const state: Record<string, Set<string>> = { years: new Set(), series: new Set(), status: new Set(), range: new Set() };
  let sort = 'recent';
  const ranges: Record<string, (p: number) => boolean> = {
    low: (p) => p <= 500000,
    mid: (p) => p > 500000 && p <= 1000000,
    high: (p) => p > 1000000
  };

  const visible = (el: HTMLElement) => {
    if (kind === 'work') {
      if (state.years.size && !state.years.has(el.dataset.year!)) return false;
      if (state.series.size && !state.series.has(el.dataset.series!)) return false;
      if (state.status.size && !state.status.has(el.dataset.status!)) return false;
      return true;
    }
    if (state.range.size) {
      const p = Number(el.dataset.price);
      return [...state.range].some((r) => ranges[r]?.(p));
    }
    return true;
  };

  const apply = () => {
    // cada obra está dos veces en el HTML (lista y rejilla): se cuenta solo la rejilla
    let shown = 0;
    for (const el of items) {
      const ok = visible(el);
      el.hidden = !ok;
      if (ok && el.closest('.arch-grid')) shown++;
    }
    groups.forEach((g) => (g.hidden = !g.querySelector('[data-item]:not([hidden])')));
    if (empty) empty.hidden = shown > 0;

    if (kind === 'available') {
      arch.querySelectorAll<HTMLElement>('[data-list]').forEach((list) => {
        const cards = [...list.children] as HTMLElement[];
        cards.sort((a, b) => {
          if (sort === 'desc') return Number(b.dataset.price) - Number(a.dataset.price);
          if (sort === 'asc') return Number(a.dataset.price) - Number(b.dataset.price);
          return Number(a.dataset.idx) - Number(b.dataset.idx);
        });
        cards.forEach((c) => list.appendChild(c));
      });
    }

    countEls.forEach((el) => (el.textContent = String(shown).padStart(2, '0')));
    const active = kind === 'work' ? state.years.size + state.series.size + state.status.size : (sort !== 'recent' ? 1 : 0) + state.range.size;
    if (badge) { badge.textContent = String(active); badge.hidden = active === 0; }
  };

  sheet.querySelectorAll<HTMLButtonElement>('.frow').forEach((b) =>
    b.addEventListener('click', () => {
      const group = b.dataset.group!, value = b.dataset.value!;
      if (b.dataset.single) {
        sheet.querySelectorAll<HTMLButtonElement>(`.frow[data-group="${group}"]`).forEach((x) => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
        sort = value;
      } else {
        const set = state[group];
        const on = !set.has(value);
        on ? set.add(value) : set.delete(value);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      }
      apply();
    })
  );

  sheet.querySelector('[data-clear]')?.addEventListener('click', () => {
    Object.values(state).forEach((s) => s.clear());
    sort = 'recent';
    sheet.querySelectorAll<HTMLButtonElement>('.frow').forEach((x) => {
      const on = x.dataset.single ? x.dataset.value === 'recent' : false;
      x.classList.toggle('on', on);
      x.setAttribute('aria-pressed', String(on));
    });
    apply();
  });
}

export {};
