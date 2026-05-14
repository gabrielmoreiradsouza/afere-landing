// === Tracking helpers Afere (compartilhado LP1+LP2) ===
// Captura UTM/click IDs em sessionStorage + helpers fireLead/fireContact
// Os IDs reais (GA4 measurement_id + Pixel ID + AW Ads) ficam no <head> de cada LP.

(function () {
  // 1. Captura fbclid / gclid / utm_* no primeiro load e guarda
  const params = new URLSearchParams(window.location.search);
  const KEYS = ['fbclid', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) sessionStorage.setItem('afere_' + k, v);
  });

  // 2. uuid v4 simples (pra eventID dedupe GA4+Meta+Ads)
  window.afereUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  // 3. fireContact / fireLead — dispara nos 3 sistemas com mesmo eventID
  function fire(eventName, gaEvent, source) {
    const eventId = window.afereUUID();

    // Google Analytics 4
    if (window.gtag) {
      gtag('event', gaEvent, { source: source, transaction_id: eventId });

      // Google Ads — só dispara se as labels estiverem configuradas
      if (window.AFERE_ADS && window.AFERE_ADS[gaEvent]) {
        gtag('event', 'conversion', { send_to: window.AFERE_ADS[gaEvent], transaction_id: eventId });
      }
    }

    // Meta Pixel
    if (window.fbq) {
      fbq('track', eventName, { content_name: source }, { eventID: eventId });
    }

    // Console feedback (debug)
    console.log(`[afere-tracking] ${eventName} (${gaEvent}) source=${source} eventID=${eventId}`);
  }

  window.fireContact = (source) => fire('Contact', 'contact', source);
  window.fireLead = (source) => fire('Lead', 'generate_lead', source);

  // 4. Auto-attach em todos cliques de WhatsApp (delegated, pega CTAs dinâmicos do Alpine)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="wa.me/"]');
    if (!link) return;
    const fonte = link.dataset.fonte || link.dataset.evento || 'whatsapp';
    window.fireContact(fonte);
  });

  // 5. Scroll depth (50% / 75%) — microconversão GA4 only
  let fired50 = false, fired75 = false;
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
    if (!fired50 && pct >= 50) {
      fired50 = true;
      if (window.gtag) gtag('event', 'scroll_50');
    }
    if (!fired75 && pct >= 75) {
      fired75 = true;
      if (window.gtag) gtag('event', 'scroll_75');
    }
  }, { passive: true });
})();
