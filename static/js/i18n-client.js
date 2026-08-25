/**
 * EUCMD Young Adults - Multilingual Client Engine
 * Persistent cross-page language synchronization, automatic link preservation, and instant switching.
 */
(function() {
  const SUPPORTED = ['en', 'am', 'ti', 'om'];

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, val, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  // Get active language priority: URL query param -> localStorage -> cookie -> html lang -> 'en'
  function getActiveLang() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang && SUPPORTED.includes(urlLang.toLowerCase())) {
        return urlLang.toLowerCase();
      }
    } catch(e) {}

    try {
      const localLang = localStorage.getItem('euc_lang');
      if (localLang && SUPPORTED.includes(localLang.toLowerCase())) {
        return localLang.toLowerCase();
      }
    } catch(e) {}

    const cookieLang = getCookie('lang');
    if (cookieLang && SUPPORTED.includes(cookieLang.toLowerCase())) {
      return cookieLang.toLowerCase();
    }

    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang && SUPPORTED.includes(htmlLang.toLowerCase())) {
      return htmlLang.toLowerCase();
    }

    return 'en';
  }

  // Immediate language check & auto-sync before DOM finishes rendering
  const activeLang = getActiveLang();
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    let storedLang = null;
    try {
      storedLang = localStorage.getItem('euc_lang');
    } catch(e) {}

    if (urlLang && SUPPORTED.includes(urlLang.toLowerCase())) {
      // URL has explicit language, sync localStorage & cookie
      try {
        localStorage.setItem('euc_lang', urlLang.toLowerCase());
      } catch(e) {}
      setCookie('lang', urlLang.toLowerCase(), 365);
    } else if (storedLang && SUPPORTED.includes(storedLang.toLowerCase())) {
      // Check if we already redirected in this session to prevent reload loops
      const redirectKey = 'euc_redirected_' + storedLang.toLowerCase();
      let hasRedirected = false;
      try {
        hasRedirected = sessionStorage.getItem(redirectKey) === 'true';
      } catch(e) {}

      const currentDocLang = document.documentElement.getAttribute('lang') || 'en';
      if (!hasRedirected && storedLang.toLowerCase() !== currentDocLang.toLowerCase()) {
        try {
          sessionStorage.setItem(redirectKey, 'true');
        } catch(e) {}
        const u = new URL(window.location.href);
        u.searchParams.set('lang', storedLang.toLowerCase());
        window.location.replace(u.toString());
      }
    }
  } catch(e) {
    console.warn('Language auto-sync note:', e);
  }

  // Apply script typography classes
  function applyFontClasses(lang) {
    if (lang === 'am' || lang === 'ti') {
      document.documentElement.classList.add('font-ethiopic');
      if (document.body) document.body.classList.add('font-ethiopic');
    } else {
      document.documentElement.classList.remove('font-ethiopic');
      if (document.body) document.body.classList.remove('font-ethiopic');
    }
  }

  applyFontClasses(activeLang);

  // Helper to preserve language parameter on any internal URL
  function preserveUrlLang(rawHref, lang) {
    if (!rawHref || typeof rawHref !== 'string') return rawHref;
    const trimmed = rawHref.trim();
    if (
      trimmed === '' ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('/static/') ||
      trimmed.startsWith('/set-language/') ||
      trimmed.startsWith('/api/')
    ) {
      return rawHref;
    }

    try {
      const isAbsoluteUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
      const targetUrl = new URL(trimmed, window.location.origin);

      // Only modify links for the same origin
      if (targetUrl.origin !== window.location.origin) {
        return rawHref;
      }

      // If user selected non-default language, ensure it's in searchParams
      if (lang && lang !== 'en') {
        if (!targetUrl.searchParams.has('lang')) {
          targetUrl.searchParams.set('lang', lang);
          return isAbsoluteUrl ? targetUrl.toString() : (targetUrl.pathname + targetUrl.search + targetUrl.hash);
        }
      }
      return isAbsoluteUrl ? targetUrl.toString() : (targetUrl.pathname + targetUrl.search + targetUrl.hash);
    } catch (e) {
      return rawHref;
    }
  }

  // Rewrite all internal links on page so right-click, middle-click, and hover are persistent
  function updateAllLinks(lang) {
    if (!lang) return;
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const updated = preserveUrlLang(href, lang);
      if (updated && updated !== href) {
        link.setAttribute('href', updated);
      }
    });
  }

  window.setLanguage = async function(langCode, reload = true) {
    if (!SUPPORTED.includes(langCode)) return;

    // 1. Save to localStorage and cookie
    try {
      localStorage.setItem('euc_lang', langCode);
    } catch(e) {}
    setCookie('lang', langCode, 365);

    // 2. Set HTML attributes and font
    document.documentElement.setAttribute('lang', langCode);
    applyFontClasses(langCode);

    // 3. Inform server in background
    try {
      fetch('/api/set-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: langCode })
      }).catch(() => {});
    } catch(e) {}

    // 4. Update URL and reload current page
    if (reload) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', langCode);
      window.location.href = url.toString();
    } else {
      updateAllLinks(langCode);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const currentLang = getActiveLang();
    applyFontClasses(currentLang);
    updateAllLinks(currentLang);

    // Watch for dynamic DOM additions and keep links localized
    if (window.MutationObserver) {
      const observer = new MutationObserver(() => {
        updateAllLinks(getActiveLang());
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Intercept clicks on links globally
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Intercept /set-language/:lang
      if (href.startsWith('/set-language/')) {
        e.preventDefault();
        const targetLang = href.split('/set-language/')[1]?.split('?')[0]?.toLowerCase();
        if (targetLang && SUPPORTED.includes(targetLang)) {
          window.setLanguage(targetLang, true);
        }
        return;
      }

      // Check if internal navigation link needs language query param
      const curLang = getActiveLang();
      if (curLang && curLang !== 'en') {
        const updated = preserveUrlLang(href, curLang);
        if (updated && updated !== href) {
          link.setAttribute('href', updated);
        }
      }
    }, true);
  });
})();
