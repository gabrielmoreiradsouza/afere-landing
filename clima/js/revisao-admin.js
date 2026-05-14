// Admin - lista revisões, atualiza status, exporta markdown estruturado pra Claude
(function () {
  const cfg = window.REVISAO_CONFIG;
  if (!cfg || !cfg.apiUrl || !cfg.adminToken) {
    document.body.innerHTML = '<div style="padding:40px;color:#fff;background:#0a0a0a;min-height:100vh;text-align:center;font-family:sans-serif"><h1>Configuração admin ausente</h1></div>';
    return;
  }

  const $ = (s) => document.querySelector(s);
  const api = (path, opts = {}) => {
    const url = cfg.apiUrl + path + (path.includes('?') ? '&' : '?') + 'token=' + cfg.adminToken;
    return fetch(url, opts).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'erro');
      return j;
    });
  };

  const state = { cliente: null, revisoes: [], comentarios: [], imagens: [] };

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function fmtDateOnly(s) {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return d.toLocaleDateString('pt-BR');
  }

  async function load() {
    try {
      const data = await api('/api/admin');
      state.cliente = data.cliente;
      state.revisoes = data.revisoes;
      state.comentarios = data.comentarios;
      state.imagens = data.imagens;
      render();
    } catch (e) {
      document.body.innerHTML = `<div style="padding:40px;color:#fff;background:#0a0a0a;min-height:100vh;text-align:center;font-family:sans-serif"><h1>Acesso inválido</h1><p>${e.message}</p></div>`;
    }
  }

  function render() {
    $('#hdr-cliente').textContent = state.cliente.nome;
    const lpLink = $('#hdr-lp-link');
    lpLink.href = state.cliente.lp_url;
    lpLink.textContent = '— ' + state.cliente.lp_url.replace(/^https?:\/\//, '');

    const cont = $('#lista-revisoes');
    const sent = state.revisoes.filter((r) => r.status === 'sent');
    const draft = state.revisoes.find((r) => r.status === 'draft');

    if (sent.length === 0 && (!draft || comentariosDe(draft.id).length === 0)) {
      $('#empty').classList.remove('hidden');
      cont.innerHTML = '';
      return;
    }
    $('#empty').classList.add('hidden');

    let html = '';

    // Draft em aberto (info)
    if (draft && comentariosDe(draft.id).length > 0) {
      html += `
        <div class="card p-5 border-dashed border-[#A8E61C]/30">
          <div class="flex items-center gap-3 mb-3">
            <span class="badge badge-andamento">Rascunho aberto</span>
            <span class="text-sm text-[#a3a3a3]">${comentariosDe(draft.id).length} comentário(s) sendo escritos pelo cliente</span>
          </div>
          <p class="text-xs text-[#737373]">O cliente ainda não enviou esta revisão. Os dados aparecerão aqui completos depois do envio.</p>
        </div>
      `;
    }

    // Revisões enviadas (mais recente primeiro)
    sent.forEach((rev, idx) => {
      const cs = comentariosDe(rev.id);
      const num = sent.length - idx;
      html += `
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-bold">Revisão #${num}</h2>
                <span class="badge badge-feito">Enviada</span>
              </div>
              <div class="text-xs text-[#737373] mt-1">Enviada em ${fmtDate(rev.data_envio)} · ${cs.length} comentário(s)</div>
            </div>
            <button class="btn text-sm" onclick="window._exportRev(${rev.id}, ${num})">Copiar como markdown</button>
          </div>

          <div class="space-y-3">
            ${cs.map((c) => renderComentario(c)).join('')}
          </div>
        </div>
      `;
    });

    cont.innerHTML = html;

    // bind status selects
    cont.querySelectorAll('.status-sel').forEach((sel) => {
      sel.onchange = async () => {
        const id = sel.dataset.id;
        try {
          await api(`/api/admin/comentarios/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: sel.value }),
          });
          await load();
        } catch (e) { alert('Erro: ' + e.message); }
      };
    });
    // bind lightbox
    cont.querySelectorAll('.img-thumb').forEach((img) => {
      img.onclick = () => {
        $('#lightbox-img').src = img.src;
        $('#lightbox').classList.remove('hidden');
        $('#lightbox').classList.add('flex');
      };
    });
  }

  function comentariosDe(revId) {
    return state.comentarios.filter((c) => c.revisao_id === revId);
  }
  function imagensDe(comId) {
    return state.imagens.filter((i) => i.comentario_id === comId);
  }

  function renderComentario(c) {
    const imgs = imagensDe(c.id);
    const thumbs = imgs
      .map((img) => `<img src="${cfg.apiUrl}/api/img/${encodeURIComponent(img.storage_path)}" class="img-thumb" alt="ref" />`)
      .join('');
    const statusOpts = ['pendente', 'andamento', 'feito']
      .map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`)
      .join('');
    return `
      <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="badge badge-${c.tipo}">${c.tipo}</span>
            <span class="text-sm text-white font-medium">${escapeHtml(c.secao)}</span>
            <span class="badge badge-${c.status}">${c.status}</span>
          </div>
          <select class="status-sel" data-id="${c.id}">${statusOpts}</select>
        </div>
        <p class="text-sm text-white/85 leading-relaxed">${escapeHtml(c.descricao)}</p>
        ${thumbs ? `<div class="flex gap-2 flex-wrap mt-3">${thumbs}</div>` : ''}
      </div>
    `;
  }

  // ===========================================================
  // EXPORT MARKDOWN (formato pronto pra colar com Claude)
  // ===========================================================
  window._exportRev = function (revId, num) {
    const rev = state.revisoes.find((r) => r.id === revId);
    const cs = comentariosDe(revId);
    let md = `# Revisão #${num} — ${state.cliente.nome}\n\n`;
    md += `**Cliente:** ${state.cliente.nome}\n`;
    md += `**LP:** ${state.cliente.lp_url}\n`;
    md += `**Enviada em:** ${fmtDate(rev.data_envio)}\n`;
    md += `**Total de itens:** ${cs.length}\n\n`;
    md += `---\n\n`;

    cs.forEach((c, i) => {
      const imgs = imagensDe(c.id);
      md += `## Item ${i + 1} — ${c.secao}\n\n`;
      md += `- **Tipo:** ${c.tipo}\n`;
      md += `- **Status:** ${c.status}\n`;
      md += `- **Descrição:** ${c.descricao}\n`;
      if (imgs.length) {
        md += `- **Imagens de referência (${imgs.length}):**\n`;
        imgs.forEach((img) => {
          md += `  - ${cfg.apiUrl}/api/img/${encodeURIComponent(img.storage_path)} (${img.filename}, ${(img.size_bytes / 1024).toFixed(0)}KB)\n`;
        });
      }
      md += `\n`;
    });

    md += `---\n\n_Gerado pelo sistema de revisão Moreira DS · ${fmtDateOnly(new Date().toISOString())}_\n`;

    $('#export-content').textContent = md;
    $('#modal-export').classList.remove('hidden');
    $('#modal-export').classList.add('flex');
  };

  $('#export-close').onclick = () => {
    $('#modal-export').classList.add('hidden');
    $('#modal-export').classList.remove('flex');
  };
  $('#btn-copy').onclick = () => {
    navigator.clipboard.writeText($('#export-content').textContent).then(() => {
      const b = $('#btn-copy');
      const orig = b.textContent;
      b.textContent = 'Copiado!';
      setTimeout(() => (b.textContent = orig), 1500);
    });
  };
  $('#lightbox').onclick = () => {
    $('#lightbox').classList.add('hidden');
    $('#lightbox').classList.remove('flex');
  };
  $('#btn-refresh').onclick = load;

  load();
})();
