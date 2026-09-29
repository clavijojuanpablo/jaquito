/* Ficha de obra: carrusel de detalles y lightbox con zoom (escritorio) y deslizar (táctil). */

const root = document.documentElement;
const desktopMQ = matchMedia('(min-width:1000px)');

/* ============ carrusel de detalles ============ */
const rail = document.querySelector<HTMLElement>('[data-drail]');
if (rail) {
  const dots = [...document.querySelectorAll<HTMLElement>('[data-dot]')];
  const items = rail.querySelectorAll<HTMLElement>('.drail__item');
  let active = 0;
  const step = () => (items[0]?.getBoundingClientRect().width ?? 0) + 12;
  const go = (k: number) => rail.scrollTo({ left: k * step(), behavior: 'smooth' });
  rail.addEventListener(
    'scroll',
    () => {
      const s = step();
      if (!s) return;
      active = Math.min(items.length - 1, Math.max(0, Math.round(rail.scrollLeft / s)));
      dots.forEach((d, i) => d.classList.toggle('on', i === active));
    },
    { passive: true }
  );
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  document.querySelector('[data-drail-prev]')?.addEventListener('click', () => go(Math.max(0, active - 1)));
  document.querySelector('[data-drail-next]')?.addEventListener('click', () => go(Math.min(items.length - 1, active + 1)));
}

/* ============ lightbox ============ */
interface Plate { src: string; ratio: string; title: string; sub: string }
const lb = document.getElementById('lb');
const dataEl = document.getElementById('lb-data');
if (lb && dataEl) {
  const plates: Plate[] = JSON.parse(dataEl.textContent || '[]');
  const stage = lb.querySelector<HTMLElement>('[data-lb-stage]')!;
  const view = lb.querySelector<HTMLElement>('[data-lb-view]')!;
  const img = view.querySelector('img')!;
  const count = lb.querySelector<HTMLElement>('[data-lb-count]')!;
  const title = lb.querySelector<HTMLElement>('[data-lb-title]')!;
  const sub = lb.querySelector<HTMLElement>('[data-lb-sub]')!;
  const dots = [...lb.querySelectorAll<HTMLElement>('[data-lb-dot]')];
  let index = 0;
  let opener: HTMLElement | null = null;
  let z = { z: 1, x: 0, y: 0 };

  const pad = (n: number) => String(n).padStart(2, '0');
  const paint = () => {
    view.style.transform = `translate(${z.x}px, ${z.y}px) scale(${z.z})`;
    view.classList.toggle('zoomed', z.z > 1);
  };
  const show = (i: number) => {
    index = (i + plates.length) % plates.length;
    const p = plates[index];
    z = { z: 1, x: 0, y: 0 };
    paint();
    view.style.aspectRatio = p.ratio;
    img.src = p.src;
    img.alt = p.title;
    count.textContent = `${pad(index + 1)} / ${pad(plates.length)}`;
    title.textContent = p.title;
    sub.textContent = p.sub;
    dots.forEach((d, k) => d.classList.toggle('on', k === index));
    // precarga la vecina
    const nx = new Image();
    nx.src = plates[(index + 1) % plates.length].src;
  };
  const open = (i: number, from: HTMLElement) => {
    opener = from;
    show(i);
    lb.classList.add('open');
    lb.removeAttribute('inert');
    root.classList.add('lock');
    lb.querySelector<HTMLElement>('[data-lb-close]')?.focus({ preventScroll: true });
  };
  const close = () => {
    lb.classList.remove('open');
    lb.setAttribute('inert', '');
    root.classList.remove('lock');
    opener?.focus({ preventScroll: true });
  };

  document.querySelectorAll<HTMLElement>('[data-lb]').forEach((el) =>
    el.addEventListener('click', () => open(Number(el.dataset.lb), el))
  );
  lb.querySelector('[data-lb-close]')?.addEventListener('click', close);
  lb.querySelector('[data-lb-prev]')?.addEventListener('click', () => show(index - 1));
  lb.querySelector('[data-lb-next]')?.addEventListener('click', () => show(index + 1));
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  /* deslizar para navegar (táctil) */
  let tx = 0, touching = false;
  stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; touching = true; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!touching) return;
    touching = false;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* zoom + arrastre (escritorio): rueda, clic y arrastrar */
  const clamp = (zz: number, x: number, y: number) => {
    if (zz <= 1) return { x: 0, y: 0 };
    const w = (view.offsetWidth * (zz - 1)) / 2, h = (view.offsetHeight * (zz - 1)) / 2;
    return { x: Math.max(-w, Math.min(w, x)), y: Math.max(-h, Math.min(h, y)) };
  };
  const zoomAt = (cx: number, cy: number, nz: number) => {
    const r = view.getBoundingClientRect();
    const mx = r.left + r.width / 2, my = r.top + r.height / 2;
    const z2 = Math.max(1, Math.min(4, nz));
    const px = (cx - mx) / z.z, py = (cy - my) / z.z;
    const o = clamp(z2, z.x + px * (z.z - z2), z.y + py * (z.z - z2));
    z = { z: z2, x: o.x, y: o.y };
    paint();
  };
  stage.addEventListener('wheel', (e) => {
    if (!desktopMQ.matches) return;
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, z.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });

  let drag: { x: number; y: number; ox: number; oy: number; moved: boolean } | null = null;
  view.addEventListener('click', (e) => {
    if (!desktopMQ.matches || drag?.moved) return;
    zoomAt(e.clientX, e.clientY, z.z > 1 ? 1 : 2.5);
  });
  view.addEventListener('pointerdown', (e) => {
    if (!desktopMQ.matches || z.z <= 1 || e.pointerType === 'touch') return;
    drag = { x: e.clientX, y: e.clientY, ox: z.x, oy: z.y, moved: false };
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    const o = clamp(z.z, drag.ox + dx, drag.oy + dy);
    z = { z: z.z, x: o.x, y: o.y };
    paint();
  });
  view.addEventListener('pointerup', () => setTimeout(() => { drag = null; }, 0));
}

export {};
