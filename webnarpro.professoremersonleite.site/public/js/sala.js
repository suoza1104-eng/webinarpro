function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

const Sala = {
  slug: null,
  isReplay: false,
  info: null,
  room: null,
  leadToken: null,
  activeTab: 'chat',
  video: null,
  maxPlayedTime: 0,
  shownMsgIdx: 0,
  shownSaleIdx: 0,
  heartbeatSent: {},

  init(){
    const parts = window.location.pathname.split('/').filter(Boolean);
    this.slug = decodeURIComponent(parts[0] || '');
    this.isReplay = parts[1] === 'replay';
    const params = new URLSearchParams(window.location.search);
    this.isPreview = params.has('preview');
    this.abAssignmentId = params.get('ab_assignment') ? Number(params.get('ab_assignment')) : null;
    if(!this.slug){ this.showError('Link inválido.'); return; }
    this.leadToken = localStorage.getItem('wp_lead_' + this.slug) || null;
    this.loadInfo();
  },

  showError(msg){
    document.getElementById('salaLoading').style.display = 'none';
    const el = document.getElementById('salaError');
    el.textContent = msg;
    el.style.display = 'flex';
  },

  applyTopbarBranding(){
    const cfg = (this.info && this.info.loginConfig) || {};
    const topbar = document.getElementById('pubTopbar');
    if(!topbar) return;
    if(cfg.logo_url){
      topbar.innerHTML = `<img src="${escapeHtml(cfg.logo_url)}" alt="logo" style="height:22px;width:auto;display:block;">`;
    } else if(cfg.ocultar_marca){
      topbar.style.display = 'none';
    }
  },

  brandHtml(staticPos){
    const b = (this.room && this.room.branding) || (this.info && this.info.loginConfig) || {};
    const logoUrl = b.logoUrl || b.logo_url;
    const hide = b.ocultarMarca || b.ocultar_marca;
    const posStyle = staticPos ? 'position:static;' : '';
    if(logoUrl) return `<img src="${escapeHtml(logoUrl)}" alt="logo" class="pub-brand-badge pub-brand-logo" style="${posStyle}">`;
    if(hide) return '';
    return `<div class="pub-brand-badge" style="${posStyle}">⚡ WebnarPRO</div>`;
  },

  async loadInfo(){
    try{
      const res = await fetch('/api/public/webinars/' + encodeURIComponent(this.slug));
      if(res.status === 404){ this.showError('Este webinar não existe ou foi removido.'); return; }
      this.info = await res.json();
    }catch(e){
      this.showError('Não foi possível carregar a sala. Tente novamente em instantes.');
      return;
    }

    document.getElementById('salaLoading').style.display = 'none';
    document.getElementById('pubTitle').textContent = this.info.titulo || 'Aula ao vivo';
    document.title = (this.info.titulo || 'WebnarPRO') + ' — Sala';
    this.applyTopbarBranding();
    document.documentElement.setAttribute('data-pub-theme', this.info.temaSala || 'escuro');

    if(this.isPreview && !this.leadToken){
      await this.autoRegisterPreview();
      return;
    }

    if(this.leadToken){
      const ok = await this.loadRoom();
      if(ok) return;
    }
    this.showRegister();
  },

  async autoRegisterPreview(){
    try{
      const res = await fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Aluno (Prévia)', email: 'preview@webnarpro.com' }),
      });
      const data = await res.json();
      if(res.ok && data.token){
        this.leadToken = data.token;
        localStorage.setItem('wp_lead_' + this.slug, this.leadToken);
        await this.loadRoom();
        return;
      }
    }catch(e){}
    this.showRegister();
  },

  showRegister(){
    const cfg = this.info.loginConfig || {};
    document.getElementById('regTitle').textContent = this.info.titulo || 'Aula ao vivo';
    if(this.info.nomeApresentador){
      document.getElementById('regSub').textContent = 'com ' + this.info.nomeApresentador;
    }
    if(cfg.exibir_barra_progresso){
      const badge = document.getElementById('regBadge');
      badge.style.display = 'block';
      badge.textContent = (cfg.progresso_inicial || 0) + '% das vagas preenchidas...';
    }
    document.getElementById('regWhatsField').style.display = cfg.pedir_whatsapp ? 'block' : 'none';
    document.getElementById('regEmpresaField').style.display = cfg.pedir_empresa ? 'block' : 'none';
    const btn = document.getElementById('regSubmitBtn');
    if(cfg.titulo_botao) btn.textContent = cfg.titulo_botao;
    if(cfg.cor_botao){ btn.style.background = cfg.cor_botao; btn.style.borderColor = cfg.cor_botao; }
    if(cfg.cor_texto_botao) btn.style.color = cfg.cor_texto_botao;
    document.getElementById('regScreen').classList.add('open');
  },

  async register(){
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const whatsapp = document.getElementById('regWhats').value.trim();
    const empresa = document.getElementById('regEmpresa').value.trim();
    const errEl = document.getElementById('regError');
    errEl.style.display = 'none';
    if(!nome || !email){ errEl.textContent = 'Preencha nome e e-mail.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('regSubmitBtn');
    btn.disabled = true;
    try{
      const res = await fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, whatsapp: whatsapp || undefined, empresa: empresa || undefined, ab_assignment_id: this.abAssignmentId || undefined }),
      });
      const data = await res.json();
      if(!res.ok) throw new Error((data && data.error) || 'Não foi possível entrar na sala.');

      this.leadToken = data.token;
      localStorage.setItem('wp_lead_' + this.slug, this.leadToken);
      document.getElementById('regScreen').classList.remove('open');
      await this.loadRoom();
    }catch(e){
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }finally{
      btn.disabled = false;
    }
  },

  async loadRoom(){
    try{
      const res = await fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/room', {
        headers: { Authorization: 'Bearer ' + this.leadToken },
      });
      if(res.status === 401){
        localStorage.removeItem('wp_lead_' + this.slug);
        this.leadToken = null;
        if(this.isPreview){
          await this.autoRegisterPreview();
          return true;
        }
        return false;
      }
      this.room = await res.json();
    }catch(e){
      return false;
    }

    document.getElementById('publicPage').style.display = 'flex';
    document.documentElement.setAttribute('data-pub-theme', this.room.temaSala || 'escuro');
    document.getElementById('pubMsgsSuporte').innerHTML = '<div class="empty-state">Envie uma mensagem privada para o suporte.</div>';
    this.startSupportPolling();
    this.setupReactions();
    const reopenBtn = document.getElementById('reopenCheckoutBtn');
    if(reopenBtn && this.room.offerConfig?.reopenCor) reopenBtn.style.background = this.room.offerConfig.reopenCor;
    const fontSize = this.room.chatTamanhoFonte || 'media';
    const sideEl = document.getElementById('pubSide');
    if(sideEl){
      sideEl.classList.remove('chat-font-pequena','chat-font-grande');
      if(fontSize !== 'media') sideEl.classList.add('chat-font-' + fontSize);
    }
    this.setupAudienceBadge();
    this.resetRoomScroll();
    this.bindRoomViewportReset();

    if(this.isReplay){
      const inputRow = document.querySelector('.pub-input-row');
      const note = document.getElementById('pubReplayNote');
      if(inputRow) inputRow.style.display = 'none';
      if(note) note.style.display = 'block';
      const saved = this.loadReplayProgress();
      this.maxPlayedTime = saved?.maxPlayed || 0;
      this.showCover();
      return true;
    }

    if(this.isPreview){
      // No modo prévia (Ver como aluno), zera a sessão para iniciar imediatamente no horário exato de início (00:00 da transmissão)
      localStorage.removeItem('wp_start_' + this.slug);
      this.sessionStartedAt = Date.now();
      localStorage.setItem('wp_start_' + this.slug, String(this.sessionStartedAt));
      this.startLive(0);
      return true;
    }

    if(this.shouldObeySchedule()){
      this.handleScheduledStart();
      return true;
    }

    const startedAt = Number(localStorage.getItem('wp_start_' + this.slug) || 0);
    if(!startedAt){
      this.showCover();
      return true;
    }

    this.sessionStartedAt = startedAt;
    const elapsed = (Date.now() - startedAt) / 1000;
    const duration = this.room.video?.duracaoSegundos;
    if(elapsed < this.COUNTDOWN_SECONDS){
      this.startCountdown(Math.ceil(this.COUNTDOWN_SECONDS - elapsed));
    } else if(duration && (elapsed - this.COUNTDOWN_SECONDS) >= duration){
      this.showEnded();
    } else {
      this.startLive(elapsed - this.COUNTDOWN_SECONDS);
    }
    return true;
  },

  COUNTDOWN_SECONDS: 8,
  EDGE_TOLERANCE: 3,

  updateLiveBadge(show){
    const wrap = document.getElementById('pubVideoBadges');
    const pill = document.getElementById('pubLivePill');
    if(!wrap) return;
    if(!show){
      wrap.classList.remove('show');
      return;
    }
    wrap.classList.add('show');
    if(pill){
      pill.classList.toggle('is-replay', !!this.isReplay);
      const label = pill.querySelector('svg')?.outerHTML || '';
      pill.innerHTML = label + (this.isReplay ? ' REPLAY' : ' AO VIVO');
    }
    this.renderAudienceBadge();
  },

  setupAudienceBadge(){
    if(this._audienceTicker) clearInterval(this._audienceTicker);
    const render = ()=>this.renderAudienceBadge();
    render();
    this._audienceTicker = setInterval(render, 12000);
  },

  getAudienceConfig(){
    return this.room?.audiencia || this.info?.audiencia || null;
  },

  renderAudienceBadge(){
    const el = document.getElementById('audienceLiveBadge');
    const cfg = this.getAudienceConfig();
    // Replay não é "ao vivo" de verdade — não faz sentido mostrar espectadores simulados.
    if(!el || this.isReplay || !cfg || cfg.tipo === 'nenhuma' || !cfg.mostrarBotaoAoVivo){
      if(el) el.style.display = 'none';
      return;
    }
    const min = Math.max(0, Number(cfg.min || 0));
    const max = Math.max(min, Number(cfg.max || min));
    let count = max;
    if(cfg.tipo === 'dinamica' && max > min){
      const cycle = 7200;
      const phase = (Date.now() / 1000) % cycle;
      let pct;
      if(phase < 1800) pct = phase / 1800;
      else if(phase < 3600) pct = 1;
      else pct = Math.max(0, 1 - ((phase - 3600) / 3600));
      count = Math.round(min + ((max - min) * pct));
    }
    const countEl = document.getElementById('audienceLiveCount');
    if(countEl) countEl.textContent = count.toLocaleString('pt-BR');
    el.style.display = 'flex';
  },

  async requestWakeLock(){
    if(!('wakeLock' in navigator) || this._wakeLock) return;
    try{
      this._wakeLock = await navigator.wakeLock.request('screen');
      this._wakeLock.addEventListener('release', ()=>{ this._wakeLock = null; });
    }catch(e){}
  },

  resetRoomScroll(){
    requestAnimationFrame(()=>{
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const page = document.getElementById('publicPage');
      if(page) page.scrollTop = 0;
    });
  },

  bindRoomViewportReset(){
    if(this._roomViewportResetBound) return;
    this._roomViewportResetBound = true;
    const reset = ()=>setTimeout(()=>this.resetRoomScroll(), 80);
    window.addEventListener('orientationchange', reset);
    window.addEventListener('resize', reset);
  },

  tryEnterFullscreen(){
    // A API nativa de fullscreen não é suportada em toda página no Safari/iOS — o layout já
    // usa a largura toda da tela por padrão (CSS), então isso é só um bônus onde o navegador
    // suporta (some navegadores escondem a barra de endereço etc.).
    if(!this.room?.video?.fullscreen) return;
    try{
      document.documentElement.requestFullscreen?.();
    }catch(e){}
  },

  maintainLiveEdge(){
    if(!this.followLiveEdge || !this.video || this.video.paused || this.isReplay) return;
    const target = this.getMaxSeekable();
    if(!Number.isFinite(target) || target <= 0) return;
    if(target - this.video.currentTime > this.EDGE_TOLERANCE){
      this.video.currentTime = target;
    }
  },

  bindWakeLockRestore(){
    if(this._wakeRestoreBound) return;
    this._wakeRestoreBound = true;
    document.addEventListener('visibilitychange', ()=>{
      if(document.visibilityState === 'visible' && (this._scheduledTicker || this.video)){
        this.requestWakeLock();
      }
    });
  },

  shouldObeySchedule(){
    return !!(this.room?.usarSalaEspera || this.info?.usarSalaEspera) && !!this.getScheduledStartMs();
  },

  getScheduledStartMs(){
    const raw = this.room?.dataInicio || this.info?.dataInicio;
    if(!raw) return null;
    const ms = new Date(raw).getTime();
    return Number.isNaN(ms) ? null : ms;
  },

  handleScheduledStart(){
    if(this._scheduledTicker) clearInterval(this._scheduledTicker);
    this.bindWakeLockRestore();
    this.requestWakeLock();
    const startMs = this.getScheduledStartMs();
    this.sessionStartedAt = startMs - (this.COUNTDOWN_SECONDS * 1000);
    localStorage.removeItem('wp_start_' + this.slug);

    const duration = this.room.video?.duracaoSegundos;
    const renderOrStart = ()=>{
      const now = Date.now();
      if(now < startMs){
        this.renderScheduledWait(startMs);
        return;
      }

      clearInterval(this._scheduledTicker);
      const elapsed = Math.max(0, (now - startMs) / 1000);
      if(duration && elapsed >= duration){
        this.showEnded();
      } else {
        this.startLive(elapsed);
      }
    };

    renderOrStart();
    if(Date.now() < startMs){
      this._scheduledTicker = setInterval(renderOrStart, 1000);
    }
  },

  renderScheduledWait(startMs){
    const remaining = Math.max(0, Math.ceil((startMs - Date.now()) / 1000));
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;
    const countdown = days > 0
      ? `${days}d ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
      : `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    const startDate = new Date(startMs);
    const now = new Date();
    const sameDay = startDate.toDateString() === now.toDateString();
    const startsAt = sameDay
      ? `Vamos iniciar às ${startDate.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}.`
      : `Vamos iniciar dia ${startDate.toLocaleDateString('pt-BR')} às ${startDate.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}.`;

    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-scheduled-wait" onclick="Sala.requestWakeLock()">
        <div class="pub-wait-kicker">Já vamos começar</div>
        <div class="pub-wait-title">${startsAt}</div>
        <div class="pub-wait-count">${countdown}</div>
        <div class="pub-wait-sub">A transmissão começa automaticamente no horário marcado.</div>
        ${this.brandHtml()}
      </div>`;
  },

  showCover(){
    this.updateLiveBadge(false);
    const thumb = this.room?.video?.thumbnailUrl;
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-cover" onclick="Sala.beginSession()">
        <div class="pub-cover-bg ${thumb ? '' : 'no-image'}" ${thumb ? `style="background-image:url('${escapeHtml(thumb)}')"` : ''}></div>
        <div class="pub-cover-dim"></div>
        <div class="pub-cover-content">
          <div class="pub-cover-kicker">SUA AULA JÁ COMEÇOU</div>
          <div class="pub-cover-playbtn"><svg viewBox="0 0 24 24"><path d="M9 7l9 5-9 5V7z" fill="currentColor"/></svg></div>
          <div class="pub-cover-sub">Clique para assistir</div>
        </div>
      </div>`;
  },

  showEnded(){
    if(this._countdown) clearInterval(this._countdown);
    if(this._ytTicker) clearInterval(this._ytTicker);
    if(this._liveFollowTicker) clearInterval(this._liveFollowTicker);
    this.followLiveEdge = false;
    this.updateLiveBadge(false);
    const apresentador = this.info?.nomeApresentador;
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-live" style="flex-direction:column;gap:10px;">
        ${this.brandHtml(true)}
        <div style="font-family:var(--font-display);font-size:18px;text-align:center;padding:0 20px;">A aula chegou ao fim</div>
        <div style="font-size:12.5px;color:var(--text-dim);text-align:center;padding:0 20px;">
          Obrigado por assistir${apresentador ? ' até aqui com ' + escapeHtml(apresentador) : ''}!
        </div>
        ${this.isReplay
          ? '<button type="button" class="btn btn-primary" style="margin-top:8px;" onclick="Sala.startLive(0)">Assistir novamente</button>'
          : `<a class="btn btn-primary" style="margin-top:8px;" href="/${encodeURIComponent(this.slug)}/replay">Assistir novamente</a>`}
      </div>`;
  },

  beginSession(){
    this.requestWakeLock();
    this.tryEnterFullscreen();
    if(!this.isReplay){
      this.sessionStartedAt = Date.now();
      localStorage.setItem('wp_start_' + this.slug, String(this.sessionStartedAt));
    }
    this.startCountdown(this.COUNTDOWN_SECONDS);
  },

  formatTime(secs){
    secs = Math.max(0, Math.floor(secs || 0));
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2,'0')}:${ss}` : `${mm}:${ss}`;
  },

  replayProgressKey(){
    return 'wp_replay_' + this.slug;
  },
  loadReplayProgress(){
    try{
      const raw = localStorage.getItem(this.replayProgressKey());
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  },
  saveReplayProgress(maxPlayed){
    try{
      localStorage.setItem(this.replayProgressKey(), JSON.stringify({ maxPlayed }));
    }catch(e){}
  },

  // No replay, a trava de avanço usa o início da oferta como ponto X (em vez do bloqueioSegundo
  // da live) — assim o aluno é livre pra navegar até a oferta, mas dali pra frente só avança
  // assistindo de verdade. Sem oferta configurada, não existe trava nenhuma.
  getReplayLockSecond(){
    const offer = this.room.offerConfig;
    return (offer && offer.inicioOfertaSegundos != null) ? offer.inicioOfertaSegundos : null;
  },

  // O "agora" de verdade — sempre cresce com o relógio, nunca para (nem se o espectador pausar).
  // É o que a extremidade direita da barra representa.
  getLiveEdge(){
    const cfg = this.room.video;
    const duration = cfg.duracaoSegundos || (this.video && this.video.duration) || 0;
    if(this.isReplay) return duration || Infinity;
    const elapsed = this.sessionStartedAt
      ? Math.max(0, (Date.now() - this.sessionStartedAt) / 1000 - this.COUNTDOWN_SECONDS)
      : 0;
    return duration ? Math.min(elapsed, duration) : elapsed;
  },

  // Até onde o espectador tem permissão de ir (arrastando ou acelerando). Antes do ponto de
  // bloqueio, é igual ao "agora" de verdade. Depois que o "agora" passa do ponto de bloqueio,
  // trava em X até a pessoa realmente assistir até lá — sem acelerar, sem adiantar.
  getMaxSeekable(currentTimeOverride){
    const cfg = this.room.video;
    const liveEdge = this.getLiveEdge();
    const X = this.isReplay ? this.getReplayLockSecond() : cfg.bloqueioSegundo;
    if(X == null || liveEdge <= X) return liveEdge;
    const currentTime = currentTimeOverride != null ? currentTimeOverride : (this.video ? this.video.currentTime : 0);
    // No replay o teto nunca recua: é o maior ponto já assistido (persistido), não a posição atual —
    // assim dar replay pra trás não derruba o que a pessoa já desbloqueou.
    const watched = this.isReplay ? Math.max(currentTime, this.maxPlayedTime || 0) : currentTime;
    return watched >= X ? watched : X;
  },

  startCountdown(initialSecs){
    this.bindWakeLockRestore();
    this.requestWakeLock();
    this.tryEnterFullscreen();
    this.updateLiveBadge(false);
    let secs = initialSecs != null ? initialSecs : this.COUNTDOWN_SECONDS;
    const box = document.getElementById('pubVideo');
    const render = ()=>{
      const mm = String(Math.floor(secs/60)).padStart(2,'0');
      const ss = String(secs%60).padStart(2,'0');
      box.innerHTML = `
        <div class="pub-countdown">
          <div class="pub-stripe left"></div><div class="pub-stripe right"></div>
          <div class="pub-cd-text">INICIAREMOS EM</div>
          <div class="pub-cd-num">${mm}:${ss}</div>
          ${this.brandHtml()}
        </div>`;
    };
    render();
    this._countdown = setInterval(()=>{
      secs--;
      if(secs <= 0){ clearInterval(this._countdown); this.startLive(this.isReplay ? (this.maxPlayedTime || 0) : 0); return; }
      render();
    }, 1000);
  },

  startLive(seekTo){
    this.bindWakeLockRestore();
    this.requestWakeLock();
    if(!this.room.video){
      this.updateLiveBadge(false);
      document.getElementById('pubVideo').innerHTML = `<div class="pub-live">${this.brandHtml()}Vídeo ainda não configurado para este webinar.</div>`;
      return;
    }
    const cfg = this.room.video;
    if(cfg.status !== 'pronto'){
      this.updateLiveBadge(false);
      const msg = cfg.status === 'erro'
        ? 'Houve um erro ao processar este vídeo. Envie novamente na biblioteca de vídeos do painel.'
        : 'O vídeo ainda está sendo processado. Isso pode levar alguns minutos em arquivos longos — tente recarregar a página daqui a pouco.';
      document.getElementById('pubVideo').innerHTML = `
        <div class="pub-live" style="flex-direction:column;gap:10px;">
          ${this.brandHtml(true)}
          <div style="font-size:12.5px;color:var(--text-dim);text-align:center;padding:0 24px;max-width:420px;">${msg}</div>
          <button class="btn btn-primary btn-sm" onclick="location.reload()">Recarregar página</button>
        </div>`;
      return;
    }
    if(this._ytTicker) clearInterval(this._ytTicker);
    if(this._liveFollowTicker) clearInterval(this._liveFollowTicker);
    // No replay nao existe "borda ao vivo" pra perseguir - isso e so pra transmissao real.
    // Sem essa checagem, o seek automatico de carregamento usava getMaxSeekable() (o teto da
    // trava da oferta) em vez da posicao de retomada, abrindo a oferta assim que o replay comecava.
    this.followLiveEdge = this.isReplay ? false : (this.shouldObeySchedule() || seekTo > 0);
    const scheduledAutoplay = this.shouldObeySchedule();

    if(cfg.modoYoutube){
      document.getElementById('pubVideo').innerHTML = `
        <div class="yt-wrap">
          <video id="pubVideoEl" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>
          <div class="yt-controls" id="ytControls">
            <div class="yt-scrub" id="ytScrub">
              <div class="yt-scrub-track"></div>
              <div class="yt-scrub-played" id="ytPlayed"></div>
              <div class="yt-scrub-thumb" id="ytThumb"></div>
            </div>
            <div class="yt-controls-row">
              <button class="yt-btn" id="ytPlayBtn"></button>
              <span class="yt-time" id="ytTime">0:00</span>
              <div style="flex:1;"></div>
              <button class="yt-live-btn" id="ytLiveBtn" onclick="Sala.ytGoLive()">AO VIVO</button>
              <div class="yt-speed-wrap">
                <button class="yt-speed-btn" id="ytSpeedBtn" onclick="Sala.ytToggleSpeedMenu()">1x</button>
                <div class="yt-speed-menu" id="ytSpeedMenu"></div>
              </div>
              <div class="yt-quality-wrap">
                <button class="yt-quality-btn" id="ytQualityBtn" onclick="Sala.ytToggleQualityMenu()" title="Qualidade">${this.ICON_GEAR}</button>
                <div class="yt-quality-menu" id="ytQualityMenu"></div>
              </div>
              <div class="yt-vol-wrap">
                <button class="yt-btn" id="ytMuteBtn" onclick="Sala.ytToggleMute()">${this.ICON_VOLUME_ON}</button>
                <input type="range" class="yt-volume" id="ytVolume" min="0" max="1" step="0.05" value="1" oninput="Sala.ytSetVolume(this.value)">
              </div>
            </div>
          </div>
        </div>`;
    } else {
      document.getElementById('pubVideo').innerHTML = `
        <div class="pub-live" style="padding:0;">
          <video id="pubVideoEl" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>
          <div class="yt-controls" id="ytControls" style="opacity:1;pointer-events:auto;">
            <div class="yt-controls-row" style="justify-content:flex-end;">
              <div class="yt-quality-wrap">
                <button class="yt-quality-btn" id="ytQualityBtn" onclick="Sala.ytToggleQualityMenu()" title="Qualidade">${this.ICON_GEAR}</button>
                <div class="yt-quality-menu" id="ytQualityMenu"></div>
              </div>
              <div class="yt-vol-wrap">
                <button class="yt-btn" id="ytMuteBtn" onclick="Sala.ytToggleMute()">${this.ICON_VOLUME_ON}</button>
                <input type="range" class="yt-volume" id="ytVolume" min="0" max="1" step="0.05" value="1" oninput="Sala.ytSetVolume(this.value)">
              </div>
            </div>
          </div>
        </div>`;
    }
    this.updateLiveBadge(true);

    const el = document.getElementById('pubVideoEl');
    this.video = el;
    if(scheduledAutoplay){
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
      el.setAttribute('autoplay', '');
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
    }

    this.maxPlayedTime = Math.max(this.maxPlayedTime || 0, seekTo || 0);
    el.addEventListener('loadedmetadata', ()=>{
      const target = this.followLiveEdge ? this.getMaxSeekable() : seekTo;
      if(target > 0) el.currentTime = Math.min(target, el.duration || target);
    }, { once: true });

    // hls.js tem prioridade sempre que possivel (funciona ate no Safari via MSE) porque e ele
    // quem alimenta o seletor de qualidade - no play nativo (fallback de HLS sem MSE, tipo iOS
    // Safari antigo) nao existe API JS pra listar/trocar qualidade, entao o botao fica escondido.
    const qualityBtn = document.getElementById('ytQualityBtn');
    if(window.Hls && Hls.isSupported()){
      this.hls = new Hls();
      this.hls.loadSource(cfg.url);
      this.hls.attachMedia(el);
      this.hls.on(Hls.Events.MANIFEST_PARSED, ()=>this.renderQualityMenu());
      this.hls.on(Hls.Events.LEVEL_SWITCHED, ()=>this.renderQualityMenu());
    } else {
      el.src = cfg.url;
      if(qualityBtn) qualityBtn.closest('.yt-quality-wrap').style.display = 'none';
    }

    this.userPaused = false;
    el.onclick = ()=>{
      this.requestWakeLock();
      this.hidePlayOverlay();
      if(el.paused){
        this.userPaused = false;
        if(this.followLiveEdge) this.maintainLiveEdge();
        el.play().catch(()=>{});
      } else {
        this.userPaused = true;
        this.followLiveEdge = false;
        el.pause();
      }
    };
    el.onpause = ()=>{ if(!document.hidden){ this.userPaused = true; this.followLiveEdge = false; } };
    el.onplay = ()=>{ this.userPaused = false; if(this.followLiveEdge) this.maintainLiveEdge(); };

    if(!this._visHandlerBound){
      this._visHandlerBound = true;
      document.addEventListener('visibilitychange', ()=>{
        if(!this.video) return;
        if(document.visibilityState === 'hidden'){
          this._hiddenAt = Date.now();
          this._posAtHidden = this.video.currentTime;
          return;
        }
        if(this.userPaused || !this._hiddenAt) return;
        const hiddenSecs = (Date.now() - this._hiddenAt) / 1000;
        this._hiddenAt = null;

        if(hiddenSecs > 8){
          const rcfg = this.room.video;
          const duration = rcfg?.duracaoSegundos || this.video.duration;
          // Modo YouTube: aba escondida = como se tivesse pausado, não avança sozinho.
          const newPos = rcfg?.modoYoutube ? this._posAtHidden : this._posAtHidden + hiddenSecs;
          if(duration && newPos >= duration){
            if(this.hls){ this.hls.destroy(); this.hls = null; }
            this.showEnded();
          } else {
            if(this.hls){ this.hls.destroy(); this.hls = null; }
            this.startLive(newPos);
          }
        } else {
          if(this.hls) this.hls.startLoad();
          if(this.video.paused) this.video.play().catch(()=>{});
        }
      });
    }

    if(cfg.modoYoutube){
      el.addEventListener('seeking', ()=>{
        const max = this.getMaxSeekable();
        if(el.currentTime > max + 0.5) el.currentTime = max;
        if(el.currentTime < max - this.EDGE_TOLERANCE) this.followLiveEdge = false;
      });
      el.addEventListener('ratechange', ()=>{
        if(el.playbackRate !== 1 && el.currentTime >= this.getMaxSeekable() - this.EDGE_TOLERANCE) el.playbackRate = 1;
      });
      this.setupYoutubeControls(el, cfg);
    } else if(cfg.bloquearAvancoVideo){
      el.addEventListener('seeking', ()=>{
        if(el.currentTime > this.maxPlayedTime + 1.5) el.currentTime = this.maxPlayedTime;
      });
    }

    el.addEventListener('timeupdate', ()=>{
      if(el.currentTime > this.maxPlayedTime) this.maxPlayedTime = el.currentTime;
      if(this.isReplay){
        const sec = Math.floor(this.maxPlayedTime);
        if(sec !== this._lastSavedReplaySec){
          this._lastSavedReplaySec = sec;
          this.saveReplayProgress(this.maxPlayedTime);
        }
      }
      this.checkScheduledContent(el.currentTime);
      this.checkHeartbeat(el.currentTime, el.duration);
    });

    el.addEventListener('ended', ()=>{
      if(this.isReplay){
        this.maxPlayedTime = Math.max(this.maxPlayedTime, this.room.video?.duracaoSegundos || el.duration || 0);
        this.saveReplayProgress(this.maxPlayedTime);
      }
      this.showEnded();
    });
    el.addEventListener('volumechange', ()=>this.syncVolumeUI());
    this._liveFollowTicker = setInterval(()=>this.maintainLiveEdge(), 1000);
    this.syncVolumeUI();

    if(cfg.autoplay || seekTo > 0 || this.shouldObeySchedule()){
      this.tryStartPlayback(el, scheduledAutoplay);
    }
  },

  async tryStartPlayback(el, allowMutedFallback){
    if(allowMutedFallback){
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
    }
    try{
      await el.play();
      this.hidePlayOverlay();
      if(allowMutedFallback && el.muted) this.showPlayOverlay('Toque para ativar o som', true);
      return;
    }catch(e){}

    if(allowMutedFallback){
      try{
        el.muted = true;
        await el.play();
        this.showPlayOverlay('Toque para ativar o som', true);
        return;
      }catch(e){}
    }

    this.showPlayOverlay('Toque para assistir', false);
  },

  showPlayOverlay(label, unmuteOnly){
    this.hidePlayOverlay();
    const wrap = document.getElementById('pubVideo');
    if(!wrap) return;
    const icon = unmuteOnly ? '🔇' : '▶';
    wrap.insertAdjacentHTML('beforeend', `
      <button class="pub-play-overlay ${unmuteOnly ? 'pub-play-overlay--sound' : ''}" id="pubPlayOverlay" onclick="Sala.resumeFromOverlay(${unmuteOnly ? 'true' : 'false'})">
        <span class="pub-play-overlay-icon">${icon}</span>
        <span>${label}</span>
      </button>`);
  },

  hidePlayOverlay(){
    document.getElementById('pubPlayOverlay')?.remove();
  },

  resumeFromOverlay(unmuteOnly){
    if(!this.video) return;
    this.requestWakeLock();
    this.tryEnterFullscreen();
    this.followLiveEdge = true;
    this.maintainLiveEdge();
    this.video.muted = false;
    this.userPaused = false;
    this.video.play().then(()=>this.hidePlayOverlay()).catch(()=>{
      if(!unmuteOnly) return;
      this.video.muted = true;
      this.video.play().catch(()=>{});
    });
  },

  syncVolumeUI(){
    if(!this.video) return;
    const muteBtn = document.getElementById('ytMuteBtn');
    const vol = document.getElementById('ytVolume');
    const isMuted = this.video.muted || this.video.volume === 0;
    if(muteBtn) muteBtn.innerHTML = isMuted ? this.ICON_VOLUME_MUTED : this.ICON_VOLUME_ON;
    if(vol) vol.value = this.video.muted ? 0 : this.video.volume;
  },
  ytToggleMute(){
    if(!this.video) return;
    this.video.muted = !this.video.muted;
  },
  ytSetVolume(v){
    if(!this.video) return;
    this.video.volume = Number(v);
    this.video.muted = Number(v) === 0;
  },

  setupYoutubeControls(el, cfg){
    const speeds = [1, 1.15, 1.25, 1.5, 2];
    const speedMenu = document.getElementById('ytSpeedMenu');
    speedMenu.innerHTML = speeds.map(s=>`<button data-speed="${s}" onclick="Sala.ytSetSpeed(${s})">${s}x</button>`).join('');

    const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
    const playBtn = document.getElementById('ytPlayBtn');
    playBtn.onclick = ()=>{ if(el.paused) el.play().catch(()=>{}); else el.pause(); };

    const updatePlayIcon = ()=>{ playBtn.innerHTML = el.paused ? playIcon : pauseIcon; };
    el.addEventListener('play', updatePlayIcon);
    el.addEventListener('pause', updatePlayIcon);
    updatePlayIcon();

    const scrub = document.getElementById('ytScrub');
    const seekFromEvent = (e)=>{
      const rect = scrub.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      el.currentTime = Math.min(frac * this.getLiveEdge(), this.getMaxSeekable());
      this.followLiveEdge = el.currentTime >= this.getMaxSeekable() - this.EDGE_TOLERANCE;
    };
    let dragging = false;
    scrub.addEventListener('mousedown', (e)=>{ dragging = true; seekFromEvent(e); });
    window.addEventListener('mousemove', (e)=>{ if(dragging) seekFromEvent(e); });
    window.addEventListener('mouseup', ()=>{ dragging = false; });
    scrub.addEventListener('touchstart', (e)=>seekFromEvent(e.touches[0]));
    scrub.addEventListener('touchmove', (e)=>seekFromEvent(e.touches[0]));

    const wrap = document.querySelector('.yt-wrap');
    const controlsEl = document.getElementById('ytControls');
    let hideTimer;
    const showControls = ()=>{
      wrap.classList.add('yt-show');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(()=>{ if(!el.paused) wrap.classList.remove('yt-show'); }, 3000);
    };
    const hideControlsNow = ()=>{
      clearTimeout(hideTimer);
      wrap.classList.remove('yt-show');
    };
    wrap.addEventListener('mousemove', showControls);
    wrap.addEventListener('mouseenter', showControls);
    // No touch não existe "hover" de verdade, então usamos o clique/toque pra alternar:
    // tocar em cima dos próprios controles (barra, botões) só renova o tempo de exibição;
    // tocar no vídeo "vazio" alterna mostrar/esconder — inclusive fechando na hora se a
    // pessoa tocar de novo, em vez de ficar preso aberto pra sempre.
    wrap.addEventListener('click', (e)=>{
      if(controlsEl.contains(e.target)){ showControls(); return; }
      if(wrap.classList.contains('yt-show')) hideControlsNow();
      else showControls();
    });
    showControls();

    this._ytTicker = setInterval(()=>this.ytTick(), 300);
    this.ytTick();
  },

  ytTick(){
    const el = this.video;
    if(!el) return;
    if(this.followLiveEdge && !el.paused) this.maintainLiveEdge();
    const liveEdge = this.getLiveEdge();
    const maxSeekable = this.getMaxSeekable();

    const playedEl = document.getElementById('ytPlayed');
    const thumbEl = document.getElementById('ytThumb');
    const timeEl = document.getElementById('ytTime');
    const liveBtn = document.getElementById('ytLiveBtn');
    if(!playedEl) return;

    // A extremidade direita da barra é sempre o "agora" de verdade (liveEdge) — nunca para,
    // mesmo pausado. A bolinha (currentTime) fica pra trás se a pessoa pausar ou ficar travada
    // no ponto de bloqueio, exatamente como uma live de verdade. Uma margem (EDGE_TOLERANCE)
    // evita que o pequeno atraso de buffer logo no início pareça "atrasado".
    const gap = liveEdge - el.currentTime;
    const playedPct = gap <= this.EDGE_TOLERANCE ? 100 : Math.min(100, (el.currentTime / liveEdge) * 100);
    playedEl.style.width = playedPct + '%';
    thumbEl.style.left = playedPct + '%';
    timeEl.textContent = this.formatTime(el.currentTime) + ' / ' + this.formatTime(liveEdge);

    const atEdge = el.currentTime >= maxSeekable - this.EDGE_TOLERANCE;
    liveBtn.classList.toggle('at-edge', atEdge);
    if(atEdge && el.playbackRate !== 1) el.playbackRate = 1;

    document.querySelectorAll('#ytSpeedMenu button').forEach(btn=>{
      const s = Number(btn.dataset.speed);
      btn.classList.toggle('sel', Math.abs(el.playbackRate - s) < 0.01);
      btn.disabled = s > 1 && atEdge;
    });
    document.getElementById('ytSpeedBtn').textContent = el.playbackRate + 'x';
  },

  ytGoLive(){
    if(!this.video) return;
    this.requestWakeLock();
    this.tryEnterFullscreen();
    this.followLiveEdge = true;
    this.video.currentTime = this.getMaxSeekable();
    this.video.playbackRate = 1;
    if(this.video.paused) this.video.play().catch(()=>{});
  },

  ytSetSpeed(s){
    if(!this.video) return;
    if(s > 1 && this.video.currentTime >= this.getMaxSeekable() - this.EDGE_TOLERANCE) return;
    this.video.playbackRate = s;
    document.getElementById('ytSpeedMenu').classList.remove('open');
  },

  ytToggleSpeedMenu(){
    document.getElementById('ytSpeedMenu').classList.toggle('open');
  },

  // ---------- QUALIDADE DO VÍDEO (hls.js) ----------
  renderQualityMenu(){
    const menu = document.getElementById('ytQualityMenu');
    if(!menu || !this.hls || !this.hls.levels || !this.hls.levels.length) return;
    const current = this.hls.currentLevel; // -1 = automático
    const playing = this.hls.currentLevel === -1 ? this.hls.loadLevel : this.hls.currentLevel;
    const playingHeight = this.hls.levels[playing] ? this.hls.levels[playing].height : null;
    const rows = this.hls.levels.map((lvl, i) => {
      const sel = current === i;
      return `<button class="${sel ? 'sel' : ''}" onclick="Sala.ytSetQuality(${i})"><span class="yq-dot"></span>${lvl.height}p</button>`;
    }).reverse().join('');
    menu.innerHTML = `
      <div class="yq-title">Qualidade</div>
      <button class="${current === -1 ? 'sel' : ''}" onclick="Sala.ytSetQuality(-1)">
        <span class="yq-dot"></span>Auto${playingHeight ? ` (${playingHeight}p)` : ''}
      </button>
      ${rows}`;
  },

  ytToggleQualityMenu(){
    document.getElementById('ytQualityMenu')?.classList.toggle('open');
  },

  ytSetQuality(levelIndex){
    if(this.hls) this.hls.currentLevel = levelIndex;
    document.getElementById('ytQualityMenu')?.classList.remove('open');
    this.renderQualityMenu();
  },

  checkScheduledContent(currentTime){
    const msgs = this.room.chatMessages || [];
    while(this.shownMsgIdx < msgs.length && msgs[this.shownMsgIdx].segundoExibicao <= currentTime){
      const m = msgs[this.shownMsgIdx];
      if(m.ehSuporte) this.pushSupport(m.nomeExibido, m.mensagem);
      else this.pushMsg(m.nomeExibido, m.mensagem);
      this.shownMsgIdx++;
    }
    const sales = this.room.salesNotifications || [];
    while(this.shownSaleIdx < sales.length && sales[this.shownSaleIdx].segundoExibicao <= currentTime){
      this.pushSale(sales[this.shownSaleIdx]);
      this.shownSaleIdx++;
    }
    const offer = this.room.offerConfig;
    if(offer && !this.offerShown && offer.inicioOfertaSegundos != null && currentTime >= offer.inicioOfertaSegundos){
      this.showOfferTab();
    }
  },

  checkHeartbeat(currentTime, duration){
    if(!duration) return;
    const pct = (currentTime / duration) * 100;
    [0, 25, 50, 75, 100].forEach(marco=>{
      if(pct >= marco && !this.heartbeatSent[marco]){
        this.heartbeatSent[marco] = true;
        fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.leadToken },
          body: JSON.stringify({ marco }),
        }).catch(()=>{});
      }
    });
  },

  REACTION_EMOJIS: ['❤️','😄','🎉','😮','💯'],

  ICON_GEAR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  ICON_VOLUME_ON: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.2 8.5a5 5 0 010 7"/><path d="M19 5.5a9 9 0 010 13"/></svg>',
  ICON_VOLUME_MUTED: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/></svg>',

  setupReactions(){
    this.reactionsEnabled = this.room.habilitarReacoes !== false;
    const likeWrap = document.getElementById('pubLikeWrap');
    if(likeWrap) likeWrap.style.display = this.reactionsEnabled ? 'flex' : 'none';
    if(!this._likeMenuOutsideBound){
      this._likeMenuOutsideBound = true;
      document.addEventListener('click', (e)=>{
        const wrap = document.getElementById('pubLikeWrap');
        const menu = document.getElementById('pubLikeMenu');
        if(!wrap || !menu || !menu.classList.contains('open')) return;
        if(!wrap.contains(e.target)) menu.classList.remove('open');
      });
    }
    if(this._reactionTicker) clearInterval(this._reactionTicker);
    if(this.reactionsEnabled){
      this._reactionTicker = setInterval(()=>this.tickReactions(), 700);
    }
  },

  toggleReactionMenu(){
    document.getElementById('pubLikeMenu')?.classList.toggle('open');
  },

  getReactionIntensity(seconds){
    const pts = this.room.reactionKeyframes;
    if(!pts || pts.length === 0) return 0;
    if(seconds <= pts[0].segundo) return pts[0].intensidade;
    const last = pts[pts.length - 1];
    if(seconds >= last.segundo) return last.intensidade;
    for(let i=0;i<pts.length-1;i++){
      const a = pts[i], b = pts[i+1];
      if(seconds >= a.segundo && seconds <= b.segundo){
        const ratio = (seconds - a.segundo) / (b.segundo - a.segundo || 1);
        return a.intensidade + (b.intensidade - a.intensidade) * ratio;
      }
    }
    return 0;
  },

  tickReactions(){
    if(!this.reactionsEnabled || !this.video || this.video.paused) return;
    const intensity = this.getReactionIntensity(this.video.currentTime);
    if(intensity <= 0) return;
    if(Math.random() * 100 < intensity) this.spawnReaction();
    if(intensity > 60 && Math.random() * 100 < (intensity - 60)) this.spawnReaction();
  },

  spawnReaction(emoji){
    const wrap = document.getElementById('pubVideo');
    if(!wrap) return;
    const el = document.createElement('div');
    el.className = 'pub-reaction';
    el.textContent = emoji || this.REACTION_EMOJIS[Math.floor(Math.random() * this.REACTION_EMOJIS.length)];
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
    wrap.appendChild(el);
    setTimeout(()=>el.remove(), 2900);
  },

  sendReaction(emoji){
    document.getElementById('pubLikeMenu')?.classList.remove('open');
    const chosen = emoji || '❤️';
    for(let i=0;i<5;i++){
      setTimeout(()=>this.spawnReaction(chosen), i * 90);
    }
  },

  pushSale(s){
    const box = document.getElementById('saleToast');
    const el = document.createElement('div');
    el.className = 'sale-item';
    el.innerHTML = `<span>🛒</span><span>${escapeHtml(s.nomeExibido)} — ${escapeHtml(s.tituloNotificacao)}</span>`;
    box.appendChild(el);
    setTimeout(()=>el.remove(), 6000);
  },

  tab(t){
    if(t === 'oferta'){ this.openOfferOverlay('offer'); return; }
    this.activeTab = t;
    document.getElementById('tabChat').classList.toggle('active', t === 'chat');
    document.getElementById('tabSuporte').classList.toggle('active', t === 'suporte');
    document.getElementById('pubMsgsChat').style.display = t === 'chat' ? 'flex' : 'none';
    document.getElementById('pubMsgsSuporte').style.display = t === 'suporte' ? 'flex' : 'none';
  },

  // ---------- OFERTA / CHECKOUT (overlay em tela cheia com o vídeo em PiP) ----------
  formatCents(cents){
    return (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  showOfferTab(){
    this.offerShown = true;
    if(!this.room.offerConfig) return;
    const tabBtn = document.getElementById('tabOferta');
    if(tabBtn) tabBtn.style.display = '';
    this.openOfferOverlay('offer');
  },

  offerCardHtml(){
    const cfg = this.room.offerConfig;
    if(!cfg) return '';
    const original = cfg.precoOriginalCentavos
      ? `<div class="offer-original">De ${this.formatCents(cfg.precoOriginalCentavos)}</div>`
      : '';
    return `
      <div class="offer-card">
        ${cfg.imagemDesktopUrl ? `<img src="${escapeHtml(cfg.imagemDesktopUrl)}">` : ''}
        ${cfg.tituloOferta ? `<div class="offer-title">${escapeHtml(cfg.tituloOferta)}</div>` : ''}
        ${original}
        <div class="offer-price">Por ${this.formatCents(cfg.precoOfertaCentavos)}</div>
        <div class="offer-note">Por tempo limitado — Oferta só hoje!</div>
        <button style="background:${cfg.corBotao || '#D93B3B'};" onclick="Sala.onBuyClick()">${escapeHtml(cfg.textoBotao || 'inscreva-se aqui')}</button>
      </div>`;
  },

  onBuyClick(){
    const cfg = this.room.offerConfig;
    if(!cfg || !cfg.linkCheckout) return;
    if(cfg.modoCheckout === 'embutido'){
      this.switchOfferPanel(`<iframe src="${escapeHtml(this.buildCheckoutUrl())}" allow="payment"></iframe>`);
      this.startCheckoutAutoCloseTimer();
    } else {
      window.location.href = cfg.linkCheckout;
    }
  },

  buildCheckoutUrl(){
    const cfg = this.room.offerConfig;
    const base = (cfg && cfg.linkCheckout) || '';
    const lead = this.room.lead || {};
    const params = new URLSearchParams();
    if(lead.nome) params.set('nome', lead.nome);
    if(lead.email) params.set('email', lead.email);
    if(lead.whatsapp) params.set('telefone', lead.whatsapp);
    const qs = params.toString();
    if(!qs) return base;
    return base + (base.includes('?') ? '&' : '?') + qs;
  },

  startCheckoutAutoCloseTimer(){
    clearTimeout(this._checkoutAutoCloseTimer);
    const cfg = this.room.offerConfig;
    const durMs = ((cfg && cfg.checkoutDuracaoSegundos) || 600) * 1000;
    this._checkoutAutoCloseTimer = setTimeout(()=>this.closeOfferOverlay(true), durMs);
  },

  // Troca o conteúdo do painel com um fade suave, sem fechar o overlay nem mexer no PiP do vídeo.
  switchOfferPanel(html){
    const panel = document.getElementById('offerPanelWrap');
    if(!panel) return;
    panel.classList.add('fading');
    setTimeout(()=>{
      panel.innerHTML = html;
      panel.classList.remove('fading');
    }, 220);
  },

  openOfferOverlay(mode){
    const overlay = document.getElementById('offerOverlay');
    const pipWrap = document.getElementById('offerPipWrap');
    const panel = document.getElementById('offerPanelWrap');
    if(!overlay || !pipWrap || !panel) return;

    if(this.video && !pipWrap.contains(this.video)){
      this._videoOriginalParent = this.video.parentElement;
      pipWrap.appendChild(this.video);
    }
    pipWrap.classList.remove('pip-size-pequeno', 'pip-size-grande');
    const pipTamanho = (this.room.offerConfig && this.room.offerConfig.checkoutPipTamanho) || 'medio';
    if(pipTamanho !== 'medio') pipWrap.classList.add('pip-size-' + pipTamanho);
    overlay.classList.add('open');
    document.getElementById('reopenCheckoutBtn')?.classList.remove('blink-show');

    if(mode === 'checkout'){
      panel.innerHTML = `<iframe src="${escapeHtml(this.buildCheckoutUrl())}" allow="payment"></iframe>`;
      this.startCheckoutAutoCloseTimer();
    } else {
      clearTimeout(this._checkoutAutoCloseTimer);
      panel.innerHTML = this.offerCardHtml();
    }
  },

  reopenCheckout(){
    document.getElementById('reopenCheckoutBtn')?.classList.remove('blink-show');
    this.openOfferOverlay('checkout');
  },

  closeOfferOverlay(showReopenBlink){
    const overlay = document.getElementById('offerOverlay');
    if(overlay) overlay.classList.remove('open');
    clearTimeout(this._checkoutAutoCloseTimer);
    if(this.video && this._videoOriginalParent){
      this._videoOriginalParent.appendChild(this.video);
      this._videoOriginalParent = null;
    }
    const panel = document.getElementById('offerPanelWrap');
    if(panel) panel.innerHTML = '';
    if(showReopenBlink) document.getElementById('reopenCheckoutBtn')?.classList.add('blink-show');
  },

  onCheckoutPurchaseConfirmed(){
    this.closeOfferOverlay(false);
    this.pushSale({ nomeExibido: (this.room.lead && this.room.lead.nome) || 'Você', tituloNotificacao: 'Compra confirmada!' });
  },

  hexToRgba(hex, transparenciaPct){
    hex = (hex || '#FFCC00').replace('#', '');
    if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.substring(0,2), 16) || 0;
    const g = parseInt(hex.substring(2,4), 16) || 0;
    const b = parseInt(hex.substring(4,6), 16) || 0;
    const alpha = 1 - (Number(transparenciaPct || 0) / 100);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  pushSupport(nome, txt){
    const box = document.getElementById('pubMsgsChat');
    const bg = this.hexToRgba(this.room.suporteCorDestaque, this.room.suporteCorTransparencia);
    box.insertAdjacentHTML('beforeend', `<div class="pub-chat-support" style="background:${bg};">${escapeHtml(nome)}<br>${escapeHtml(txt)}</div>`);
    box.scrollTop = box.scrollHeight;
  },

  pushMsg(nome, txt, mine){
    const box = document.getElementById('pubMsgsChat');
    box.insertAdjacentHTML('beforeend', `<div class="pub-chat-msg ${mine ? 'mine' : ''}"><span class="name">${escapeHtml(nome)}:</span>${escapeHtml(txt)}</div>`);
    box.scrollTop = box.scrollHeight;
  },

  startSupportPolling(){
    if(this._supportTicker) clearInterval(this._supportTicker);
    this.loadSupportMessages();
    this._supportTicker = setInterval(()=>this.loadSupportMessages(), 4000);
  },

  async loadSupportMessages(){
    if(!this.leadToken) return;
    try{
      const res = await fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/support-messages', {
        headers: { Authorization: 'Bearer ' + this.leadToken },
      });
      if(!res.ok) return;
      const data = await res.json();
      const box = document.getElementById('pubMsgsSuporte');
      if(!box) return;
      if(!data.mensagens || data.mensagens.length === 0){
        box.innerHTML = '<div class="empty-state">Envie uma mensagem privada para o suporte.</div>';
        return;
      }
      const wasNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
      box.innerHTML = data.mensagens.map(m => m.remetente === 'suporte'
        ? `<div class="pub-chat-support">Suporte<br>${escapeHtml(m.mensagem)}</div>`
        : `<div class="pub-chat-msg mine"><span class="name">Você:</span>${escapeHtml(m.mensagem)}</div>`
      ).join('');
      if(wasNearBottom) box.scrollTop = box.scrollHeight;
    }catch(e){}
  },

  async send(){
    const inp = document.getElementById('pubInput');
    const val = inp.value.trim();
    if(!val) return;
    inp.value = '';

    if(this.activeTab === 'suporte'){
      try{
        await fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/support-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.leadToken },
          body: JSON.stringify({ mensagem: val }),
        });
        await this.loadSupportMessages();
      }catch(e){}
      return;
    }

    this.pushMsg('Você', val, true);
    try{
      const res = await fetch('/api/public/webinars/' + encodeURIComponent(this.slug) + '/chat-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.leadToken },
        body: JSON.stringify({ texto: val }),
      });
      const data = await res.json();
      if(data.match){
        setTimeout(()=>{
          this.pushSupport('Suporte', data.resposta.replace('#nome', 'você'));
        }, (data.delaySegundos || 3) * 1000);
      }
    }catch(e){}
  },
};

window.addEventListener('message', (event)=>{
  const data = event.data;
  if(data && data.source === 'e4pay-checkout' && data.event === 'compra_aprovada'){
    Sala.onCheckoutPurchaseConfirmed();
  }
});

document.addEventListener('DOMContentLoaded', ()=>Sala.init());
