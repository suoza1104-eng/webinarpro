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
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-live" style="flex-direction:column;gap:14px;">
        <div class="pub-brand-badge" style="position:static;">⚡ WebnarPRO</div>
        <div style="font-family:var(--font-display);font-size:15px;text-align:center;padding:0 20px;">Esta aula já terminou.</div>
        <a class="btn btn-primary" href="/${encodeURIComponent(this.slug)}/replay">Assistir a gravação</a>
      </div>`;
  },

  beginSession(){
    if(!this.isReplay) localStorage.setItem('wp_start_' + this.slug, String(Date.now()));
    this.startCountdown(this.COUNTDOWN_SECONDS);
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
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-live" style="padding:0;">
        <div class="pub-live-badge">AO VIVO</div>
        <video id="pubVideoEl" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>
      </div>`;

    const el = document.getElementById('pubVideoEl');
    this.video = el;

    if(seekTo > 0){
      this.maxPlayedTime = seekTo;
      el.addEventListener('loadedmetadata', ()=>{ el.currentTime = Math.min(seekTo, el.duration || seekTo); }, { once: true });
    }

    if(el.canPlayType('application/vnd.apple.mpegurl')){
      el.src = cfg.url;
    } else if(window.Hls && Hls.isSupported()){
      const hls = new Hls();
      hls.loadSource(cfg.url);
      hls.attachMedia(el);
    } else {
      el.src = cfg.url;
    }

    el.onclick = ()=>{ if(el.paused) el.play().catch(()=>{}); else el.pause(); };

    if(cfg.bloquearAvancoVideo){
      el.addEventListener('seeking', ()=>{
        if(el.currentTime > this.maxPlayedTime + 1.5) el.currentTime = this.maxPlayedTime;
      });
    }

    el.addEventListener('timeupdate', ()=>{
      if(el.currentTime > this.maxPlayedTime) this.maxPlayedTime = el.currentTime;
      this.checkScheduledContent(el.currentTime);
      this.checkHeartbeat(el.currentTime, el.duration);
    });

    if(cfg.autoplay || seekTo > 0){
      el.play().catch(()=>{ /* navegador bloqueou autoplay — visitante clica no vídeo pra iniciar */ });
    }
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
