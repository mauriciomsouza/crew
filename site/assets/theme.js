// Theme toggle: follows the system until the viewer picks; the choice is a
// per-viewer convenience only, so storage failures are ignored.
const KEY = 'crew-theme';
const root = document.documentElement;
try {
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
} catch {
  /* storage unavailable */
}

function current() {
  if (root.dataset.theme) return root.dataset.theme;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initTheme() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (btn) {
    const sync = () => btn.setAttribute('aria-label', `Switch to ${current() === 'dark' ? 'light' : 'dark'} theme`);
    sync();
    btn.addEventListener('click', () => {
      root.dataset.theme = current() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, root.dataset.theme);
      } catch {
        /* storage unavailable */
      }
      sync();
    });
  }
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        const prev = b.innerHTML;
        b.textContent = 'Copied';
        setTimeout(() => (b.innerHTML = prev), 1200);
      } catch {
        /* clipboard blocked */
      }
    });
  }
}
