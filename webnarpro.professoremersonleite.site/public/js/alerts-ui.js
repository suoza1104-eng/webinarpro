/* =========================================================================
   Sininho de alertas do sistema (canto inferior direito) - so administradores.
   Fase 3 do PLANO_OTIMIZACAO_ESCALA.md. Le /api/admin/system/* (ver server/src/routes/system.js).
   ========================================================================= */
const SysAlerts = {
  tab: 'agora',
  status: null,
  serie: [],
  histFiltro: '',
  NIVEL_COR: { verde: 'var(--green)', amarelo: 'var(--yellow)', vermelho: 'var(--red)' },
  NIVEL_EMOJI: { verde: '🟢', amarelo: '🟡', vermelho: '🔴' },
  CHAT_MODO: { normal: 'Chat normal', economico: 'Chat em modo econômico', retido: 'Chat segurado' },
  SPARK_METRICAS: ['alunos_ao_vivo', 'apache_conexoes_443', 'latencia_publica_ms', 'node_api_p95_ms'],

  start(){
    if(this._started) return;
    this._started = true;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button class="sys-bell" id="sysBell" title="Alertas do sistema" onclick="SysAlerts.toggle(event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 15v-5a6 6 0 10-12 0v5l-1.5 2.5h15L18 15z"/><path d="M9.5 20a2.5 2.5 0 005 0"/></svg>
        <span class="sys-bell-count" id="sysBellCount" style="display:none;"></span>
      </button>
      <div class="sys-panel" id="sysPanel" onclick="event.stopPropagation()">
        <div class="sys-head" id="sysHead"></div>
        <div class="sys-tabs">
          <button data-tab="agora" onclick="SysAlerts.setTab('agora')">Agora</button>
          <button data-tab="ativos" onclick="SysAlerts.setTab('ativos')">Alertas ativos</button>
          <button data-tab="historico" onclick="SysAlerts.setTab('historico')">Histórico</button>
          <button data-tab="config" onclick="SysAlerts.setTab('config')">Configurar</button>
        </div>
        <div class="sys-body" id="sysBody"><div class="empty-state">Carregando…</div></div>
      </div>`;
    document.body.appendChild(wrap);
    document.addEventListener('click', ()=>document.getElementById('sysPanel').classList.remove('open'));
    this.refresh();
    this._timer = setInterval(()=>{ if(!document.hidden) this.refresh(); }, 30000);
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) this.refresh(); });
  },

  isOpen(){ return document.getElementById('sysPanel').classList.contains('open'); },
  toggle(e){
    e.stopPropagation();
    const panel = document.getElementById('sysPanel');
    panel.classList.toggle('open');
    if(panel.classList.contains('open')) this.render();
  },
  setTab(t){ this.tab = t; this.render(); },

  async refresh(){
    try{
      this.status = await App.apiFetch('/api/admin/system/status');
      this.renderBell();
      if(this.isOpen() && (this.tab === 'agora' || this.tab === 'ativos')) this.render();
    }catch(e){}
  },

  renderBell(){
    const s = this.status;
    if(!s) return;
    const bell = document.getElementById('sysBell');
    bell.classList.remove('nivel-verde', 'nivel-amarelo', 'nivel-vermelho');
    bell.classList.add('nivel-' + s.estado);
    const ativos = s.alertas.filter(a=>!a.silenciado && !a.reconhecido_em).length;
    const count = document.getElementById('sysBellCount');
    count.textContent = ativos;
    count.style.display = ativos > 0 ? '' : 'none';
    bell.title = `Sistema: ${s.estado} · ${this.CHAT_MODO[s.chatMode] || ''}`;
  },

  fmt(v, unidade){
    if(v === null || v === undefined) return '—';
    const n = Number(v);
    const txt = Number.isInteger(n) ? n.toLocaleString('pt-BR') : n.toLocaleString('pt-BR', {maximumFractionDigits: 1});
    return txt + (unidade ? (unidade.startsWith('/') ? unidade : ' ' + unidade) : '');
  },

  renderHead(){
    const s = this.status;
    document.getElementById('sysHead').innerHTML = s ? `
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="sys-dot" style="background:${this.NIVEL_COR[s.estado]};"></span>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:13.5px;">Sistema ${s.estado === 'verde' ? 'normal' : s.estado === 'amarelo' ? 'em atenção' : 'em alerta'}</div>
          <div style="font-size:11px;color:var(--text-faint);">${this.CHAT_MODO[s.chatMode] || ''} · atualizado ${new Date(s.atualizadoEm).toLocaleTimeString('pt-BR')}</div>
        </div>
        <label class="sys-hold" title="Segurar o chat de todos os webinars integrados ao Sino">
          <span>Segurar chat</span>
          <label class="toggle"><input type="checkbox" ${s.segurarChatGlobal ? 'checked' : ''} onchange="SysAlerts.setSegurarChat(this.checked)"><span class="track"><span class="thumb"></span></span></label>
        </label>
      </div>` : '';
    document.querySelectorAll('.sys-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.tab === this.tab));
  },

  async render(){
    this.renderHead();
    const body = document.getElementById('sysBody');
    if(this.tab === 'agora') return this.renderAgora(body);
    if(this.tab === 'ativos') return this.renderAtivos(body);
    if(this.tab === 'historico') return this.renderHistorico(body);
    return this.renderConfig(body);
  },

  sparkline(metrica){
    const pts = this.serie.map(p=>p.valores?.[metrica]).filter(v=>v !== null && v !== undefined);
    if(pts.length < 2) return '';
    const max = Math.max(...pts, 1);
    const w = 120, h = 26;
    const path = pts.map((v,i)=>`${(i/(pts.length-1))*w},${h - (v/max)*h}`).join(' ');
    return `<svg class="sys-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${path}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
  },

  async renderAgora(body){
    const s = this.status;
    if(!s){ body.innerHTML = '<div class="empty-state">Carregando…</div>'; return; }
    if(!this._serieAt || Date.now() - this._serieAt > 60000){
      try{ this.serie = await App.apiFetch('/api/admin/system/metrics?minutos=60'); this._serieAt = Date.now(); }catch(e){}
    }
    const grupos = {};
    s.metricas.filter(m=>m.habilitado).forEach(m=>{ (grupos[m.grupo] ||= []).push(m); });
    body.innerHTML = Object.entries(grupos).map(([g, ms])=>`
      <div class="sys-group">${g}</div>
      ${ms.map(m=>{
        const ref = m.vermelho ?? m.amarelo;
        const pct = (m.valor !== null && ref) ? Math.max(3, Math.min(100, (m.direcao === 'abaixo' ? (ref / Math.max(m.valor, 0.0001)) : (m.valor / ref)) * 100)) : 0;
        const spark = this.SPARK_METRICAS.includes(m.metrica) ? this.sparkline(m.metrica) : '';
        return `<div class="sys-metric">
          <div class="sys-metric-top"><span>${m.label}</span><b style="color:${this.NIVEL_COR[m.nivel]};">${this.fmt(m.valor, m.unidade)}</b></div>
          <div class="sys-bar"><span style="width:${pct}%;background:${this.NIVEL_COR[m.nivel]};"></span></div>
          <div class="sys-metric-limits">🟡 ${m.direcao === 'abaixo' ? '<' : '>'} ${this.fmt(m.amarelo, m.unidade)} · 🔴 ${m.direcao === 'abaixo' ? '<' : '>'} ${this.fmt(m.vermelho, m.unidade)}${spark ? `<span style="color:${this.NIVEL_COR[m.nivel]};">${spark}</span>` : ''}</div>
        </div>`;
      }).join('')}`).join('')
      + (s.detalhes?.topRotas?.length ? `<div class="sys-group">Rotas mais chamadas (último minuto)</div>
        ${s.detalhes.topRotas.map(r=>`<div class="sys-route"><span>${escapeHtmlAdmin(r.rota)}</span><b>${r.req} req · p95 ${r.p95} ms</b></div>`).join('')}` : '');
  },

  renderAtivos(body){
    const alertas = this.status?.alertas || [];
    if(alertas.length === 0){ body.innerHTML = '<div class="empty-state">🟢 Nenhum alerta ativo. Tudo dentro dos limites.</div>'; return; }
    body.innerHTML = alertas.map(a=>`
      <div class="sys-alert ${a.nivel}">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <span>${this.NIVEL_EMOJI[a.nivel]}</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:12.5px;">${a.label}</div>
            <div style="font-size:11.5px;color:var(--text-dim);">${this.fmt(a.valor, a.unidade)} (limite ${this.fmt(a.limite, a.unidade)}) · desde ${new Date(a.iniciado_em).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>
            ${a.silenciado ? `<div style="font-size:11px;color:var(--text-faint);">🔕 Silenciado até ${new Date(a.silenciado_ate).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>` : ''}
            ${a.reconhecido_em ? `<div style="font-size:11px;color:var(--text-faint);">✔ Reconhecido por ${escapeHtmlAdmin(a.reconhecido_por_nome || '')}</div>` : ''}
          </div>
        </div>
        <div class="sys-alert-actions">
          ${a.reconhecido_em ? '' : `<button class="btn btn-sm" onclick="SysAlerts.ack(${a.id})">Reconhecer</button>`}
          <select class="input" onchange="if(this.value) SysAlerts.silence(${a.id}, Number(this.value))">
            <option value="">Silenciar…</option><option value="30">30 min</option><option value="120">2 horas</option><option value="360">Até o fim da live (6 h)</option>
          </select>
        </div>
      </div>`).join('');
  },

  async renderHistorico(body){
    body.innerHTML = '<div class="empty-state">Carregando…</div>';
    try{
      const q = this.histFiltro ? '&metrica=' + encodeURIComponent(this.histFiltro) : '';
      const rows = await App.apiFetch('/api/admin/system/alerts?dias=7' + q);
      const opcoes = (this.status?.metricas || []).map(m=>`<option value="${m.metrica}" ${m.metrica===this.histFiltro ? 'selected' : ''}>${m.label}</option>`).join('');
      body.innerHTML = `<select class="input" style="width:100%;margin-bottom:10px;" onchange="SysAlerts.histFiltro=this.value;SysAlerts.render()"><option value="">Todos os indicadores (7 dias)</option>${opcoes}</select>`
        + (rows.length === 0 ? '<div class="empty-state">Nenhum alerta nos últimos 7 dias.</div>' : rows.map(r=>{
          const ini = new Date(r.iniciado_em);
          const fim = r.encerrado_em ? new Date(r.encerrado_em) : null;
          const fmtH = (d)=>d.toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
          return `<div class="sys-hist">
            <span>${this.NIVEL_EMOJI[r.nivel]}</span>
            <div style="flex:1;"><b>${r.label}</b> = ${this.fmt(r.valor, r.unidade)}<div style="font-size:11px;color:var(--text-faint);">${fmtH(ini)} → ${fim ? fmtH(fim) + ' 🟢' : 'ativo'}${r.reconhecido_por_nome ? ' · ✔ ' + escapeHtmlAdmin(r.reconhecido_por_nome) : ''}</div></div>
          </div>`;
        }).join(''));
    }catch(e){ body.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`; }
  },

  async renderConfig(body){
    body.innerHTML = '<div class="empty-state">Carregando…</div>';
    try{
      const [rules, ch] = await Promise.all([App.apiFetch('/api/admin/system/rules'), App.apiFetch('/api/admin/system/channels')]);
      this._rules = rules;
      this._canais = ch.canais.map(c=>({tipo: c.tipo, destino: c.destino || '', nivel_minimo: c.nivel_minimo, habilitado: !!c.habilitado}));
      this._sinoConfigurado = ch.sinoConfigurado;
      this.renderConfigBody(body);
    }catch(e){ body.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`; }
  },

  renderConfigBody(body){
    let grupo = '';
    const linhas = this._rules.map((r, i)=>{
      const head = r.grupo !== grupo ? `<tr><td colspan="4" class="sys-group" style="padding-top:12px;">${(grupo = r.grupo)}</td></tr>` : '';
      return head + `<tr>
        <td><label style="display:flex;gap:6px;align-items:center;"><input type="checkbox" ${r.habilitado ? 'checked' : ''} onchange="SysAlerts._rules[${i}].habilitado=this.checked">${r.label}${r.unidade ? ` <span style="color:var(--text-faint);">(${r.unidade})</span>` : ''}</label></td>
        <td><input class="input sys-num" type="number" step="any" value="${r.amarelo ?? ''}" placeholder="—" onchange="SysAlerts._rules[${i}].amarelo=this.value===''?null:Number(this.value)"></td>
        <td><input class="input sys-num" type="number" step="any" value="${r.vermelho ?? ''}" placeholder="—" onchange="SysAlerts._rules[${i}].vermelho=this.value===''?null:Number(this.value)"></td>
        <td style="font-size:10.5px;color:var(--text-faint);">${r.direcao === 'abaixo' ? 'abaixo de' : 'acima de'}</td>
      </tr>`;
    }).join('');
    const canais = this._canais.map((c, i)=>`
      <div class="sys-canal">
        <select class="input" onchange="SysAlerts._canais[${i}].tipo=this.value;SysAlerts.renderConfigBody(document.getElementById('sysBody'))">
          <option value="sino" ${c.tipo==='sino' ? 'selected' : ''}>Sino (webhook do Sino)</option>
          <option value="webhook" ${c.tipo==='webhook' ? 'selected' : ''}>Webhook (URL)</option>
        </select>
        ${c.tipo === 'webhook' ? `<input class="input" placeholder="https://…" value="${escapeHtmlAdmin(c.destino)}" onchange="SysAlerts._canais[${i}].destino=this.value.trim()">` : `<span style="font-size:11px;color:var(--text-faint);">${this._sinoConfigurado ? 'usa o webhook já configurado do Sino' : 'Sino não configurado no servidor'}</span>`}
        <select class="input" onchange="SysAlerts._canais[${i}].nivel_minimo=this.value">
          <option value="vermelho" ${c.nivel_minimo==='vermelho' ? 'selected' : ''}>Só 🔴</option>
          <option value="amarelo" ${c.nivel_minimo==='amarelo' ? 'selected' : ''}>🟡 e 🔴</option>
        </select>
        <label style="display:flex;gap:4px;align-items:center;font-size:11.5px;"><input type="checkbox" ${c.habilitado ? 'checked' : ''} onchange="SysAlerts._canais[${i}].habilitado=this.checked">ativo</label>
        <button class="btn btn-sm" onclick="SysAlerts._canais.splice(${i},1);SysAlerts.renderConfigBody(document.getElementById('sysBody'))">✕</button>
      </div>`).join('');
    body.innerHTML = `
      <div class="sys-group">Canais de notificação</div>
      <div style="font-size:11px;color:var(--text-faint);margin-bottom:8px;">Avisa só quando o estado muda (🟢→🟡, 🟡→🔴 e a volta ao 🟢). Silenciados não são reenviados.</div>
      ${canais || '<div style="font-size:12px;color:var(--text-faint);margin-bottom:6px;">Nenhum canal — os alertas aparecem só aqui no sininho.</div>'}
      <div style="display:flex;gap:8px;margin:8px 0 4px;">
        <button class="btn btn-sm" onclick="SysAlerts._canais.push({tipo:'webhook',destino:'',nivel_minimo:'vermelho',habilitado:true});SysAlerts.renderConfigBody(document.getElementById('sysBody'))">＋ Canal</button>
        <button class="btn btn-sm" onclick="SysAlerts.saveCanais()">Salvar canais</button>
        <button class="btn btn-sm" onclick="SysAlerts.testAlert()">Enviar alerta de teste</button>
      </div>
      <div class="sys-group">Limites</div>
      <table class="sys-rules"><thead><tr><th>Indicador</th><th>🟡</th><th>🔴</th><th></th></tr></thead><tbody>${linhas}</tbody></table>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-sm btn-primary" onclick="SysAlerts.saveRules()">Salvar limites</button>
        <button class="btn btn-sm" onclick="SysAlerts.resetRules()">Restaurar padrão</button>
      </div>
      <div style="font-size:11px;color:var(--text-faint);margin-top:8px;">Um alerta dispara depois de 2 coletas seguidas (≈2 min) fora do limite e volta ao normal depois de 3.</div>`;
  },

  async saveRules(){
    try{
      await App.apiFetch('/api/admin/system/rules', {method:'PUT', body: JSON.stringify(this._rules.map(r=>({metrica: r.metrica, amarelo: r.amarelo, vermelho: r.vermelho, habilitado: r.habilitado})))});
      App.toast('Limites salvos — valem a partir da próxima coleta');
    }catch(e){ App.toast('Erro: ' + e.message); }
  },
  async resetRules(){
    if(!confirm('Voltar todos os limites para o padrão?')) return;
    try{ await App.apiFetch('/api/admin/system/rules', {method:'DELETE'}); App.toast('Limites restaurados'); this.render(); }catch(e){ App.toast('Erro: ' + e.message); }
  },
  async saveCanais(){
    try{
      await App.apiFetch('/api/admin/system/channels', {method:'PUT', body: JSON.stringify(this._canais.map(c=>({...c, destino: c.tipo === 'webhook' ? c.destino : null})))});
      App.toast('Canais salvos');
    }catch(e){ App.toast('Erro: ' + e.message); }
  },
  async testAlert(){
    try{
      const r = await App.apiFetch('/api/admin/system/test-alert', {method:'POST'});
      App.toast(`Alerta de teste enviado para ${r.enviados} de ${r.canais} canal(is)`);
    }catch(e){ App.toast('Erro: ' + e.message); }
  },
  async ack(id){
    try{ await App.apiFetch(`/api/admin/system/alerts/${id}/ack`, {method:'POST'}); await this.refresh(); this.render(); }catch(e){ App.toast('Erro: ' + e.message); }
  },
  async silence(id, minutos){
    try{ await App.apiFetch(`/api/admin/system/alerts/${id}/silence`, {method:'POST', body: JSON.stringify({minutos})}); await this.refresh(); this.render(); }catch(e){ App.toast('Erro: ' + e.message); }
  },
  async setSegurarChat(ligado){
    if(ligado && !confirm('Segurar o chat de TODOS os webinars integrados ao Sino? Os alunos recebem uma resposta automática até você soltar.')){ this.renderHead(); return; }
    try{
      await App.apiFetch('/api/admin/system/segurar-chat', {method:'POST', body: JSON.stringify({ligado})});
      App.toast(ligado ? 'Chat segurado em todos os webinars' : 'Chat liberado');
      await this.refresh();
      this.renderHead();
    }catch(e){ App.toast('Erro: ' + e.message); }
  },
};
