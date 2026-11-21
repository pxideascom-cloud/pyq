(function () {
  'use strict';

  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-toggle');
  var storedTheme = null;
  try { storedTheme = localStorage.getItem('pyq-theme'); } catch (error) { /* local files may deny storage */ }
  if (storedTheme === 'light' || storedTheme === 'dark') {
    root.dataset.theme = storedTheme;
  }

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var darkByDefault = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = root.dataset.theme ? root.dataset.theme === 'dark' : darkByDefault;
      root.dataset.theme = isDark ? 'light' : 'dark';
      try { localStorage.setItem('pyq-theme', root.dataset.theme); } catch (error) { /* keep the in-page setting */ }
    });
  }

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      var step = event.key === 'ArrowRight' ? 1 : -1;
      var target = tabs[(index + step + tabs.length) % tabs.length];
      selectTab(target);
      target.focus();
    });
  });

  function selectTab(selected) {
    tabs.forEach(function (tab) {
      var active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
  }

  tabs.forEach(function (tab) {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  });
}());