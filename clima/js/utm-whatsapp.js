// === utm-whatsapp.js ===
// Prefixa todos os links WhatsApp com "Vim do {source}" baseado em utm_source da URL.
// Padrão MDS — aplicar em todas as LPs.

(function() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');

  if (!source) return;

  const sourceMap = {
    google: 'Google',
    facebook: 'Facebook',
    instagram: 'Instagram',
    meta: 'Meta Ads',
    organico: 'busca orgânica',
    bio: 'bio do Instagram'
  };
  const sourceLabel = sourceMap[source.toLowerCase()] || source;

  // Encontra todos os links WhatsApp com data-evento="wpp"
  const links = document.querySelectorAll('a[href*="wa.me"][data-evento="wpp"]');

  links.forEach(link => {
    try {
      const url = new URL(link.href);
      const text = url.searchParams.get('text') || '';

      // Adiciona prefixo "Vim do {source}" no início da mensagem
      const prefix = `Vim do ${sourceLabel}. `;
      const newText = prefix + text;

      url.searchParams.set('text', newText);
      link.href = url.toString();
    } catch (e) {
      // Silencioso — não quebra a LP se o link já tiver formato inesperado
    }
  });
})();
