// Cliente - lógica do form de revisão
// Depende de window.REVISAO_CONFIG = { apiUrl, token } definido em js/revisao-config.js

(function () {
  const cfg = window.REVISAO_CONFIG;
  if (!cfg || !cfg.apiUrl || !cfg.token) {
    document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif;color:#fff;background:#0a0a0a;min-height:100vh;text-align:center"><h1>Configuração ausente</h1><p>Esta página não foi configurada corretamente. Contate o suporte da Moreira DS.</p></div>';
    return;
  }

  const $ = (s) => document.querySelector(s);
  const api = (path, opts = {}) => {
    const url = cfg.apiUrl + path + (path.includes('?') ? '&' : '?') + 'token=' + cfg.token;
    return fetch(url, opts).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'erro de rede');
      return j;
    });
  };

  const state = {
    cliente: null,
    draft: null,
    comentarios: [],
    imagensByComment: {},
    novoTipo: null,
  };

  // ===========================================================
  // CARGA INICIAL
  // ===========================================================
  async function load() {
    try {
      const data = await api('/api/cliente');
      state.cliente = data.cliente;
      state.draft = data.draft;
      state.revisoes = data.revisoes || [];
      // separa comentários: do draft atual (novos) vs já enviados (histórico)
      state.comentarios = data.comentarios.filter((c) => c.revisao_id === state.draft.id);
      state.historico = data.comentarios.filter((c) => c.revisao_id !== state.draft.id);
      state.imagensByComment = {};
      data.imagens.forEach((img) => {
        (state.imagensByComment[img.comentario_id] = state.imagensByComment[img.comentario_id] || []).push(img);
      });
      renderTudo();
      // carrega LP no iframe
      $('#lp-iframe').src = state.cliente.lp_url;
      // popula select de seções
      const sel = $('#f-secao');
      sel.innerHTML = state.cliente.secoes
        .map((s) => `<option value="${s}">${s}</option>`)
        .join('');
      // padrão: celular (70%+ dos visitantes da LP serão mobile)
      setView('mobile');
    } catch (e) {
      document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#fff;background:#0a0a0a;min-height:100vh;text-align:center"><h1>Acesso inválido</h1><p>${e.message}</p></div>`;
    }
  }

  // ===========================================================
  // RENDER
  // ===========================================================
  function renderTudo() {
    $('#hdr-cliente-nome').textContent = state.cliente.nome;
    $('#draft-info').textContent = `Rascunho aberto desde ${formatDate(state.draft.created_at)}`;
    $('#panel-toggle-count').textContent = state.comentarios.length;
    $('#enviar-count').textContent = state.comentarios.length;

    // Toolbar: atualiza botão Aprovar conforme estado
    if (window._atualizaBotaoAprovar) window._atualizaBotaoAprovar();
    // Esconde botão histórico se não tem nada enviado ainda
    const temHistorico = (state.revisoes || []).some(r => r.status === 'sent');
    const btnHist = document.getElementById('btn-historico');
    if (btnHist) btnHist.disabled = !temHistorico;

    const enviarBtn = $('#btn-enviar');
    enviarBtn.disabled = state.comentarios.length === 0;
    enviarBtn.textContent = state.comentarios.length === 0
      ? 'Enviar revisão'
      : `Enviar revisão (${state.comentarios.length})`;

    const lista = $('#lista-coments');

    // ===== HISTÓRICO de revisões enviadas (com respostas do admin) =====
    let historicoHtml = '';
    const revsEnviadas = state.revisoes.filter((r) => r.status === 'sent').sort((a, b) => a.id - b.id);
    if (revsEnviadas.length > 0) {
      historicoHtml = `<div class="text-[11px] uppercase tracking-wider text-[#A8E61C] font-bold mb-2 mt-1">📜 O que já foi enviado e respondido</div>`;
      revsEnviadas.forEach((rev, idx) => {
        const cs = state.historico.filter((c) => c.revisao_id === rev.id);
        if (cs.length === 0) return;
        historicoHtml += `
          <details class="bg-[#0f0f0f] border border-[#2a2a2a] rounded-md mb-2" ${idx === revsEnviadas.length - 1 ? 'open' : ''}>
            <summary class="cursor-pointer p-3 text-xs text-[#a3a3a3] hover:text-white">
              Revisão #${idx + 1} · ${cs.length} item(s) · enviada em ${formatDate(rev.data_envio || rev.created_at)}
            </summary>
            <div class="p-3 pt-0 space-y-2">
              ${cs.map((c) => {
                const respondido = c.resposta_admin && c.resposta_admin.trim();
                return `
                  <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-2.5">
                    <div class="flex items-center gap-1.5 flex-wrap mb-1">
                      <span class="badge badge-${c.tipo}">${c.tipo}</span>
                      <span class="text-[11px] text-[#a3a3a3]">${escapeHtml(c.secao)}</span>
                      ${c.status === 'feito' ? '<span class="badge badge-cta">✓ feito</span>' : c.status === 'andamento' ? '<span class="badge badge-copy">em andamento</span>' : '<span class="badge badge-outro">pendente</span>'}
                    </div>
                    <p class="text-xs text-white/80 leading-snug mb-2">${escapeHtml(c.descricao)}</p>
                    ${respondido ? `
                      <div class="mt-2 pt-2 border-t border-[#2a2a2a] bg-[#A8E61C]/5 -m-2.5 mt-2 p-2.5 rounded-b">
                        <div class="text-[10px] uppercase tracking-wider text-[#A8E61C] font-bold mb-1">💬 Resposta da Moreira DS</div>
                        <p class="text-xs text-white/90 leading-snug">${escapeHtml(c.resposta_admin)}</p>
                      </div>` : `
                      <div class="text-[10px] text-[#525252] italic">Aguardando resposta da equipe</div>`}
                  </div>
                `;
              }).join('')}
            </div>
          </details>
        `;
      });
      historicoHtml += `<div class="text-[11px] uppercase tracking-wider text-[#A8E61C] font-bold mb-2 mt-4">✏️ Novo feedback</div>`;
    }

    if (state.comentarios.length === 0) {
      lista.innerHTML = historicoHtml + '<div class="text-xs text-center text-[#525252] py-4">Nenhum comentário novo ainda.<br/>Clique em "+ Novo comentário" para começar.</div>';
      return;
    }

    lista.innerHTML = historicoHtml + state.comentarios
      .map((c) => {
        const imgs = state.imagensByComment[c.id] || [];
        const thumbs = imgs
          .map((img) => `<img src="${cfg.apiUrl}/api/img/${encodeURIComponent(img.storage_path)}" class="img-thumb" alt="ref" />`)
          .join('');
        return `
          <div class="comment-card p-3" data-id="${c.id}">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="badge badge-${c.tipo}">${c.tipo}</span>
                <span class="text-xs text-[#a3a3a3] font-medium">${escapeHtml(c.secao)}</span>
              </div>
              <button class="del-btn text-[#525252] hover:text-red-400 p-1" data-id="${c.id}" title="Remover">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
            <p class="text-sm text-white/90 leading-relaxed mb-2">${escapeHtml(c.descricao)}</p>
            ${thumbs ? `<div class="flex gap-1.5 flex-wrap mb-2">${thumbs}</div>` : ''}
            <div class="flex items-center gap-2 pt-1">
              <label class="upload-label text-xs text-[#737373] hover:text-[#A8E61C] cursor-pointer flex items-center gap-1" data-id="${c.id}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>
                + imagem
                <input type="file" accept="image/*" class="hidden" />
              </label>
            </div>
          </div>
        `;
      })
      .join('');

    // bind delete
    lista.querySelectorAll('.del-btn').forEach((b) => {
      b.onclick = async () => {
        if (!confirm('Remover este comentário?')) return;
        const id = b.dataset.id;
        try {
          await api(`/api/cliente/comentarios/${id}`, { method: 'DELETE' });
          await load();
        } catch (e) { alert('Erro: ' + e.message); }
      };
    });
    // bind upload
    lista.querySelectorAll('.upload-label input').forEach((inp) => {
      inp.onchange = async () => {
        const file = inp.files[0];
        if (!file) return;
        const id = inp.parentElement.dataset.id;
        const fd = new FormData();
        fd.append('file', file);
        try {
          const url = cfg.apiUrl + `/api/cliente/comentarios/${id}/imagens?token=${cfg.token}`;
          const r = await fetch(url, { method: 'POST', body: fd });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || 'erro upload');
          await load();
        } catch (e) { alert('Erro no upload: ' + e.message); }
      };
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function formatDate(s) {
    if (!s) return '';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ===========================================================
  // VIEWPORT TOGGLE
  // ===========================================================
  $('#btn-desktop').onclick = () => setView('desktop');
  $('#btn-mobile').onclick = () => setView('mobile');
  function setView(v) {
    $('#iframe-shell').classList.remove('mobile', 'desktop');
    $('#iframe-shell').classList.add(v);
    $('#btn-desktop').classList.toggle('active', v === 'desktop');
    $('#btn-desktop').classList.toggle('text-[#a3a3a3]', v !== 'desktop');
    $('#btn-mobile').classList.toggle('active', v === 'mobile');
    $('#btn-mobile').classList.toggle('text-[#a3a3a3]', v !== 'mobile');
  }

  // ===========================================================
  // PAINEL TOGGLE (mobile)
  // ===========================================================
  $('#panel-toggle-btn').onclick = () => $('#panel').classList.add('open');
  $('#panel-close-btn').onclick = () => $('#panel').classList.remove('open');

  // ===========================================================
  // TOOLBAR — 3 botões de ação principais
  // ===========================================================
  const btnHistorico = document.getElementById('btn-historico');
  const btnNovoFb = document.getElementById('btn-novo-feedback');
  const btnAprovar = document.getElementById('btn-aprovar');

  if (btnHistorico) btnHistorico.onclick = () => {
    $('#panel').classList.add('open');
    // scroll pro bloco de histórico
    setTimeout(() => {
      const lista = $('#lista-coments');
      if (lista) lista.scrollTop = 0;
      // abre o primeiro details (revisão mais recente)
      const det = lista?.querySelector('details');
      if (det) det.open = true;
    }, 200);
  };

  if (btnNovoFb) btnNovoFb.onclick = () => {
    $('#panel').classList.add('open');
    // abre direto o modal de novo comentário
    setTimeout(() => {
      const btn = document.getElementById('btn-novo-coment');
      if (btn) btn.click();
    }, 250);
  };

  if (btnAprovar) btnAprovar.onclick = async () => {
    if (state.cliente?.aprovado_em) {
      alert(`✓ Você já aprovou esta entrega em ${formatDate(state.cliente.aprovado_em)}. Se precisar de mais ajustes, use "Mandar novo feedback".`);
      return;
    }
    const ok = confirm(
      'Aprovar a entrega significa que você está satisfeito com a versão atual da landing page.\n\n' +
      'Você ainda pode mandar mais feedback depois, mas a aprovação marca esse momento como entrega validada.\n\n' +
      'Confirmar aprovação?'
    );
    if (!ok) return;
    btnAprovar.disabled = true;
    btnAprovar.querySelector('span').textContent = 'Aprovando...';
    try {
      const data = await api('/api/cliente/aprovar', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      state.cliente.aprovado_em = data.aprovado_em;
      atualizaBotaoAprovar();
      // Tela de sucesso reusada
      $('#tela-sucesso').classList.remove('hidden');
      $('#tela-sucesso').classList.add('flex');
      $('#tela-sucesso h2').textContent = '✓ Entrega aprovada!';
      $('#tela-sucesso p').textContent = 'Obrigado pela confiança. Seguimos com a manutenção da página e qualquer ajuste futuro é só mandar pelo botão "Mandar novo feedback".';
    } catch (e) {
      alert('Erro ao aprovar: ' + e.message);
      btnAprovar.disabled = false;
      atualizaBotaoAprovar();
    }
  };

  function atualizaBotaoAprovar() {
    if (!btnAprovar) return;
    const span = btnAprovar.querySelector('span');
    if (state.cliente?.aprovado_em) {
      btnAprovar.classList.add('action-btn-aprovado');
      btnAprovar.disabled = false; // permite clicar pra ver msg
      span.textContent = `✓ Aprovado em ${formatDate(state.cliente.aprovado_em).split(',')[0]}`;
    } else {
      btnAprovar.classList.remove('action-btn-aprovado');
      btnAprovar.disabled = false;
      span.textContent = 'Aprovar entrega';
    }
  }
  // expor pro renderTudo chamar após load
  window._atualizaBotaoAprovar = atualizaBotaoAprovar;

  // ===========================================================
  // MODAL NOVO COMENTARIO
  // ===========================================================
  $('#btn-novo-coment').onclick = openModal;
  $('#modal-close').onclick = closeModal;
  $('#modal-cancel').onclick = closeModal;
  function openModal() {
    state.novoTipo = null;
    $('#f-descricao').value = '';
    document.querySelectorAll('.tipo-btn').forEach((b) => b.classList.remove('active', 'border-[#A8E61C]', 'text-[#A8E61C]'));
    updateSaveBtn();
    $('#modal-coment').classList.remove('hidden');
    $('#modal-coment').classList.add('flex');
  }
  function closeModal() {
    $('#modal-coment').classList.add('hidden');
    $('#modal-coment').classList.remove('flex');
  }
  document.querySelectorAll('.tipo-btn').forEach((b) => {
    b.onclick = () => {
      state.novoTipo = b.dataset.tipo;
      document.querySelectorAll('.tipo-btn').forEach((x) => x.classList.remove('border-[#A8E61C]', 'text-[#A8E61C]'));
      b.classList.add('border-[#A8E61C]', 'text-[#A8E61C]');
      updateSaveBtn();
    };
  });
  $('#f-descricao').oninput = updateSaveBtn;
  function updateSaveBtn() {
    $('#modal-save').disabled = !state.novoTipo || !$('#f-descricao').value.trim();
  }
  $('#modal-save').onclick = async () => {
    const body = {
      secao: $('#f-secao').value,
      tipo: state.novoTipo,
      descricao: $('#f-descricao').value.trim(),
    };
    try {
      await api('/api/cliente/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      closeModal();
      await load();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  // ===========================================================
  // ENVIAR REVISAO
  // ===========================================================
  $('#btn-enviar').onclick = () => {
    $('#modal-enviar').classList.remove('hidden');
    $('#modal-enviar').classList.add('flex');
  };
  $('#enviar-cancel').onclick = () => {
    $('#modal-enviar').classList.add('hidden');
    $('#modal-enviar').classList.remove('flex');
  };
  $('#enviar-confirm').onclick = async () => {
    try {
      await api('/api/cliente/enviar', { method: 'POST' });
      $('#modal-enviar').classList.add('hidden');
      $('#tela-sucesso').classList.remove('hidden');
      $('#tela-sucesso').classList.add('flex');
    } catch (e) { alert('Erro: ' + e.message); }
  };

  load();
})();
