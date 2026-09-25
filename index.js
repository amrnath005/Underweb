// index.js
// Portal switching and theme coordination for Underweb dev/preview portal.

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('uw-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const frameWrap = document.getElementById('frameWrap');
  const btnDash = document.getElementById('btnViewDashboard');
  const btnPop = document.getElementById('btnViewPopup');
  const themeBtn = document.getElementById('portalThemeToggle');

  let currentView = 'dashboard';

  function loadView(view) {
    currentView = view;
    if (view === 'dashboard') {
      btnDash.classList.add('active');
      btnPop.classList.remove('active');
      frameWrap.innerHTML = '<iframe id="mainFrame" src="src/ui/dashboard/dashboard.html"></iframe>';
    } else {
      btnPop.classList.add('active');
      btnDash.classList.remove('active');
      frameWrap.innerHTML = '<div class="popup-wrapper-box"><div class="popup-preview-box"><iframe id="mainFrame" src="src/ui/popup/popup.html"></iframe></div></div>';
    }
  }

  if (btnDash) btnDash.addEventListener('click', () => loadView('dashboard'));
  if (btnPop) btnPop.addEventListener('click', () => loadView('popup'));

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('uw-theme', next);

      // Notify iframe
      const ifr = document.getElementById('mainFrame');
      if (ifr && ifr.contentDocument) {
        ifr.contentDocument.documentElement.setAttribute('data-theme', next);
      }
    });
  }
});
