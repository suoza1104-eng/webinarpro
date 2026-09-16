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

    if(this.leadToken){
      const ok = await this.loadRoom();
      if(ok) return;
    }
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
        body: JSON.stringify({ nome, email, whatsapp: whatsapp || undefined, empresa: empresa || undefined }),
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
        return false;
      }
      this.room = await res.json();
    }catch(e){
      return false;
    }

    document.getElementById('publicPage').style.display = 'block';
    document.getElementById('pubMsgsSuporte').innerHTML = '<div class="empty-state">Envie uma mensagem privada para o suporte.</div>';

    if(this.isReplay){
      this.showCover();
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

  showCover(){
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-cover" onclick="Sala.beginSession()">
        <div class="pub-play-btn"><svg viewBox="0 0 24 24"><path d="M9 7l9 5-9 5V7z"/></svg></div>
        <div class="pub-cover-text">SUA AULA JÁ COMEÇOU<span>CLIQUE PARA ASSISTIR</span></div>
      </div>`;
  },

  showEnded(){
    if(this._countdown) clearInterval(this._countdown);
    if(this._ytTicker) clearInterval(this._ytTicker);
    const apresentador = this.info?.nomeApresentador;
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-live" style="flex-direction:column;gap:10px;">
        <div class="pub-brand-badge" style="position:static;">⚡ WebnarPRO</div>
        <div style="font-family:var(--font-display);font-size:18px;text-align:center;padding:0 20px;">A aula chegou ao fim</div>
        <div style="font-size:12.5px;color:var(--text-dim);text-align:center;padding:0 20px;">
          Obrigado por assistir${apresentador ? ' até aqui com ' + escapeHtml(apresentador) : ''}!
        </div>
        ${this.isReplay ? '' : `<a class="btn btn-primary" style="margin-top:8px;" href="/${encodeURIComponent(this.slug)}/replay">Assistir novamente</a>`}
      </div>`;
  },

  beginSession(){
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

  getUnlockedTime(currentTimeOverride){
    const cfg = this.room.video;
    const duration = cfg.duracaoSegundos || (this.video && this.video.duration) || 0;
    if(this.isReplay) return duration || Infinity;

    const elapsed = this.sessionStartedAt
      ? Math.max(0, (Date.now() - this.sessionStartedAt) / 1000 - this.COUNTDOWN_SECONDS)
      : 0;
    const liveEdge = duration ? Math.min(elapsed, duration) : elapsed;
    const X = cfg.bloqueioSegundo;
    if(X == null) return liveEdge;

    const currentTime = currentTimeOverride != null ? currentTimeOverride : (this.video ? this.video.currentTime : 0);
    if(currentTime >= X - 0.25) return duration ? Math.max(currentTime, Math.min(X, duration)) : Math.max(currentTime, X);
    return Math.min(liveEdge, X);
  },

  startCountdown(initialSecs){
    if(this.room?.video?.fullscreen){
      try{ document.documentElement.requestFullscreen?.(); }catch(e){}
    }
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
          <div class="pub-brand-badge">⚡ WebnarPRO</div>
        </div>`;
    };
    render();
    this._countdown = setInterval(()=>{
      secs--;
      if(secs <= 0){ clearInterval(this._countdown); this.startLive(0); return; }
      render();
    }, 1000);
  },

  startLive(seekTo){
    if(!this.room.video){
      document.getElementById('pubVideo').innerHTML = `<div class="pub-live"><div class="pub-brand-badge">⚡ WebnarPRO</div>Vídeo ainda não configurado para este webinar.</div>`;
      return;
    }
    const cfg = this.room.video;
    if(this._ytTicker) clearInterval(this._ytTicker);

    if(cfg.modoYoutube){
      document.getElementById('pubVideo').innerHTML = `
        <div class="yt-wrap">
          <video id="pubVideoEl" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>
          <div class="yt-controls" id="ytControls">
            <div class="yt-scrub" id="ytScrub">
              <div class="yt-scrub-track"></div>
              <div class="yt-scrub-unlocked" id="ytUnlocked"></div>
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
              <button class="yt-btn" id="ytMuteBtn" onclick="Sala.ytToggleMute()">🔊</button>
              <input type="range" class="yt-volume" id="ytVolume" min="0" max="1" step="0.05" value="1" oninput="Sala.ytSetVolume(this.value)">
            </div>
          </div>
        </div>`;
    } else {
      document.getElementById('pubVideo').innerHTML = `
        <div class="pub-live" style="padding:0;">
          <div class="pub-live-badge">AO VIVO</div>
          <video id="pubVideoEl" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>
          <div style="position:absolute;bottom:8px;right:10px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.5);border-radius:6px;padding:4px 8px;">
            <button class="yt-btn" id="ytMuteBtn" onclick="Sala.ytToggleMute()">🔊</button>
            <input type="range" class="yt-volume" id="ytVolume" min="0" max="1" step="0.05" value="1" oninput="Sala.ytSetVolume(this.value)">
          </div>
        </div>`;
    }

    const el = document.getElementById('pubVideoEl');
    this.video = el;

    if(seekTo > 0){
      this.maxPlayedTime = seekTo;
      el.addEventListener('loadedmetadata', ()=>{ el.currentTime = Math.min(seekTo, el.duration || seekTo); }, { once: true });
    }

    if(el.canPlayType('application/vnd.apple.mpegurl')){
      el.src = cfg.url;
    } else if(window.Hls && Hls.isSupported()){
      this.hls = new Hls();
      this.hls.loadSource(cfg.url);
      this.hls.attachMedia(el);
    } else {
      el.src = cfg.url;
    }

    this.userPaused = false;
    el.onclick = ()=>{
      if(el.paused){ this.userPaused = false; el.play().catch(()=>{}); }
      else { this.userPaused = true; el.pause(); }
    };
    el.onpause = ()=>{ if(!document.hidden) this.userPaused = true; };
    el.onplay = ()=>{ this.userPaused = false; };

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
          const newPos = rcfg?.modoYoutube ? this.getUnlockedTime(this._posAtHidden) : this._posAtHidden + hiddenSecs;
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
        const max = this.getUnlockedTime();
        if(el.currentTime > max + 0.5) el.currentTime = max;
      });
      el.addEventListener('ratechange', ()=>{
        if(el.playbackRate !== 1 && el.currentTime >= this.getUnlockedTime() - 0.4) el.playbackRate = 1;
      });
      this.setupYoutubeControls(el, cfg);
    } else if(cfg.bloquearAvancoVideo){
      el.addEventListener('seeking', ()=>{
        if(el.currentTime > this.maxPlayedTime + 1.5) el.currentTime = this.maxPlayedTime;
      });
    }

    el.addEventListener('timeupdate', ()=>{
      if(el.currentTime > this.maxPlayedTime) this.maxPlayedTime = el.currentTime;
      this.checkScheduledContent(el.currentTime);
      this.checkHeartbeat(el.currentTime, el.duration);
    });

    el.addEventListener('ended', ()=>this.showEnded());
    el.addEventListener('volumechange', ()=>this.syncVolumeUI());
    this.syncVolumeUI();

    if(cfg.autoplay || seekTo > 0){
      el.play().catch(()=>{ /* navegador bloqueou autoplay — visitante clica no vídeo pra iniciar */ });
    }
  },

  syncVolumeUI(){
    if(!this.video) return;
    const muteBtn = document.getElementById('ytMuteBtn');
    const vol = document.getElementById('ytVolume');
    if(muteBtn) muteBtn.textContent = (this.video.muted || this.video.volume === 0) ? '🔇' : '🔊';
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
      const duration = cfg.duracaoSegundos || el.duration || 0;
      const target = Math.min(frac * duration, this.getUnlockedTime());
      el.currentTime = target;
    };
    let dragging = false;
    scrub.addEventListener('mousedown', (e)=>{ dragging = true; seekFromEvent(e); });
    window.addEventListener('mousemove', (e)=>{ if(dragging) seekFromEvent(e); });
    window.addEventListener('mouseup', ()=>{ dragging = false; });
    scrub.addEventListener('touchstart', (e)=>seekFromEvent(e.touches[0]));
    scrub.addEventListener('touchmove', (e)=>seekFromEvent(e.touches[0]));

    const wrap = document.querySelector('.yt-wrap');
    let hideTimer;
    const showControls = ()=>{
      wrap.classList.add('yt-show');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(()=>{ if(!el.paused) wrap.classList.remove('yt-show'); }, 3000);
    };
    wrap.addEventListener('mousemove', showControls);
    wrap.addEventListener('mouseenter', showControls);
    showControls();

    this._ytTicker = setInterval(()=>this.ytTick(), 300);
    this.ytTick();
  },

  ytTick(){
    const el = this.video;
    if(!el) return;
    const cfg = this.room.video;
    const duration = cfg.duracaoSegundos || el.duration || 0;
    const unlocked = this.getUnlockedTime();

    const unlockedEl = document.getElementById('ytUnlocked');
    const playedEl = document.getElementById('ytPlayed');
    const thumbEl = document.getElementById('ytThumb');
    const timeEl = document.getElementById('ytTime');
    const liveBtn = document.getElementById('ytLiveBtn');
    if(!unlockedEl || !duration) return;

    const unlockedPct = Math.min(100, (unlocked / duration) * 100);
    const playedPct = Math.min(100, (el.currentTime / duration) * 100);
    unlockedEl.style.width = unlockedPct + '%';
    playedEl.style.width = playedPct + '%';
    thumbEl.style.left = playedPct + '%';
    timeEl.textContent = this.formatTime(el.currentTime) + ' / ' + this.formatTime(unlocked);

    const atEdge = el.currentTime >= unlocked - 0.4;
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
    this.video.currentTime = this.getUnlockedTime();
    this.video.playbackRate = 1;
    if(this.video.paused) this.video.play().catch(()=>{});
  },

  ytSetSpeed(s){
    if(!this.video) return;
    if(s > 1 && this.video.currentTime >= this.getUnlockedTime() - 0.4) return;
    this.video.playbackRate = s;
    document.getElementById('ytSpeedMenu').classList.remove('open');
  },

  ytToggleSpeedMenu(){
    document.getElementById('ytSpeedMenu').classList.toggle('open');
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

  pushSale(s){
    const box = document.getElementById('saleToast');
    const el = document.createElement('div');
    el.className = 'sale-item';
    el.innerHTML = `<span>🛒</span><span>${escapeHtml(s.nomeExibido)} — ${escapeHtml(s.tituloNotificacao)}</span>`;
    box.appendChild(el);
    setTimeout(()=>el.remove(), 6000);
  },

  tab(t){
    this.activeTab = t;
    document.getElementById('tabChat').classList.toggle('active', t === 'chat');
    document.getElementById('tabSuporte').classList.toggle('active', t === 'suporte');
    document.getElementById('pubMsgsChat').style.display = t === 'chat' ? 'flex' : 'none';
    document.getElementById('pubMsgsSuporte').style.display = t === 'suporte' ? 'flex' : 'none';
  },

  pushSupport(nome, txt){
    const box = document.getElementById('pubMsgsChat');
    box.insertAdjacentHTML('beforeend', `<div class="pub-chat-support">${escapeHtml(nome)}<br>${escapeHtml(txt)}</div>`);
    box.scrollTop = box.scrollHeight;
  },

  pushMsg(nome, txt, mine){
    const box = document.getElementById('pubMsgsChat');
    box.insertAdjacentHTML('beforeend', `<div class="pub-chat-msg ${mine ? 'mine' : ''}"><span class="name">${escapeHtml(nome)}:</span>${escapeHtml(txt)}</div>`);
    box.scrollTop = box.scrollHeight;
  },

  async send(){
    const inp = document.getElementById('pubInput');
    const val = inp.value.trim();
    if(!val) return;
    inp.value = '';

    if(this.activeTab === 'suporte'){
      const box = document.getElementById('pubMsgsSuporte');
      if(box.querySelector('.empty-state')) box.innerHTML = '';
      box.insertAdjacentHTML('beforeend', `<div class="pub-chat-msg mine"><span class="name">Você:</span>${escapeHtml(val)}</div>`);
      box.scrollTop = box.scrollHeight;
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

document.addEventListener('DOMContentLoaded', ()=>Sala.init());
