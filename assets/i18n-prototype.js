const stateKey = 'rostar-i18n-prototype-index-state';
const filter = document.getElementById('filter');
const tree = document.getElementById('tree');

function normalizeHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return url.pathname.split('/docs/i18n-prototypes/').pop() || url.pathname;
  } catch (_) {
    return href;
  }
}

function getStoredState() {
  const raw = sessionStorage.getItem(stateKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function getHashActiveHref() {
  const value = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (!value || value === 'restore') return '';
  return value;
}

function applyFilter() {
  if (!filter || !tree) return;
  const q = filter.value.trim().toLowerCase();
  for (const module of tree.querySelectorAll('.module')) {
    let visible = false;
    const summary = module.querySelector('summary')?.innerText.toLowerCase() || '';
    for (const item of module.querySelectorAll('li')) {
      const hit = !q || item.innerText.toLowerCase().includes(q) || summary.includes(q);
      item.style.display = hit ? '' : 'none';
      visible = visible || hit;
    }
    module.style.display = visible ? '' : 'none';
    if (q && visible) module.open = true;
  }
}

function saveIndexState(activeHref) {
  if (!tree) return;
  const stored = getStoredState();
  const openModules = Array.from(tree.querySelectorAll('.module'))
    .map((module, index) => ({ index, open: module.open }))
    .filter((item) => item.open)
    .map((item) => item.index);
  sessionStorage.setItem(stateKey, JSON.stringify({
    scrollY: window.scrollY,
    filter: filter?.value || '',
    openModules,
    activeHref: activeHref ? normalizeHref(activeHref) : stored?.activeHref || '',
  }));
}

function restoreIndexState() {
  if (!tree) return;
  const hashActiveHref = getHashActiveHref();
  const state = getStoredState() || {};
  if (!hashActiveHref && Object.keys(state).length === 0) return;
  try {
    if (filter && typeof state.filter === 'string') {
      filter.value = state.filter;
    }
    const openSet = new Set(Array.isArray(state.openModules) ? state.openModules : []);
    Array.from(tree.querySelectorAll('.module')).forEach((module, index) => {
      module.open = openSet.has(index);
    });
    applyFilter();
    requestAnimationFrame(() => {
      const activeHref = hashActiveHref || (typeof state.activeHref === 'string' ? state.activeHref : '');
      const activeLink = activeHref
        ? Array.from(tree.querySelectorAll('[data-page-link]'))
            .find((link) => normalizeHref(link.href) === activeHref)
        : null;
      if (activeLink) {
        const parentModule = activeLink.closest('.module');
        if (parentModule) parentModule.open = true;
        activeLink.classList.add('restored-link');
        activeLink.scrollIntoView({ block: 'center' });
      } else {
        window.scrollTo(0, Number(state.scrollY) || 0);
      }
    });
  } catch (_) {
    sessionStorage.removeItem(stateKey);
  }
}

if (filter && tree) {
  restoreIndexState();
  filter.addEventListener('input', () => {
    applyFilter();
    saveIndexState();
  });
  tree.addEventListener('toggle', () => {
    saveIndexState();
  }, true);
  tree.addEventListener('click', (event) => {
    const link = event.target.closest('[data-page-link]');
    if (link) saveIndexState(link.getAttribute('href') || link.href);
  });
  window.addEventListener('pagehide', () => saveIndexState());
}

for (const link of document.querySelectorAll('[data-back-link]')) {
  link.addEventListener('click', () => {
    const current = normalizeHref(window.location.href);
    link.href = '../index.html#' + encodeURIComponent(current);
  });
}
