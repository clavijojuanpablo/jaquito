/* Comportamiento común: navegación, menú móvil, revelado al hacer scroll, transiciones. */

const root = document.documentElement;
const nav = document.getElementById('nav');

/* ---- nav: borde al hacer scroll; en Inicio pasa de transparente a sólida ---- */
if (nav) {
  const overHero = nav.dataset.over === '1';
  let solid = false;
  const onScroll = () => {
    const s = window.scrollY > 12;
    if (s === solid) return;
    solid = s;
    nav.classList.toggle('is-scrolled', s);
    if (overHero) {
      nav.classList.toggle('nav--over', !s);
      nav.classList.toggle('nav--solid', s);
    }
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

/* ---- menú a pantalla completa (móvil) ---- */
const menu = document.getElementById('menu');
const burger = document.querySelector<HTMLButtonElement>('[data-menu-open]');
if (menu && burger) {
  const setMenu = (open: boolean) => {
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.toggleAttribute('inert', !open);
    burger.setAttribute('aria-expanded', String(open));
    root.classList.toggle('lock', open);
    if (open) menu.querySelector<HTMLElement>('[data-menu-close]')?.focus();
    else burger.focus({ preventScroll: true });
  };
  burger.addEventListener('click', () => setMenu(true));
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && menu.classList.contains('open') && setMenu(false));
  matchMedia('(min-width:1000px)').addEventListener('change', (m) => m.matches && menu.classList.contains('open') && setMenu(false));
  // volver desde bfcache con el menú abierto
  addEventListener('pageshow', () => menu.classList.contains('open') && setMenu(false));
}

/* ---- revelado al entrar en pantalla (una sola vez) ---- */
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if (reveals.length) {
  if (!('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const delay = el.dataset.delay;
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.classList.add('in');
          io.unobserve(el);
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  }
}

/* ---- botón "volver" de la ficha: regresa a donde estabas (lista, disponibles, inicio) ---- */
document.querySelector<HTMLAnchorElement>('[data-back]')?.addEventListener('click', (e) => {
  try {
    const ref = document.referrer && new URL(document.referrer);
    if (ref && ref.origin === location.origin && !/\/(obra|work)\/[^/]+\/?$/.test(ref.pathname) && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  } catch { /* usa el href normal */ }
});

/* ---- vuelo de la lámina entre lista y ficha (View Transitions entre documentos) ---- */
const workId = (url: string) => new URL(url, location.href).pathname.match(/\/(?:obra|work)\/([^/]+)\/?$/)?.[1];
const markPlate = (id: string) => {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-work="${id}"]`)) {
    if (el.offsetParent !== null) { el.style.viewTransitionName = 'work-plate'; return; }
  }
};
addEventListener('pageswap', (e: any) => {
  const url = e.activation?.entry?.url;
  const id = e.viewTransition && url && workId(url);
  if (id) markPlate(id);
});
addEventListener('pagereveal', (e: any) => {
  const from = (window as any).navigation?.activation?.from?.url;
  const id = e.viewTransition && from && workId(from);
  if (id) markPlate(id);
});

export {};
