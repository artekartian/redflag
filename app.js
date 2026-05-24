(function () {
  // ---- Mobile menu wiring (optional on pages without menu) ----
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('overlay');
  const menu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('menuClose');

  let lastFocus = null;

  function isOpen() {
    return menuBtn && menuBtn.getAttribute('aria-expanded') === 'true';
  }

  function openMenu() {
    if (!menuBtn || !overlay || !menu) return;
    lastFocus = document.activeElement;

    menu.hidden = false;
    overlay.hidden = false;

    requestAnimationFrame(() => {
      menu.classList.add('active');
      overlay.classList.add('active');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });

    const firstLink = menu.querySelector('a');
    if (firstLink) setTimeout(() => firstLink.focus(), 50);
  }

  function closeMenu() {
    if (!menuBtn || !overlay || !menu) return;
    menu.classList.remove('active');
    overlay.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    setTimeout(() => {
      menu.hidden = true;
      overlay.hidden = true;
      if (lastFocus) lastFocus.focus();
    }, 260);
  }

  function toggleMenu() {
    isOpen() ? closeMenu() : openMenu();
  }

  if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });

  // Close after clicking a link in mobile menu
  if (menu) {
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });
  }

  // ---- Auto active link (desktop + mobile) ----
  function normalizePath(path) {
    // remove trailing slash
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  }

  function getCurrentFile() {
    // /foo/bar/index.html -> index.html
    const p = normalizePath(window.location.pathname);
    const parts = p.split('/');
    const last = parts[parts.length - 1] || 'index.html';
    return last === '' ? 'index.html' : last;
  }

  function cleanHref(href) {
    // keep only filename or folder (blog/)
    try {
      const u = new URL(href, window.location.href);
      const path = normalizePath(u.pathname);
      const parts = path.split('/');
      return parts[parts.length - 1] || 'index.html';
    } catch {
      return href;
    }
  }

  function setActiveLinks(containerSelector) {
    const current = getCurrentFile();

    document.querySelectorAll(containerSelector + ' a').forEach(a => {
      a.classList.remove('active');
    });

    document.querySelectorAll(containerSelector + ' a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;

      // handle anchors
      if (href.startsWith('#')) return;

      // handle blog root link "./blog/"
      if (href.includes('/blog')) {
        const isBlog = window.location.pathname.includes('/blog');
        if (isBlog) a.classList.add('active');
        return;
      }

      const file = cleanHref(href);
      if (file === current) a.classList.add('active');

      // treat folder root as index.html
      if (current === '' || current === 'index.html') {
        if (file === '' || file === 'index.html' || href === './' || href === '/') {
          a.classList.add('active');
        }
      }
    });
  }

  // desktop + mobile menu
  setActiveLinks('.nav-links');
  setActiveLinks('#mobileMenu');

// Sticky CTA padding (only if element exists)
const sticky = document.querySelector('.sticky-cta');
if (sticky) document.body.classList.add('has-sticky-cta');

// Hide sticky CTA when menu opens
function setMenuState(open){
  document.body.classList.toggle('menu-open', open);
}

// Podpinamy do istniejących open/close
const _openMenu = openMenu;
const _closeMenu = closeMenu;

openMenu = function(){ setMenuState(true); _openMenu(); };
closeMenu = function(){ setMenuState(false); _closeMenu(); };

// Sticky CTA: dodaj padding, jeśli pasek istnieje
const sticky = document.querySelector('.sticky-cta');
if (sticky) document.body.classList.add('has-sticky-cta');

// Sticky CTA: chowaj, gdy menu mobilne otwarte
function setMenuOpenState(open){
  document.body.classList.toggle('menu-open', open);
}

// Jeśli masz openMenu/closeMenu w tym samym app.js, dopnij sygnał:
const __openMenu = openMenu;
const __closeMenu = closeMenu;

openMenu = function(){ setMenuOpenState(true); __openMenu(); };
closeMenu = function(){ setMenuOpenState(false); __closeMenu(); };

})();