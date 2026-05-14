// === AOS init ===
document.addEventListener('DOMContentLoaded', () => {
  if (window.AOS) {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  // Year no footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Counters animados
  const counters = document.querySelectorAll('[data-counter]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.floor(target * eased);
        el.textContent = val + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => io.observe(c));
});

// === Alpine: form de qualificação Afere Climatização ===
function orcamentoForm() {
  return {
    step: 1,
    answers: { tipo: '', demanda: '', nome: '', tel: '', email: '', cidade: '', msg: '', lgpd: false },
    next() {
      if (this.step < 3) this.step++;
    },
    enviar() {
      const a = this.answers;

      if (!a.lgpd) {
        alert('Aceite a Política de Privacidade para continuar.');
        return;
      }

      const tipoTxt = {
        residencia: 'Residência',
        comercio: 'Comércio / loja / escritório',
        restaurante: 'Restaurante / bar / lanchonete',
        clinica: 'Clínica / consultório / hospital',
        industria: 'Indústria / galpão'
      }[a.tipo] || a.tipo;

      const demandaTxt = {
        instalacao: 'Instalação de ar-condicionado novo',
        manutencao_preventiva: 'Plano preventivo (contrato mensal)',
        corretiva: 'Manutenção corretiva (não está gelando)',
        limpeza: 'Limpeza / higienização',
        nao_sei: 'Ainda não sei, quero conversar'
      }[a.demanda] || a.demanda;

      const texto =
        `Olá! Vim pelo site da Afere Climatização e gostaria de receber um orçamento.\n\n` +
        `*Nome:* ${a.nome}\n` +
        `*WhatsApp:* ${a.tel}\n` +
        `*E-mail:* ${a.email}\n` +
        `*Cidade:* ${a.cidade}\n` +
        `*Tipo de ambiente:* ${tipoTxt}\n` +
        `*Serviço desejado:* ${demandaTxt}\n` +
        (a.msg ? `\n*Detalhes:* ${a.msg}` : '');

      const url = 'https://wa.me/5531984130791?text=' + encodeURIComponent(texto);
      window.open(url, '_blank', 'noopener');

      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'lead_qualificado',
          tipo_ambiente: a.tipo,
          tipo_servico: a.demanda
        });
        if (typeof gtag === 'function') {
          gtag('event', 'lead_qualificado', {
            tipo_ambiente: a.tipo,
            tipo_servico: a.demanda
          });
        }
        if (typeof fbq !== 'undefined') fbq('track', 'Lead');
      } catch (e) {}
    }
  };
}
window.orcamentoForm = orcamentoForm;
