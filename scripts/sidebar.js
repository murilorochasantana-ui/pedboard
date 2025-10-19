(function () {
  function applySavedTheme() {
    const saved = localStorage.getItem('pedboard.inverted') === 'true';
    document.body.classList.toggle('inverted', saved);
  }

  function initSidebar() {
    const profileBtn = document.querySelector('.sidebar .profile-btn');
    const searchBar = document.querySelector('.search-bar-inline');

    // alinhamento (se já implementado)
    function alignSearchBar() {
      if (!profileBtn || !searchBar) return;
      searchBar.style.position = 'fixed';
      searchBar.style.left = '50%';
      searchBar.style.transform = 'translateX(-50%)';
      searchBar.style.zIndex = '60';

      const pRect = profileBtn.getBoundingClientRect();
      const sbRect = searchBar.getBoundingClientRect();
      const top = Math.round(pRect.top + (pRect.height / 2) - (sbRect.height / 2));
      searchBar.style.top = `${Math.max(8, top)}px`;
    }

    // controla campo de busca
    if (searchBar) {
      const input = searchBar.querySelector('.search-input');
      const clearBtn = searchBar.querySelector('.search-clear');
      if (input && clearBtn) {
        input.addEventListener('input', () => clearBtn.classList.toggle('hidden', input.value.trim() === ''));
        clearBtn.addEventListener('click', () => { input.value = ''; clearBtn.classList.add('hidden'); input.focus(); });
      }
    }

    // nav: ativa item, aplica inverted apenas ao clicado
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
      el.addEventListener('click', (ev) => {
        // limpa estados anteriores
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => {
          n.classList.remove('active', 'inverted');
        });

        // marca o clicado como ativo + invertido
        el.classList.add('active', 'inverted');

        // Se são <a> e você navega para outra página, a classe será perdida no reload.
        // Se quiser persistir, posso salvar em localStorage e reaplicar na próxima página.
      });
    });

    // alinhamento responsivo
    alignSearchBar();
    window.addEventListener('resize', alignSearchBar);
    window.addEventListener('scroll', alignSearchBar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const profileBtn = document.querySelector('.sidebar .profile-btn');
      const searchBar = document.querySelector('.search-bar-inline');

      function alignSearchBar() {
        if (!profileBtn || !searchBar) return;
        searchBar.style.position = 'fixed';
        searchBar.style.left = '50%';
        searchBar.style.transform = 'translateX(-50%)';
        searchBar.style.zIndex = '60';

        const pRect = profileBtn.getBoundingClientRect();
        const sbRect = searchBar.getBoundingClientRect();
        const top = Math.round(pRect.top + (pRect.height / 2) - (sbRect.height / 2));
        searchBar.style.top = `${Math.max(8, top)}px`;
      }

      // inicial e ao redimensionar/rolar
      alignSearchBar();
      window.addEventListener('resize', alignSearchBar);
      window.addEventListener('scroll', alignSearchBar);

      // controla o botão X e ativação de nav
      const input = document.querySelector('.search-input');
      const clearBtn = document.querySelector('.search-clear');

      if (input && clearBtn) {
        input.addEventListener('input', () => {
          clearBtn.classList.toggle('hidden', input.value.trim() === '');
        });
        clearBtn.addEventListener('click', () => {
          input.value = '';
          clearBtn.classList.add('hidden');
          input.focus();
        });
      }

      document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
          el.classList.add('active');
        });
      });
    });
  } else {
    applySavedTheme();
    initSidebar();
  }
})();

(function () {
  function insertInvertName(src) {
    if (!src) return '';
    const q = src.indexOf('?');
    const base = q === -1 ? src : src.slice(0, q);
    const qs = q === -1 ? '' : src.slice(q);
    const d = base.lastIndexOf('.');
    return d === -1 ? base + '_invertido' + qs : base.slice(0, d) + '_invertido' + base.slice(d) + qs;
  }

  function waitForImages(container) {
    const imgs = Array.from((container || document).querySelectorAll('img'));
    if (!imgs.length) return Promise.resolve();
    return new Promise(res => {
      let remaining = imgs.length;
      const done = () => { if (--remaining <= 0) res(); };
      imgs.forEach(img => {
        if (img.complete) return done();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    });
  }

  async function initSidebar() {
    document.body.classList.remove('inverted');

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const items = Array.from(sidebar.querySelectorAll('.sidebar-nav .nav-item'));
    if (!items.length) return;

    // preparar dataset (original/inverted/key) e preload invertidos
    items.forEach((item, idx) => {
      const img = item.querySelector('img');
      if (img && !item.dataset.original) item.dataset.original = img.getAttribute('src') || '';
      // prefer data-inverted attr, se não existir calcula
      if (!item.dataset.inverted) {
        item.dataset.inverted = insertInvertName(item.dataset.original || '');
      }
      // preload (silencioso)
      if (item.dataset.inverted) {
        const p = new Image();
        p.src = item.dataset.inverted;
      }
      if (!item.dataset.key) {
        const href = item.getAttribute('href') || '';
        item.dataset.key = item.getAttribute('data-key') || (href.split('/').pop().split('.').shift()) || String(idx);
      }
      item.style.background = item.style.background || '';
      if (img) img.style.filter = 'none';
    });

    await waitForImages(sidebar);

    function resetAll() {
      items.forEach(i => {
        const img = i.querySelector('img');
        i.classList.remove('active');
        i.style.background = '';
        if (img && i.dataset.original) img.src = i.dataset.original;
        if (img) img.style.filter = 'none';
      });
    }

    function applyActiveByKey(key) {
      resetAll();
      const target = items.find(x => x.dataset.key === key) || items[0];
      if (!target) return;
      const tImg = target.querySelector('img');
      target.classList.add('active');
      target.style.background = '#000';
      // usa data-inverted se fornecido, senão usa fallback já gerado
      const inverted = target.getAttribute('data-inverted') || target.dataset.inverted;
      if (tImg && inverted) {
        tImg.src = inverted;
      }
    }

    const saved = localStorage.getItem('pedboard.activeKey');
    const pathname = (window.location.pathname.split('/').pop() || '').split('.').shift();
    const matchHrefItem = items.find(i => {
      const href = (i.getAttribute('href') || '').split('/').pop().split('.').shift();
      return href && href === pathname;
    });
    const existingActive = items.find(i => i.classList.contains('active'));
    const defaultKey = saved || (matchHrefItem && matchHrefItem.dataset.key) || (existingActive && existingActive.dataset.key) || items[0].dataset.key;

    applyActiveByKey(defaultKey);

    items.forEach(i => {
      i.addEventListener('click', () => {
        const key = i.dataset.key;
        applyActiveByKey(key);
        try { localStorage.setItem('pedboard.activeKey', key); } catch (_) {}
      });
    });

    // alinhar search-bar
    const profileBtn = sidebar.querySelector('.profile-btn');
    const searchBar = document.querySelector('.search-bar-inline');
    if (searchBar) {
      function alignSearchBar() {
        if (!profileBtn) { searchBar.style.top = '16px'; return; }
        const pRect = profileBtn.getBoundingClientRect();
        const sbRect = searchBar.getBoundingClientRect();
        const top = Math.round(pRect.top + (pRect.height / 2) - (sbRect.height / 2));
        searchBar.style.position = 'fixed';
        searchBar.style.left = '50%';
        searchBar.style.transform = 'translateX(-50%)';
        searchBar.style.top = `${Math.max(8, top)}px`;
        searchBar.style.zIndex = '60';
      }
      alignSearchBar();
      window.addEventListener('resize', alignSearchBar);
      window.addEventListener('scroll', alignSearchBar);

      const input = searchBar.querySelector('.search-input');
      const clearBtn = searchBar.querySelector('.search-clear');
      if (input && clearBtn) {
        input.addEventListener('input', () => clearBtn.classList.toggle('hidden', input.value.trim() === ''));
        clearBtn.addEventListener('click', () => { input.value = ''; clearBtn.classList.add('hidden'); input.focus(); });
      }
    }
  }

  // expõe init para loader ou init automático
  window.PedboardInitSidebar = initSidebar;
  if (!window.__PedboardLoaderWillInit) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
      setTimeout(initSidebar, 20);
    }
  }
})();