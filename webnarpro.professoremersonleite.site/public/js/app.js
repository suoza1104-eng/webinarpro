/* =========================================================================
   WebnarPRO — protótipo de front-end navegável (100% client-side / mock)
   ========================================================================= */
const ICONS = {
  dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  webinars:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5v-7z" fill="currentColor" stroke="none"/></svg>',
  ab:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2v6l-5 9a2 2 0 002 3h12a2 2 0 002-3l-5-9V2"/><line x1="9" y1="2" x2="15" y2="2"/></svg>',
  paginas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="20"/></svg>',
  videos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l6-3.5v11L15 14v-4z"/></svg>',
  salas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13a8 8 0 0116 0"/><rect x="2" y="13" width="4" height="7" rx="1.5"/><rect x="18" y="13" width="4" height="7" rx="1.5"/></svg>',
  historico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  usuarios:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.5" cy="9" r="2.3"/><path d="M15.3 14.3c2.6.4 4.7 2.6 4.7 5.2"/></svg>',
  config:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  plano:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.3 9.3c0-1.3 1.2-1.9 2.7-1.9s2.7.7 2.7 1.9c0 1.4-1.4 1.8-2.7 2.2c-1.5.4-2.7 1-2.7 2.4 0 1.3 1.2 1.9 2.7 1.9s2.7-.6 2.7-1.9"/></svg>',
  simulador:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="15.5" r="1" fill="currentColor" stroke="none"/></svg>',
  ajuda:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".4" fill="currentColor" stroke="none"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 12l2.3-2.3"/><path d="M7.5 11.5L5.3 13.7a3 3 0 004.2 4.2l2.2-2.2"/><path d="M16.5 12.5l2.2-2.2a3 3 0 00-4.2-4.2l-2.2 2.2"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l.7-3 11-11a1.7 1.7 0 012.4 0l1 1a1.7 1.7 0 010 2.4l-11 11-3 .6z"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="19" y1="20" x2="19" y2="15"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>',
  more:'<svg viewBox="0 0 24 24"><circle cx="12" cy="5.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3"/><path d="M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.7"/></svg>',
  eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.6 10.6a2.7 2.7 0 003.8 3.8"/><path d="M9.9 5.1A10.4 10.4 0 0112 5c6 0 10 7 10 7a13.5 13.5 0 01-3.1 3.9M6.4 6.4C4 8 2 12 2 12s2.5 4.5 6.6 6.2"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12.5l5 5L20 6"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="6" y1="3" x2="6" y2="21"/><path d="M6 4h11l-3 4 3 4H6"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="16" height="12" rx="2"/><path d="M8 7l6 3-6 3V7z" fill="currentColor" stroke="none"/></svg>',
  login:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6"/><path d="M3 12h12M11 8l4 4-4 4"/></svg>',
  vid2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l6-3.5v11L15 14v-4z"/></svg>',
  offer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="7" width="16" height="12" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v11H8l-4 4V4z"/></svg>',
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M3 4h2l2.4 12h10.2L20 8H6"/></svg>',
  audience:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.5" cy="9" r="2.3"/></svg>',
  integ:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 12l2.3-2.3"/><path d="M7.5 11.5L5.3 13.7a3 3 0 004.2 4.2l2.2-2.2"/><path d="M16.5 12.5l2.2-2.2a3 3 0 00-4.2-4.2l-2.2 2.2"/></svg>',
  bot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="4" x2="12" y2="8"/><circle cx="12" cy="3" r="1"/></svg>',
  ai:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l1.8 4.6L18 8l-4.2 1.4L12 14l-1.8-4.6L6 8l4.2-1.4z"/><circle cx="18" cy="18" r="2.4"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  rocket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2c3 3 4 7 4 10-1 1-2 2-4 2s-3-1-4-2c0-3 1-7 4-10z"/><path d="M9 14l-3 3 1 4 4-1"/><path d="M15 14l3 3-1 4-4-1"/></svg>',
  upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/></svg>'
};

const NAV = [
  {id:'dashboard', label:'Dashboard', ico:'dashboard'},
  {id:'webinars',  label:'Webinars',  ico:'webinars'},
  {id:'ab',        label:'Teste A/B', ico:'ab'},
  {id:'paginas',   label:'Páginas',   ico:'paginas', locked:true},
  {id:'videos',    label:'Vídeos',    ico:'videos'},
  {id:'salas',     label:'Salas de Atendimento', ico:'salas'},
  {id:'historico', label:'Histórico de ações', ico:'historico'},
  {id:'usuarios',  label:'Usuários',  ico:'usuarios'},
  {id:'config',    label:'Configurações', ico:'config'},
  {id:'plano',     label:'Meu plano', ico:'plano', locked:true},
  {id:'simulador', label:'Simulador de Custo', ico:'simulador'},
  {id:'ajuda',     label:'Ajuda', ico:'ajuda'}
];

const WIZ_STEPS = [
  {label:'Início', ico:'flag'}, {label:'Webinar', ico:'play'}, {label:'Login', ico:'login'},
  {label:'Vídeo', ico:'vid2'}, {label:'Oferta', ico:'offer'}, {label:'Chat', ico:'chat'},
  {label:'Vendas', ico:'cart'}, {label:'Audiência', ico:'audience'}, {label:'Integrações', ico:'integ'},
  {label:'Chatbot', ico:'bot'}, {label:'Sino / IA', ico:'ai'}, {label:'Validação', ico:'shield'},
  {label:'Pronto', ico:'rocket'}
];

function loadLS(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
}
function saveLS(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
}
function escapeHtmlAdmin(str){
  return String(str ?? '').replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const App = {
  currentView:'dashboard',
  token: localStorage.getItem('wp_token') || null,
  webinars: [],
  videos: [],
  users: loadLS('wp_users_v2', []),
  historico: [],
  chatMsgs: loadLS('wp_chatmsgs_v2', []),
  faqs: [
    {q:'Serve para quadro trifásico?', a:'Sim, o método vale para mono e trifásico.'},
    {q:'Tem certificado?', a:'Sim, certificado incluso na Comunidade FERA.'}
  ],
  wizIntegState: {'Active Campaign':false,'ManyChat':true,'Kommo':false,'VK Metrics':false,'Sellflux':false,'Keap':false},
  planTiers: [
    {name:'Start', price:'R$ 197,00', storage:'25 GB', banda:'400 GB', tokens:'1.000'},
    {name:'Growth', price:'R$ 297,00', storage:'80 GB', banda:'1.5 TB', tokens:'4.000'},
    {name:'Ilimitado', price:'R$ 397,00', storage:'Ilimitado', banda:'Ilimitada', tokens:'12.000'}
  ],
  planIdx: 1,
  wz:{step:0, nome:'', titulo:'', url:'', apresentador:'', tipo:'Único', duracao:150, espectadores:500, produto:'Comunidade FERA', preco:'R$ 997,00', video:null, startMode:'immediate', audienceType:'dinamica'},

  // ---------- BOOT / AUTENTICAÇÃO ----------
  currentUser: null,

  async init(){
    this.wireGlobalUI();
    this.setupPasswordToggles();
    if(!this.token){
      const refreshed = await this.tryRefresh();
      if(!refreshed){ this.showLogin(); return; }
    }
    try{
      if(!this.currentUser) this.currentUser = await this.apiFetch('/api/auth/me');
      await this.loadWebinars();
      await this.loadVideos();
      await this.loadAbTests();
    }catch(e){
      this.showLogin();
      return;
    }
    this.applyCurrentUserToUI();
    this.hideLogin();
    this.renderApp();
  },

  setupPasswordToggles(){
    document.querySelectorAll('input[type="password"]').forEach(input=>{
      if(input.dataset.pwToggled) return;
      input.dataset.pwToggled = '1';
      const wrap = document.createElement('div');
      wrap.className = 'password-field';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pw-toggle';
      btn.innerHTML = ICONS.eye;
      btn.onclick = ()=>{
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? ICONS.eyeOff : ICONS.eye;
      };
      wrap.appendChild(btn);
    });
  },

  applyCurrentUserToUI(){
    if(!this.currentUser) return;
    const nameEl = document.querySelector('.u-name');
    const roleEl = document.querySelector('.u-role');
    if(nameEl) nameEl.textContent = this.currentUser.nome;
    if(roleEl) roleEl.textContent = this.currentUser.tipo === 'administrador' ? 'Administrador' : 'Atendente';
  },

  async tryRefresh(){
    try{
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if(!res.ok) return false;
      const data = await res.json();
      this.token = data.accessToken;
      this.currentUser = data.user;
      localStorage.setItem('wp_token', this.token);
      return true;
    }catch(e){
      return false;
    }
  },

  renderApp(){
    this.initTheme();
    this.renderNav();
    this.renderWebinars();
    this.renderDashboard();
    this.renderVideos();
    this.renderAbTests();
    this.renderSalasPicker();
    this.renderHistorico();
    this.renderUsers();
    this.renderConfigInteg();
    this.renderPlan();
    this.buildStepper();
    this.buildChatList();
    this.buildVideoPickGrid();
    this.renderLoginPreview();
    this.renderSalesList();
    this.renderKeywords();
    this.renderOfertaPreview();
    this.calcSim();
    this.showView('dashboard');
    this.startPendentesBadge();
    if(this.currentUser?.tipo === 'administrador') SysAlerts.start();
  },

  showLogin(){
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appShell').style.display = 'none';
  },
  hideLogin(){
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
  },

  async doLogin(){
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const lembrar = document.getElementById('loginLembrar').checked;
    const errEl = document.getElementById('loginError');
    errEl.style.display = 'none';
    if(!email || !senha){ errEl.textContent = 'Preencha e-mail e senha.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('loginSubmitBtn');
    btn.disabled = true; btn.textContent = 'Entrando...';
    try{
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, lembrar }),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Falha no login');

      this.token = data.accessToken;
      this.currentUser = data.user;
      localStorage.setItem('wp_token', this.token);
      this.applyCurrentUserToUI();

      await this.loadWebinars();
      await this.loadVideos();
      this.hideLogin();
      this.renderApp();
    }catch(e){
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }finally{
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  },

  async logout(){
    try{ await fetch('/api/auth/logout', { method: 'POST' }); }catch(e){}
    localStorage.removeItem('wp_token');
    this.token = null;
    this.currentUser = null;
    this.showLogin();
  },

  async apiFetch(path, opts={}, _retried){
    const headers = Object.assign({}, opts.headers);
    if(!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if(this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    if(res.status === 401){
      if(!_retried && await this.tryRefresh()) return this.apiFetch(path, opts, true);
      this.logout();
      throw new Error('Sessão expirada — faça login novamente');
    }
    let data = null;
    try{ data = await res.json(); }catch(e){}
    if(!res.ok){
      const msg = data && typeof data.error === 'string' ? data.error : 'Erro na requisição';
      throw new Error(msg);
    }
    return data;
  },

  openProfile(){
    document.getElementById('profileError').style.display = 'none';
    document.getElementById('profileSuccess').style.display = 'none';
    document.getElementById('profileSenhaAtual').value = '';
    document.getElementById('profileSenhaNova').value = '';
    document.getElementById('profileSenhaConfirma').value = '';
    document.getElementById('profileNome').value = this.currentUser?.nome || '';
    document.getElementById('profileEmail').value = this.currentUser?.email || '';
    document.getElementById('profileModal').classList.add('open');
  },
  closeProfile(){
    document.getElementById('profileModal').classList.remove('open');
  },
  async changePassword(){
    const errEl = document.getElementById('profileError');
    const okEl = document.getElementById('profileSuccess');
    errEl.style.display = 'none';
    okEl.style.display = 'none';

    const senhaAtual = document.getElementById('profileSenhaAtual').value;
    const novaSenha = document.getElementById('profileSenhaNova').value;
    const confirma = document.getElementById('profileSenhaConfirma').value;

    if(!senhaAtual || !novaSenha){ errEl.textContent = 'Preencha a senha atual e a nova senha.'; errEl.style.display = 'block'; return; }
    if(novaSenha !== confirma){ errEl.textContent = 'A confirmação não bate com a nova senha.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('profileSaveBtn');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try{
      await this.apiFetch('/api/auth/password', { method: 'PUT', body: JSON.stringify({ senhaAtual, novaSenha }) });
      okEl.textContent = 'Senha alterada com sucesso!';
      okEl.style.display = 'block';
      document.getElementById('profileSenhaAtual').value = '';
      document.getElementById('profileSenhaNova').value = '';
      document.getElementById('profileSenhaConfirma').value = '';
    }catch(e){
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }finally{
      btn.disabled = false; btn.textContent = 'Salvar nova senha';
    }
  },

  async loadWebinars(){
    const rows = await this.apiFetch('/api/webinars');
    const statusMap = { rascunho:'Rascunho', ativo:'Ativo', pausado:'Pausado', finalizado:'Finalizado' };
    this.webinars = rows.map(w=>({
      id: w.id, slug: w.slug, nome: w.nome, titulo: w.titulo,
      data: w.criado_em ? new Date(w.criado_em).toLocaleDateString('pt-BR') : '—',
      status: statusMap[w.status] || w.status,
      tipo: 'Único',
    }));
  },

  async loadVideos(){
    const rows = await this.apiFetch('/api/videos');
    this.videos = rows.map(v=>({
      id: Number(v.id), nome: v.nome_arquivo,
      data: v.criado_em ? new Date(v.criado_em).toLocaleString('pt-BR') : '—',
      tamanho: v.tamanho_bytes ? (v.tamanho_bytes / 1e9).toFixed(2) + ' GB' : '—',
      status: v.status_processamento,
      thumbnailUrl: v.thumbnail_url || null,
      duracaoSegundos: v.duracao_segundos || null,
      playbackUrl: v.playback_url || null,
    }));
  },
  formatVideoDuration(segundos){
    if(!segundos) return null;
    const h = Math.floor(segundos / 3600), m = Math.floor((segundos % 3600) / 60), s = Math.floor(segundos % 60);
    const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2,'0')}:${ss}` : `${mm}:${ss}`;
  },
  openVideoPreview(videoId){
    const v = this.videos.find(x=>x.id===Number(videoId));
    if(!v || !v.playbackUrl) { this.toast('Vídeo ainda não está pronto para prévia.'); return; }
    document.getElementById('videoPreviewTitle').textContent = v.nome;
    document.getElementById('videoPreviewModal').classList.add('open');
    const el = document.getElementById('videoPreviewEl');
    el.poster = v.thumbnailUrl || '';
    if(this._previewHls){ this._previewHls.destroy(); this._previewHls = null; }
    if(el.canPlayType('application/vnd.apple.mpegurl')){
      el.src = v.playbackUrl;
    } else if(window.Hls && Hls.isSupported()){
      this._previewHls = new Hls();
      this._previewHls.loadSource(v.playbackUrl);
      this._previewHls.attachMedia(el);
    } else {
      el.src = v.playbackUrl;
    }
    el.play().catch(()=>{});
  },
  closeVideoPreview(){
    document.getElementById('videoPreviewModal').classList.remove('open');
    const el = document.getElementById('videoPreviewEl');
    el.pause();
    el.removeAttribute('src');
    el.load();
    if(this._previewHls){ this._previewHls.destroy(); this._previewHls = null; }
  },

  wireGlobalUI(){
    document.getElementById('videoFileInput').onchange = (e)=>{
      const file = e.target.files[0];
      if(file) this.uploadVideoFile(file);
      e.target.value = '';
    };
    document.getElementById('loginSenha').addEventListener('keydown', (e)=>{
      if(e.key === 'Enter') this.doLogin();
    });
    document.getElementById('collapseBtn').onclick = ()=>{
      document.getElementById('sidebar').classList.toggle('collapsed');
      document.getElementById('main').classList.toggle('sidebar-collapsed');
    };
    document.getElementById('hamburgerBtn').onclick = ()=>{
      document.getElementById('sidebar').classList.toggle('mobile-open');
    };
    document.getElementById('bellBtn').onclick = (e)=>{
      e.stopPropagation();
      document.getElementById('notifPanel').classList.toggle('open');
    };
    document.addEventListener('click', ()=>document.getElementById('notifPanel').classList.remove('open'));
  },

  renderNav(){
    const ul = document.getElementById('navList');
    ul.innerHTML = NAV.map(n=>{
      if(n.locked){
        return `<li class="nav-item locked" data-view="${n.id}" title="Bloqueado nesta versão" onclick="App.toast('Bloqueado por enquanto — volta quando o WebnarPRO tiver planos por licença')">${ICONS[n.ico]}<span class="nav-label">${n.label}</span><span class="nav-lock">${ICONS.lock}</span></li>`;
      }
      const badge = n.id === 'salas' ? '<span class="nav-badge" id="navBadge-salas" style="display:none;"></span>' : '';
      return `<li class="nav-item" data-view="${n.id}" onclick="App.showView('${n.id}')">${ICONS[n.ico]}<span class="nav-label">${n.label}</span>${badge}</li>`;
    }).join('');
  },
  initTheme(){
    let theme = null;
    try{ theme = localStorage.getItem('wp_theme'); }catch(e){}
    if(!theme){
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
    this.applyThemeIcon(theme);
  },
  toggleTheme(){
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try{ localStorage.setItem('wp_theme', next); }catch(e){}
    this.applyThemeIcon(next);
  },
  applyThemeIcon(theme){
    const btn = document.getElementById('themeBtn');
    if(btn) btn.innerHTML = theme === 'light' ? ICONS.moon : ICONS.sun;
  },

  showView(id){
    this.currentView = id;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===id));
    document.getElementById('sidebar').classList.remove('mobile-open');
    window.scrollTo(0,0);
    this.stopSalasTimers();
    if(id !== 'wizard') this.simClose();
    if(id === 'salas'){
      document.getElementById('salasQueue').style.display = 'none';
      document.getElementById('salasPicker').style.display = 'block';
      this.salasWebinarId = null;
      this.salasSelectedId = null;
      this.renderSalasPicker();
    }
  },

  toast(msg){
    const t = document.getElementById('toast');
    t.innerHTML = `${ICONS.check}<span>${msg}</span>`;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
  },

  // ---------- DASHBOARD ----------
  renderDashboard(){
    const tb = document.getElementById('dashUpcoming');
    tb.innerHTML = this.webinars.slice(0,3).map(w=>`
      <tr><td>${w.nome}</td><td>${w.data}</td><td>${this.statusBadge(w.status)}</td></tr>
    `).join('');
    this.loadDashboardStats();
  },

  async loadDashboardStats(){
    let d;
    try{
      d = await this.apiFetch('/api/webinars/dashboard');
    }catch(e){
      return;
    }
    const num = (n)=>(n||0).toLocaleString('pt-BR');
    const brl = (c)=>((c||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    const set = (id, txt)=>{ const el = document.getElementById(id); if(el) el.textContent = txt; };

    set('dashAtivos', num(d.webinarsAtivos));
    set('dashAtivosSub', d.sessoes.length ? `${d.sessoes.length} sessão(ões) realizada(s)` : 'Nenhuma sessão realizada');
    set('dashEspectadores', num(d.espectadores7d));
    set('dashEspectadoresSub', 'Assistiram ao vivo ou replay');
    set('dashConversao', d.assistiram30d > 0 ? ((d.compradores30d / d.assistiram30d) * 100).toFixed(1).replace('.', ',') + '%' : '—');
    set('dashConversaoSub', `${num(d.compradores30d)} compradores de ${num(d.assistiram30d)} ao vivo (30 dias)`);
    set('dashFaturamento', brl(d.faturamentoMesCentavos));
    set('dashFaturamentoSub', `${num(d.vendasMes)} venda(s) aprovada(s) no mês`);

    const ctx = document.getElementById('dashChart');
    const empty = document.getElementById('dashChartEmpty');
    if(this._dashChart){ this._dashChart.destroy(); this._dashChart = null; }
    if(!ctx || !window.Chart) return;
    if(d.sessoes.length === 0){
      ctx.style.display = 'none';
      empty.style.display = 'flex';
      return;
    }
    ctx.style.display = 'block';
    empty.style.display = 'none';
    const sessoes = d.sessoes;
    this._dashChart = new Chart(ctx, {
      type:'line',
      data:{ labels: sessoes.map(s=>new Date(s.dataInicio).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})),
        datasets:[{ label:'Espectadores', data: sessoes.map(s=>s.espectadores),
          borderColor:'#FFCC00', backgroundColor:'rgba(255,204,0,.12)', tension:.35, fill:true, pointRadius:4, pointBackgroundColor:'#FFCC00'}]},
      options:{ plugins:{legend:{display:false}, tooltip:{ displayColors:false, callbacks:{
          title: (items)=>sessoes[items[0].dataIndex].nome,
          label: (item)=>{
            const s = sessoes[item.dataIndex];
            const conv = s.espectadores > 0 ? ` (${((s.compradores / s.espectadores) * 100).toFixed(1).replace('.', ',')}%)` : '';
            return [`${num(s.espectadores)} assistiram ao vivo`, `${num(s.compradores)} compraram${conv}`];
          },
        }}},
        scales:{
          x:{grid:{color:'#232320'}, ticks:{color:'#a6a59a'}},
          y:{beginAtZero:true, grid:{color:'#232320'}, ticks:{color:'#a6a59a', precision:0}}
        }, maintainAspectRatio:false }
    });
  },

  statusBadge(s){
    const map = {'Ativo':'badge-green','Pausado':'badge-yellow','Finalizado':'badge-grey'};
    return `<span class="badge ${map[s]||'badge-grey'}">${s}</span>`;
  },
  tipoBadge(t){
    const map = {'Único':'badge-blue','Recorrente':'badge-yellow','Automático':'badge-green'};
    return `<span class="badge ${map[t]||'badge-grey'}">${t}</span>`;
  },

  // ---------- WEBINARS ----------
  renderWebinars(){
    const search = (document.getElementById('webSearch')||{}).value?.toLowerCase() || '';
    const statusF = (document.getElementById('webStatusFilter')||{}).value || '';
    const typeF = (document.getElementById('webTypeFilter')||{}).value || '';
    const list = this.webinars.filter(w=>
      (!search || w.nome.toLowerCase().includes(search)) &&
      (!statusF || w.status===statusF) &&
      (!typeF || w.tipo===typeF)
    );
    const tb = document.getElementById('webinarsTbody');
    tb.innerHTML = list.map((w,i)=>`
      <tr>
        <td><div class="row-thumb"><div class="thumb">${w.nome.slice(0,3).toUpperCase()}</div>
          <div><div class="row-title">${w.nome}</div><div class="row-sub">${w.data}</div></div></div></td>
        <td>${this.statusBadge(w.status)}</td>
        <td>${this.tipoBadge(w.tipo)}</td>
        <td><div class="iconbar" style="justify-content:flex-end;">
          <button title="Links do webinar" onclick="App.openLinksModal('${w.slug}')">${ICONS.link}</button>
          <button title="Editar" onclick="App.editWebinar(${this.webinars.indexOf(w)})">${ICONS.edit}</button>
          <button title="Métricas" onclick="App.openMetrics(${w.id})">${ICONS.chart}</button>
          <button title="Ver como aluno" onclick="App.openPublic(${this.webinars.indexOf(w)})">${ICONS.globe}</button>
          <button title="Duplicar" onclick="App.dupWebinar(${this.webinars.indexOf(w)})">${ICONS.copy}</button>
          <button title="Excluir" onclick="App.delWebinar(${this.webinars.indexOf(w)})">${ICONS.trash}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="4"><div class="empty-state">Nenhum webinar encontrado.</div></td></tr>`;
    document.getElementById('webinarsCount').textContent = `Total de registros: ${list.length}`;
  },
  secondsToTime(secs){
    secs = Math.max(0, Math.round(Number(secs) || 0));
    const hh = String(Math.floor(secs/3600)).padStart(2,'0');
    const mm = String(Math.floor((secs%3600)/60)).padStart(2,'0');
    const ss = String(secs%60).padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  },
  // Igual secondsToTime, mas preserva o sinal — usado no eixo do gráfico de retenção,
  // onde segundos negativos representam o trecho antes da live começar.
  formatRetencaoLabel(secs){
    secs = Math.round(Number(secs) || 0);
    return (secs < 0 ? '-' : '') + this.secondsToTime(Math.abs(secs));
  },
  isoToLocalDateTimeInput(iso){
    if(!iso) return '';
    const d = new Date(iso);
    if(Number.isNaN(d.getTime())) return '';
    const pad = n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },
  async editWebinar(i){
    const w = this.webinars[i];
    this.resetWizard();
    this.wz.id = w.id;
    this.wz.slug = w.slug;
    this.wz.nome = w.nome;
    document.getElementById('w_nome').value = w.nome;
    document.getElementById('w_slug').value = w.slug;
    this.showView('wizard');
    this.toast('Carregando "'+w.nome+'"...');

    try{
      const [full, login, offer, chat, sales, keywords, reactionKf] = await Promise.all([
        this.apiFetch('/api/webinars/' + w.id),
        this.apiFetch('/api/webinars/' + w.id + '/login-config').catch(()=>null),
        this.apiFetch('/api/webinars/' + w.id + '/offer-config').catch(()=>null),
        this.apiFetch('/api/webinars/' + w.id + '/chat-messages').catch(()=>[]),
        this.apiFetch('/api/webinars/' + w.id + '/sales-notifications').catch(()=>[]),
        this.apiFetch('/api/webinars/' + w.id + '/chatbot-keywords').catch(()=>[]),
        this.apiFetch('/api/webinars/' + w.id + '/reaction-keyframes').catch(()=>[]),
      ]);

      // Início
      document.getElementById('w_titulo').value = full.titulo || '';
      this.wz.titulo = full.titulo || '';
      const apresentadorEl = document.getElementById('w_apresentador');
      if(apresentadorEl) apresentadorEl.value = full.nome_apresentador || '';
      this.wz.apresentador = full.nome_apresentador || '';

      // Webinar (agendamento)
      this.selectStartMode(full.usar_sala_espera ? 'scheduled' : 'immediate');
      document.getElementById('w_dataInicio').value = this.isoToLocalDateTimeInput(full.data_inicio);
      document.getElementById('w_dataFim').value = this.isoToLocalDateTimeInput(full.data_fim);
      document.getElementById('chatFontSize').value = full.chat_tamanho_fonte || 'media';
      document.getElementById('w_suporteCor').value = full.suporte_cor_destaque || '#FFCC00';
      document.getElementById('w_suporteCorTransparencia').value = full.suporte_cor_transparencia ?? 0;
      document.getElementById('w_temaSala').value = full.tema_sala || 'escuro';
      this.renderSuporteColorPreview();

      // Login
      if(login){
        document.getElementById('chkBarraProgresso').checked = !!login.exibir_barra_progresso;
        document.getElementById('w_progInicio').value = login.progresso_inicial ?? 0;
        document.getElementById('w_logoUrl').value = login.logo_url || '';
        document.getElementById('logoImgDropzoneText').innerHTML = login.logo_url
          ? `<img src="${login.logo_url}" style="max-height:60px;border-radius:6px;display:block;margin:0 auto 6px;">Imagem enviada — clique pra trocar`
          : 'Clique ou arraste uma imagem (PNG, JPG, WEBP até 5MB)';
        document.getElementById('chkOcultarMarca').checked = !!login.ocultar_marca;
        document.getElementById('chkWhats').checked = !!login.pedir_whatsapp;
        document.getElementById('chkEmpresa').checked = !!login.pedir_empresa;
        document.getElementById('w_botaoTitulo').value = login.titulo_botao || 'Entrar na Aula';
      }

      // Vídeo
      this.wz.videoId = full.video_id || null;
      document.getElementById('chkAutoplay').checked = !!full.video_autoplay;
      document.getElementById('chkFullscreen').checked = !!full.video_fullscreen;
      document.getElementById('chkOcultarBarra').checked = !!full.ocultar_barra_progresso;
      document.getElementById('chkBloquearAvanco').checked = !!full.bloquear_avanco_video;
      document.getElementById('chkModoYoutube').checked = !!full.modo_youtube;
      // Dado antigo pode ter so o segundo salvo, sem tipo — trata como "especifico" por compatibilidade.
      const bloqueioTipo = full.modo_youtube_bloqueio_tipo || (full.modo_youtube_bloqueio_segundo != null ? 'especifico' : '');
      document.getElementById('selectBloqueioTipo').value = bloqueioTipo;
      document.getElementById('inputBloqueioMinutos').value = full.modo_youtube_bloqueio_segundo != null ? (full.modo_youtube_bloqueio_segundo / 60) : '';
      document.getElementById('bloqueioSegundoField').style.display = full.modo_youtube ? 'block' : 'none';
      this.toggleBloqueioEspecifico();
      this.buildVideoPickGrid();

      // Oferta
      if(offer){
        document.getElementById('w_produto').value = offer.nome_oferta || 'Comunidade FERA';
        this.wz.produto = offer.nome_oferta || 'Comunidade FERA';
        document.getElementById('w_ofertaTitulo').value = offer.titulo_oferta || '';
        document.getElementById('w_precoOriginal').value = offer.preco_original_centavos != null ? this.formatCentsToMoney(offer.preco_original_centavos) : '';
        document.getElementById('w_preco').value = offer.preco_oferta_centavos != null ? this.formatCentsToMoney(offer.preco_oferta_centavos) : '';
        this.wz.preco = document.getElementById('w_preco').value;
        document.getElementById('w_ofertaBotao').value = offer.texto_botao || 'inscreva-se aqui';
        document.getElementById('w_ofertaBotaoCor').value = offer.cor_botao || '#D93B3B';
        document.getElementById('w_reopenCor').value = offer.reopen_cor || '#FFCC00';
        document.getElementById('w_checkoutPipTamanho').value = offer.checkout_pip_tamanho || 'medio';
        document.getElementById('w_ofertaImagemUrl').value = offer.imagem_desktop_url || '';
        document.getElementById('ofertaImgDropzoneText').innerHTML = offer.imagem_desktop_url
          ? `<img src="${offer.imagem_desktop_url}" style="max-height:60px;border-radius:6px;display:block;margin:0 auto 6px;">Imagem enviada — clique pra trocar`
          : 'Clique ou arraste uma imagem (PNG, JPG, WEBP até 5MB)';
        document.getElementById('w_ofertaInicio').value = offer.inicio_oferta_segundos != null ? this.secondsToTime(offer.inicio_oferta_segundos) : '';
        document.getElementById('w_pitchInicio').value = offer.inicio_pitch_segundos != null ? this.secondsToTime(offer.inicio_pitch_segundos) : '';
        document.getElementById('w_linkCheckout').value = offer.link_checkout || '';
        document.getElementById('chkOfertaDesabilitada').checked = !!offer.oferta_desabilitada;
        document.getElementById('w_checkoutDuracao').value = offer.checkout_duracao_segundos ?? 600;
        this.setModoCheckout(offer.modo_checkout || 'link');
        this.renderOfertaPreview();
      } else {
        this.setModoCheckout('link');
      }

      // Chat / Vendas / Chatbot
      this.chatMsgs = (chat || []).map(c=>({t:this.secondsToTime(Math.abs(c.segundo_exibicao)), n:c.nome_exibido, m:c.mensagem, s:!!c.eh_suporte, pre:c.segundo_exibicao<0}));
      this.sales = (sales || []).map(s=>({t:this.secondsToTime(s.segundo_exibicao), n:s.nome_exibido}));
      this.keywords = (keywords || []).map(k=>({rem:k.remetente_exibido, kw:k.palavra_chave, resp:k.resposta_automatica, delay:(k.delay_segundos ?? 5)+'s'}));
      this.renderChatList();
      this.renderSalesList();
      this.renderKeywords();

      document.getElementById('chkHabilitarReacoes').checked = full.habilitar_reacoes != null ? !!full.habilitar_reacoes : true;
      this.reactionPoints = (reactionKf && reactionKf.length > 0)
        ? reactionKf.map(k=>({segundo:k.segundo, intensidade:k.intensidade}))
        : this.makeDefaultReactionPoints();
      this.renderReactionGraph();

      // Audiência
      this.setAudienceType(full.tipo_audiencia || 'dinamica');
      document.getElementById('audMin').value = full.audiencia_min_participantes ?? 50;
      document.getElementById('audMax').value = full.audiencia_max_participantes ?? 65;
      document.getElementById('audLiveToggle').checked = full.mostrar_botao_ao_vivo != null ? !!full.mostrar_botao_ao_vivo : true;
      this.updateAudiencePreview();

      this.toast('Editando "'+w.nome+'"');
    }catch(e){
      this.toast('Erro ao carregar dados do webinar: ' + e.message);
    }
  },
  copyWebinarLink(slug){
    const url = `${window.location.origin}/${slug}`;
    this.writeToClipboard(url, 'Link do webinar copiado!');
  },
  webinarLinks(slug){
    const base = `${window.location.origin}/${slug}`;
    return {
      principal: base,
      magic: `${base}?magic=1&nome=NOME_USUARIO&email=EMAIL_USUARIO&telefone=TELEFONE_USUARIO`,
      replay: `${base}/replay`,
    };
  },
  openLinksModal(slug){
    const links = this.webinarLinks(slug);
    document.getElementById('linksModalPrincipal').value = links.principal;
    document.getElementById('linksModalMagic').value = links.magic;
    document.getElementById('linksModalReplay').value = links.replay;
    document.getElementById('linksModal').classList.add('open');
  },
  closeLinksModal(){
    document.getElementById('linksModal').classList.remove('open');
  },
  writeToClipboard(text, successMsg){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>{
        this.toast(successMsg || 'Copiado para a área de transferência!');
      }).catch(()=>{
        this.fallbackCopyText(text, successMsg);
      });
    } else {
      this.fallbackCopyText(text, successMsg);
    }
  },
  fallbackCopyText(text, successMsg){
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      this.toast(successMsg || 'Copiado para a área de transferência!');
    } catch(e) {
      this.toast('Não foi possível copiar o texto');
    }
    document.body.removeChild(input);
  },
  async dupWebinar(i){
    const w = this.webinars[i];
    if(!w) return;
    try{
      await this.apiFetch(`/api/webinars/${w.id}/duplicate`, { method: 'POST' });
      this.toast(`Webinar "${w.nome}" duplicado com sucesso!`);
      await this.loadWebinars();
      this.renderWebinars();
      this.renderDashboard();
    }catch(e){
      this.toast('Erro ao duplicar: ' + e.message);
    }
  },
  async delWebinar(i){
    const w = this.webinars[i];
    if(!w) return;
    if(!confirm(`Tem certeza que deseja excluir o webinar "${w.nome}"?`)) return;
    try{
      await this.apiFetch(`/api/webinars/${w.id}`, { method: 'DELETE' });
      this.toast(`Webinar "${w.nome}" excluído com sucesso!`);
      await this.loadWebinars();
      this.renderWebinars();
      this.renderDashboard();
    }catch(e){
      this.toast('Erro ao excluir: ' + e.message);
    }
  },

  // ---------- MÉTRICAS ----------
  async openMetrics(webinarId){
    const w = this.webinars.find(x=>x.id===webinarId);
    document.getElementById('metricsTitle').textContent = 'Métricas — ' + (w?.nome || '');
    this.showView('metrics');
    document.getElementById('metricsFunnel').innerHTML = '<div class="empty-state">Carregando…</div>';
    try{
      const data = await this.apiFetch(`/api/webinars/${webinarId}/metrics`);
      this.renderMetrics(data);
    }catch(e){
      document.getElementById('metricsFunnel').innerHTML = `<div class="empty-state">Erro ao carregar métricas: ${e.message}</div>`;
    }
  },
  metricFunnelArrow(){
    return `<div class="mf-arrow">
      <svg viewBox="0 0 28 14" fill="none" stroke="currentColor" stroke-width="2"><line x1="0" y1="7" x2="22" y2="7"/><path d="M17 2l6 5-6 5"/></svg>
    </div>`;
  },
  metricFunnelStep(icon, num, label){
    return `<div class="mf-step">
      <div class="mf-icon">${icon}</div>
      <div class="mf-num">${(num ?? 0).toLocaleString('pt-BR')}</div>
      <div class="mf-label">${label}</div>
    </div>`;
  },
  renderMetrics(data){
    const ICO = {
      eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.7"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 18v-5h5"/></svg>',
      cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L22 7H6"/></svg>',
      money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5.8 2.5 2c0 2.5-5 1.5-5 4 0 1.2 1.1 2 2.5 2s2.5-1.1 2.5-2.5"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
      mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
      gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 8h18M12 8v13M12 8c-1.5-4-5-5-6-3.5S7 8 12 8zM12 8c1.5-4 5-5 6-3.5S17 8 12 8z"/></svg>',
    };

    document.getElementById('mVisitantes').textContent = (data.visitantes || 0).toLocaleString('pt-BR');
    document.getElementById('mParticipantes').textContent = (data.participantes || 0).toLocaleString('pt-BR');
    const taxa = data.visitantes > 0 ? ((data.participantes / data.visitantes) * 100).toFixed(1) + '%' : '—';
    document.getElementById('mTaxaInscricao').textContent = taxa;

    const clicouPct = data.estavaNaOferta > 0 ? ((data.clicouBotaoOferta / data.estavaNaOferta) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('metricsFunnel').innerHTML = `
      ${this.metricFunnelStep(ICO.eye, data.visitantes, 'Visitantes')}
      ${this.metricFunnelArrow()}
      ${this.metricFunnelStep(ICO.check, data.participantes, 'Participantes')}
      ${this.metricFunnelArrow()}
      <div class="mf-branch">
        ${this.metricFunnelStep(ICO.play, data.assistiuAoVivo, 'Assistiu ao vivo')}
        ${this.metricFunnelStep(ICO.replay, data.assistiuReplay, 'Assistiu replay')}
      </div>
      ${this.metricFunnelArrow()}
      ${this.metricFunnelStep(ICO.cart, data.clicouBotaoOferta, 'Clicou no botão (' + clicouPct + ')')}
      ${this.metricFunnelArrow()}
      ${this.metricFunnelStep(ICO.money, data.comprou, 'Comprou' + (data.faturamentoCentavos ? ' (' + (data.faturamentoCentavos/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + ')' : ''))}
    `;

    document.getElementById('metricsCards').innerHTML = [
      [ICO.clock, data.assistiu15min, 'Assistiu 15min'],
      [ICO.clock, data.assistiu30min, 'Assistiu 30min'],
      [ICO.clock, data.assistiu45min, 'Assistiu 45min'],
      [ICO.clock, data.assistiu60min, 'Assistiu 60min'],
      [ICO.mic, data.estavaNoPitch, 'Estava no pitch'],
      [ICO.gift, data.estavaNaOferta, 'Estava na oferta'],
      [ICO.cart, data.clicouBotaoOferta, 'Clicou no botão de oferta'],
      [ICO.cart, data.totalCliquesCompra, 'Total de cliques em comprar'],
      [ICO.chat, data.interagiuChat, 'Interagiu no chat'],
    ].map(([icon, num, label])=>`
      <div class="metric-card">
        <div class="mc-icon">${icon}</div>
        <div><div class="mc-num">${(num||0).toLocaleString('pt-BR')}</div><div class="mc-label">${label}</div></div>
      </div>`).join('');

    const emptyEl = document.getElementById('metricsRetencaoEmpty');
    const canvasEl = document.getElementById('metricsRetencaoChart');
    const retencao = data.retencao || [];
    if(this._metricsChart){ this._metricsChart.destroy(); this._metricsChart = null; }
    if(retencao.length === 0){
      emptyEl.style.display = 'block';
      canvasEl.style.display = 'none';
    }else{
      emptyEl.style.display = 'none';
      canvasEl.style.display = 'block';
      if(window.Chart){
        const zeroIdx = retencao.findIndex(p=>p.segundo >= 0);
        this._metricsChart = new Chart(canvasEl, {
          type: 'line',
          data: {
            labels: retencao.map(p=>this.formatRetencaoLabel(p.segundo)),
            datasets: [{
              label: 'Assistindo',
              data: retencao.map(p=>p.assistindo),
              borderColor: '#2E7D4F', backgroundColor: 'rgba(46,125,79,.18)',
              tension: .3, fill: true, pointRadius: 0, pointHoverRadius: 5,
              pointHoverBackgroundColor: '#2E7D4F', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
              borderWidth: 2,
              // Trecho pre-live (antes do segundo 0) em estilo tracejado pra diferenciar da retencao ao vivo.
              segment: zeroIdx > 0 ? { borderDash: (ctx)=> ctx.p1DataIndex < zeroIdx ? [5,4] : undefined } : undefined,
            }],
          },
          options: {
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1a1a18', titleColor: '#fff', bodyColor: '#e6e5dd',
                borderColor: '#3a3a35', borderWidth: 1, padding: 10, displayColors: false,
                callbacks: {
                  title: (items)=> {
                    const p = retencao[items[0].dataIndex];
                    return p.segundo < 0 ? `${Math.round(-p.segundo/60)} min antes do início` : this.formatRetencaoLabel(p.segundo);
                  },
                  label: (item)=> `${item.parsed.y.toLocaleString('pt-BR')} assistindo`,
                },
              },
            },
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { color: '#232320' }, ticks: { color: '#a6a59a', maxTicksLimit: 10 } },
              y: { grid: { color: '#232320' }, ticks: { color: '#a6a59a' }, beginAtZero: true },
            },
            maintainAspectRatio: false,
          },
        });
      }
    }
  },

  // ---------- WIZARD ----------
  buildStepper(){
    const el = document.getElementById('stepper');
    el.innerHTML = WIZ_STEPS.map((s,i)=>`
      ${i>0 ? `<div class="step-line" data-line="${i}"></div>` : ''}
      <div class="step-item" data-idx="${i}" onclick="App.wzGo(${i})">
        <div class="step-circle">${ICONS[s.ico]}</div>
        <div class="step-label">${s.label}</div>
      </div>
    `).join('');
    this.updateStepperUI();
  },
  updateStepperUI(){
    document.querySelectorAll('.step-item').forEach(el=>{
      const idx = +el.dataset.idx;
      el.classList.remove('done','active');
      if(idx < this.wz.step) el.classList.add('done');
      if(idx === this.wz.step) el.classList.add('active');
      el.querySelector('.step-circle').innerHTML = (idx < this.wz.step) ? ICONS.check : ICONS[WIZ_STEPS[idx].ico];
    });
    document.querySelectorAll('.step-line').forEach(el=>{
      el.classList.toggle('done', +el.dataset.line <= this.wz.step);
    });
    // Em tela estreita o stepper rola na horizontal — mantém a etapa atual à vista.
    const stepper = document.getElementById('stepper');
    const active = stepper && stepper.querySelector('.step-item.active');
    if(active && stepper.scrollWidth > stepper.clientWidth){
      const sr = stepper.getBoundingClientRect(), ar = active.getBoundingClientRect();
      stepper.scrollLeft += (ar.left + ar.width / 2) - (sr.left + sr.width / 2);
    }
  },
  getActiveWizardStep(){
    const activePanel = document.querySelector('.wizard-panel.active');
    const activeStep = activePanel ? Number(activePanel.dataset.step) : this.wz.step;
    return Number.isFinite(activeStep) ? activeStep : 0;
  },
  wzNext(){
    this.wzGo(this.getActiveWizardStep() + 1);
  },
  wzBack(){
    this.wzGo(this.getActiveWizardStep() - 1);
  },
  resetWizard(){
    this.wz = {step:0, id:null, slug:null, videoId:null, nome:'', titulo:'', url:'', apresentador:'', tipo:'Único', duracao:150, espectadores:500, produto:'Comunidade FERA', preco:'R$ 997,00', video:null, startMode:'immediate', audienceType:'dinamica'};
    document.getElementById('w_nome').value='';
    document.getElementById('w_titulo').value='';
    document.getElementById('w_slug').value='';
    const slugPrefixEl = document.getElementById('w_slugPrefix');
    if(slugPrefixEl) slugPrefixEl.textContent = window.location.origin + '/';
    const apresentadorEl = document.getElementById('w_apresentador');
    if(apresentadorEl) apresentadorEl.value = '';
    const dataInicio = document.getElementById('w_dataInicio');
    const dataFim = document.getElementById('w_dataFim');
    if(dataInicio) dataInicio.value = '';
    if(dataFim) dataFim.value = '';
    this.selectStartMode('immediate');
    document.getElementById('chatFontSize').value = 'media';
    // Zera as listas por-webinar — senão o que foi editado num webinar "vaza" pro próximo criado.
    this.chatMsgs = [];
    this.sales = [];
    this.keywords = [];
    this.reactionPoints = this.makeDefaultReactionPoints();
    this.renderChatList();
    this.renderSalesList();
    this.renderKeywords();
    document.getElementById('chkHabilitarReacoes').checked = true;
    this.renderReactionGraph();
    document.getElementById('chkBarraProgresso').checked = true;
    document.getElementById('w_progInicio').value = 0;
    document.getElementById('w_logoUrl').value = '';
    document.getElementById('logoImgDropzoneText').textContent = 'Clique ou arraste uma imagem (PNG, JPG, WEBP até 5MB)';
    document.getElementById('chkOcultarMarca').checked = false;
    document.getElementById('chkWhats').checked = true;
    document.getElementById('chkEmpresa').checked = false;
    document.getElementById('w_botaoTitulo').value = 'Entrar na Aula';
    document.getElementById('w_produto').value = 'Comunidade FERA';
    document.getElementById('w_ofertaTitulo').value = 'Comunidade FERA';
    document.getElementById('w_precoOriginal').value = 'R$ 2.351,00';
    document.getElementById('w_preco').value = 'R$ 397,00';
    document.getElementById('w_ofertaBotao').value = 'inscreva-se aqui';
    document.getElementById('w_ofertaBotaoCor').value = '#D93B3B';
    document.getElementById('w_reopenCor').value = '#FFCC00';
    document.getElementById('w_checkoutPipTamanho').value = 'medio';
    document.getElementById('w_ofertaImagemUrl').value = '';
    document.getElementById('ofertaImgDropzoneText').textContent = 'Clique ou arraste uma imagem (PNG, JPG, WEBP até 5MB)';
    document.getElementById('w_ofertaInicio').value = '';
    document.getElementById('w_pitchInicio').value = '';
    document.getElementById('w_linkCheckout').value = '';
    document.getElementById('chkOfertaDesabilitada').checked = false;
    document.getElementById('w_checkoutDuracao').value = 600;
    document.getElementById('w_suporteCor').value = '#FFCC00';
    document.getElementById('w_suporteCorTransparencia').value = 0;
    document.getElementById('w_temaSala').value = 'escuro';
    this.renderSuporteColorPreview();
    this.setModoCheckout('link');
    document.getElementById('chkAutoplay').checked = false;
    document.getElementById('chkFullscreen').checked = false;
    document.getElementById('chkOcultarBarra').checked = true;
    document.getElementById('chkBloquearAvanco').checked = true;
    document.getElementById('chkModoYoutube').checked = false;
    document.getElementById('selectBloqueioTipo').value = '';
    document.getElementById('inputBloqueioMinutos').value = '';
    document.getElementById('bloqueioSegundoField').style.display = 'none';
    document.getElementById('bloqueioEspecificoField').style.display = 'none';
    this.setAudienceType('dinamica');
    document.getElementById('audMin').value = 50;
    document.getElementById('audMax').value = 65;
    document.getElementById('audLiveToggle').checked = true;
    document.getElementById('wizardBanner').innerHTML='';
    this.fillSinoForm({});
    this._sinoLoadedFor = null;
    this.simClose();
    this._simDirty = {};
    this._simUserMsgs = [];
    this.wzGo(0);
  },

  // ---------- ETAPA "VALIDAÇÃO" (simulador do webinar) ----------
  // Reproduz no painel o que a sala (sala.js) e o servidor (routes/public.js) fazem em cada
  // segundo do vídeo — mensagens, vendas, pitch, oferta, trava de avanço e os eventos que vão
  // pro webhook do Sino — com o que está no formulário agora, mesmo sem salvar. Não chama
  // nenhuma rota pública: nada é gravado, nenhuma métrica conta e nenhum webhook sai daqui.
  // Se mudar a regra de algum gatilho na sala/servidor, mude aqui também (simEvents).
  _sim: { t:0, tMin:0, dur:0, playing:false, rate:1, filter:'gatilhos', tab:'chat', sigs:{} },
  _simDirty: {},
  _simUserMsgs: [],
  _simUserEvents: [],

  simFmt(t){
    const neg = t < 0;
    t = Math.floor(Math.abs(t));
    const hh = String(Math.floor(t/3600)).padStart(2,'0');
    const mm = String(Math.floor((t%3600)/60)).padStart(2,'0');
    const ss = String(t%60).padStart(2,'0');
    return (neg ? '-' : '') + `${hh}:${mm}:${ss}`;
  },
  simData(){
    const val = (id)=>document.getElementById(id)?.value ?? '';
    const chk = (id)=>!!document.getElementById(id)?.checked;
    const timeOrNull = (id)=>val(id).trim() ? this.parseTimeToSeconds(val(id)) : null;
    const video = this.videos.find(v=>v.id===Number(this.wz.videoId)) || null;
    const el = document.getElementById('simVideo');
    const elDur = el && this._simVideoUrl && Number.isFinite(el.duration) ? el.duration : 0;
    const dur = Math.max(1, Math.round(video?.duracaoSegundos || elDur || (Number(this.wz.duracao) || 150) * 60));
    const scheduled = this.wz.startMode === 'scheduled';

    const offer = {
      desabilitada: chk('chkOfertaDesabilitada'),
      pitch: timeOrNull('w_pitchInicio'),
      oferta: timeOrNull('w_ofertaInicio'),
      titulo: val('w_ofertaTitulo'),
      precoOriginal: val('w_precoOriginal'),
      preco: val('w_preco'),
      botao: val('w_ofertaBotao') || 'inscreva-se aqui',
      cor: val('w_ofertaBotaoCor') || '#D93B3B',
      reopenCor: val('w_reopenCor') || '#FFCC00',
      imagem: val('w_ofertaImagemUrl').trim(),
      link: val('w_linkCheckout').trim(),
      modo: this.wz.modoCheckout || 'link',
    };
    // Na sala, oferta desabilitada = offerConfig nulo: sem pitch, sem oferta e sem trava amarrada a eles.
    const offerOn = !offer.desabilitada;

    const modoYoutube = chk('chkModoYoutube');
    const bloqueioTipo = val('selectBloqueioTipo');
    let trava = null;
    if(modoYoutube && bloqueioTipo){
      if(bloqueioTipo === 'pitch') trava = offerOn ? offer.pitch : null;
      else if(bloqueioTipo === 'oferta') trava = offerOn ? offer.oferta : null;
      else trava = val('inputBloqueioMinutos') ? Math.round(Number(val('inputBloqueioMinutos')) * 60) : null;
    }

    const chat = (this.chatMsgs || []).map((c, idx)=>{
      const seg = (c.pre ? -1 : 1) * this.parseTimeToSeconds(c.t);
      // Pré-live só aparece antes do início na sala de espera (modo "obedecer horário");
      // no modo imediato a sala começa no 00:00 e despeja todas juntas.
      return { idx, seg, eff: scheduled ? seg : Math.max(0, seg), nome: c.n, msg: c.m, suporte: !!c.s, pre: !!c.pre };
    }).sort((a,b)=>a.eff-b.eff || a.idx-b.idx);
    const sales = (this.sales || []).map((s, idx)=>({ idx, seg: this.parseTimeToSeconds(s.t), nome: s.n }))
      .sort((a,b)=>a.seg-b.seg);

    const minPre = chat.reduce((m, c)=>Math.min(m, c.eff), 0);
    const tMin = scheduled ? Math.min(-60, minPre - 10) : 0;

    return {
      video, dur, tMin, scheduled, offer, offerOn, modoYoutube, bloqueioTipo, trava, chat, sales,
      nome: this.wz.nome || val('w_nome'), slug: this.wz.slug || val('w_slug'),
      reacoes: chk('chkHabilitarReacoes'), reactionPoints: this.reactionPoints || [],
      audiencia: { tipo: this.wz.audienceType, min: Number(val('audMin') || 0), max: Number(val('audMax') || 0), live: chk('audLiveToggle') },
      suporteBg: this.simHexToRgba(val('w_suporteCor') || '#FFCC00', val('w_suporteCorTransparencia')),
      keywords: this.keywords || [],
    };
  },
  simHexToRgba(hex, transparenciaPct){
    hex = (hex || '#FFCC00').replace('#', '');
    if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.substring(0,2), 16) || 0, g = parseInt(hex.substring(2,4), 16) || 0, b = parseInt(hex.substring(4,6), 16) || 0;
    return `rgba(${r},${g},${b},${1 - (Number(transparenciaPct || 0) / 100)})`;
  },

  // Gatilhos na mesma regra do servidor: "entrou" ao carregar a sala, "progresso" no 1º ping de
  // presença (a cada 30s) depois de cada múltiplo de 5 min, pitch/oferta uma vez quando o vídeo
  // cruza o horário, marcos de 0/25/50/75/100% só pro dashboard. Tudo pro Sino é só na live.
  simEvents(d){
    const ev = [];
    ev.push({ seg: d.tMin, kind:'hook', title:'Aluno entra na sala', dest:'Webhook Sino · entrou', sino:'entrou' });
    [0,25,50,75,100].forEach(m=>ev.push({ seg: Math.round(d.dur * m / 100), kind:'info', title:`Marco de ${m}% assistido`, dest:'Dashboard de retenção (interno, sem webhook)' }));
    for(let s = 300; s < d.dur; s += 300){
      ev.push({ seg: s, kind:'hook', title:`Progresso: ${Math.round(s/60)} min assistidos`, dest:'Webhook Sino · progresso (até ~30s depois, no ping de presença)', sino:'progresso', segundos: s });
    }
    if(d.offerOn && d.offer.pitch != null){
      ev.push({ seg: d.offer.pitch, kind:'pitch', title:'Começa o pitch', dest:'Funil: chegou no pitch · Webhook Sino · pitch', sino:'pitch' });
    }
    if(d.offerOn && d.offer.oferta != null){
      ev.push({ seg: d.offer.oferta, kind:'offer', title:'Oferta abre em tela cheia (vídeo vai pro PiP)', dest:'Funil: chegou na oferta · Webhook Sino · oferta', sino:'oferta' });
    }
    if(d.trava != null){
      ev.push({ seg: d.trava, kind:'lock', title:'Trava de avanço', dest:'Sala: o aluno não consegue adiantar além deste ponto sem assistir' });
    }
    ev.push({ seg: d.dur, kind:'info', title:'Fim do vídeo', dest:'Sala mostra a tela de encerramento' });
    this._simUserEvents.forEach(u=>ev.push(u));
    return ev.sort((a,b)=>a.seg-b.seg);
  },
  simPayload(e){
    const d = this._simD;
    const p = {
      evento: e.sino,
      webinar: { id: d.slug || '(slug do webinar)', nome: d.nome || undefined, data_inicio: '(data de início do webinar)' },
      aluno: { id: 0, nome: 'Aluno Simulado', email: 'aluno.simulado@exemplo.com', whatsapp: '5511999999999' },
      em: '(horário real do disparo, -03:00)',
    };
    if(e.segundos != null) p.segundos_assistidos = e.segundos;
    return JSON.stringify(p, null, 2);
  },

  simChecks(d){
    const out = [];
    const add = (lvl, txt, step)=>out.push({ lvl, txt, step });
    const f = (s)=>this.simFmt(s);
    const v = d.video;
    if(!v) add('err', 'Nenhum vídeo selecionado — a sala vai mostrar "Vídeo ainda não configurado". A simulação segue só no relógio.', 3);
    else if(v.status !== 'pronto' || !v.playbackUrl) add('warn', `O vídeo "${escapeHtmlAdmin(v.nome)}" ainda está processando — a simulação segue no relógio, sem imagem.`, 3);
    else add('ok', `Vídeo "${escapeHtmlAdmin(v.nome)}" — ${f(d.dur)} de duração.`);

    if(!d.offerOn){
      add('info', 'Oferta desabilitada: a oferta não abre e os gatilhos de pitch e oferta não disparam.', 4);
    } else {
      const o = d.offer;
      if(o.oferta == null) add('err', 'Horário de abertura da oferta vazio — a oferta nunca abre na sala.', 4);
      else if(o.oferta > d.dur) add('err', `A oferta abre em ${f(o.oferta)}, depois do fim do vídeo (${f(d.dur)}) — ninguém vai ver.`, 4);
      else add('ok', `Oferta abre em ${f(o.oferta)} (${Math.round(o.oferta / d.dur * 100)}% do vídeo).`);
      if(o.pitch == null) add('warn', 'Início do pitch vazio — o funil não conta quem chegou no pitch e o Sino não recebe o evento "pitch".', 4);
      else if(o.pitch > d.dur) add('err', `O pitch começa em ${f(o.pitch)}, depois do fim do vídeo.`, 4);
      else if(o.oferta != null && o.pitch > o.oferta) add('warn', `O pitch (${f(o.pitch)}) está depois da abertura da oferta (${f(o.oferta)}).`, 4);
      else add('ok', `Pitch começa em ${f(o.pitch)}${o.oferta != null ? ` — ${f(o.oferta - o.pitch)} antes da oferta` : ''}.`);
      if(!o.link) add('err', 'Sem link de checkout — o botão de compra não faz nada.', 4);
      else add('ok', `Botão de compra ${o.modo === 'embutido' ? 'abre o checkout embutido na sala' : 'redireciona pro checkout'}.`);
    }

    if(d.modoYoutube && d.bloqueioTipo){
      if(d.trava == null) add('warn', `Trava de avanço amarrada ${d.bloqueioTipo === 'especifico' ? 'a um tempo específico vazio' : `ao ${d.bloqueioTipo}, mas esse horário está vazio (ou a oferta está desabilitada)`} — a trava não funciona.`, 3);
      else if(d.trava > d.dur) add('warn', `A trava de avanço (${f(d.trava)}) está depois do fim do vídeo.`, 3);
      else add('ok', `Trava de avanço em ${f(d.trava)}.`);
    }

    const chat = d.chat;
    if(!chat.length) add('info', 'Nenhuma mensagem simulada no chat.', 5);
    else {
      const depois = chat.filter(c=>c.seg > d.dur);
      if(depois.length) add('warn', `${depois.length} mensagem(ns) depois do fim do vídeo — nunca aparecem (a 1ª em ${f(depois[0].seg)}: "${escapeHtmlAdmin(String(depois[0].msg || '').slice(0, 60))}").`, 5);
      const pre = chat.filter(c=>c.pre);
      if(pre.length && !d.scheduled) add('warn', `${pre.length} mensagem(ns) marcada(s) "antes da live", mas o webinar começa quando o aluno entra — aparecem todas juntas no 00:00:00.`, 1);
      let rajada = null;
      for(let i=0, j=0; i<chat.length; i++){
        while(chat[i].eff - chat[j].eff > 3) j++;
        if(i - j + 1 >= 6 && chat[i].eff > 0){ rajada = { n: i - j + 1, seg: chat[j].eff }; break; }
      }
      if(rajada) add('info', `Rajada: ${rajada.n} mensagens em 3s perto de ${f(rajada.seg)} — confira se fica natural.`, 5);
      const sup = chat.filter(c=>c.suporte).length;
      add('ok', `${chat.length} mensagem(ns) no chat${sup ? ` (${sup} do suporte)` : ''}, de ${f(chat[0].eff)} a ${f(chat[chat.length - 1].eff)}.`);
    }

    if(d.sales.length){
      const o = d.offer;
      const antes = (d.offerOn && o.oferta != null) ? d.sales.filter(s=>s.seg < o.oferta) : [];
      if(antes.length) add('warn', `${antes.length} notificação(ões) de venda antes da oferta abrir (a 1ª em ${f(antes[0].seg)}) — aparece "Venda confirmada" antes de existir botão de compra.`, 6);
      const depois = d.sales.filter(s=>s.seg > d.dur);
      if(depois.length) add('warn', `${depois.length} notificação(ões) de venda depois do fim do vídeo — nunca aparecem.`, 6);
      if(!antes.length && !depois.length) add('ok', `${d.sales.length} notificação(ões) de venda, a 1ª em ${f(d.sales[0].seg)}.`);
    } else add('info', 'Nenhuma notificação de venda simulada.', 6);

    add('info', d.keywords.length ? `Chatbot com ${d.keywords.length} palavra(s)-chave — teste digitando no chat da simulação.` : 'Chatbot sem palavras-chave.', 9);
    const nProg = Math.max(0, Math.ceil(d.dur / 300) - 1);
    add('info', `Webhook do Sino (só na live, nunca no replay): entrou, progresso a cada 5 min (${nProg}x)${d.offerOn ? ', pitch, oferta' : ''}, cada clique no botão de compra e a 1ª mensagem do aluno no chat.`);
    return out;
  },
  renderSimChecks(){
    const checks = this.simChecks(this._simD);
    const ico = { ok:'✓', warn:'!', err:'✕', info:'i' };
    document.getElementById('simChecks').innerHTML = checks.map(c=>`
      <div class="sim-check sim-check-${c.lvl}">
        <span class="sim-check-ico">${ico[c.lvl]}</span>
        <span class="sim-check-txt">${c.txt}</span>
        ${c.step != null && c.lvl !== 'ok' ? `<button class="btn btn-ghost btn-sm" onclick="App.wzGo(${c.step})">Ajustar em ${WIZ_STEPS[c.step].label}</button>` : ''}
      </div>`).join('');
    const errs = checks.filter(c=>c.lvl === 'err').length, warns = checks.filter(c=>c.lvl === 'warn').length;
    const badge = document.getElementById('simCheckSummary');
    badge.className = 'badge ' + (errs ? 'badge-red' : warns ? 'badge-yellow' : 'badge-green');
    badge.textContent = errs ? `${errs} erro(s)${warns ? ` · ${warns} aviso(s)` : ''}` : warns ? `${warns} aviso(s)` : 'Tudo certo';
  },

  // ----- montagem / relógio -----
  simOpen(){
    this.simRefresh();
    const s = this._sim;
    if(s.t < s.tMin || s.t > s.dur) s.t = s.tMin;
    this.simLoadVideo();
    this.simBindTrack();
    this.simSetPlayingUI();
    if(!s.raf) s.raf = requestAnimationFrame((n)=>this.simTick(n));
  },
  simClose(){
    const s = this._sim;
    if(s.playing) this.simPause();
    if(s.raf){ cancelAnimationFrame(s.raf); s.raf = null; }
    this.simUnloadVideo();
  },
  // Relê o formulário — chamado ao abrir a etapa e depois de cada ajuste feito aqui.
  simRefresh(){
    const d = this._simD = this.simData();
    const s = this._sim;
    s.tMin = d.tMin; s.dur = d.dur;
    s.t = Math.min(Math.max(s.t, s.tMin), s.dur);
    this._simEv = this.simEvents(d);
    s.sigs = {};
    this.renderSimChecks();
    this.renderSimMarks();
    document.getElementById('simTimeDur').textContent = this.simFmt(d.dur);
    document.getElementById('simGoPitch').disabled = !(d.offerOn && d.offer.pitch != null);
    document.getElementById('simGoOferta').disabled = !(d.offerOn && d.offer.oferta != null);
    this.simRender();
  },
  simVideoEl(){
    return this._simVideoUrl ? document.getElementById('simVideo') : null;
  },
  simLoadVideo(){
    const v = this._simD.video;
    const url = v && v.status === 'pronto' ? v.playbackUrl : null;
    if(url && url === this._simVideoUrl) return;
    this.simUnloadVideo();
    if(!url) return;
    const el = document.getElementById('simVideo');
    this._simVideoUrl = url;
    el.poster = v.thumbnailUrl || '';
    el.muted = true;
    document.getElementById('simMuteBtn').textContent = '🔇';
    if(window.Hls && Hls.isSupported()){
      this._simHls = new Hls();
      this._simHls.loadSource(url);
      this._simHls.attachMedia(el);
    } else {
      el.src = url;
    }
    el.addEventListener('loadedmetadata', ()=>{
      if(!v.duracaoSegundos) this.simRefresh(); // duração só conhecida agora
      if(this._sim.t >= 0) el.currentTime = this._sim.t;
    }, { once: true });
  },
  simUnloadVideo(){
    const el = document.getElementById('simVideo');
    if(this._simHls){ this._simHls.destroy(); this._simHls = null; }
    if(el && this._simVideoUrl){ el.pause(); el.removeAttribute('src'); el.removeAttribute('poster'); el.load(); }
    this._simVideoUrl = null;
  },
  simTick(now){
    const s = this._sim;
    const dt = s.lastNow ? Math.min(0.5, (now - s.lastNow) / 1000) : 0;
    s.lastNow = now;
    if(s.playing){
      const el = this.simVideoEl();
      const prev = s.t;
      if(el && s.t >= 0 && !el.paused && !el.ended) s.t = el.currentTime;
      else s.t += dt * s.rate;
      if(el && s.t >= 0 && el.paused && s.t < (el.duration || Infinity)){
        el.currentTime = s.t;
        el.playbackRate = s.rate;
        el.play().catch(()=>{});
      }
      if(s.t >= s.dur){ s.t = s.dur; this.simPause(); }
      this.simCrossed(prev, s.t);
      this.simTickReactions(dt);
    }
    this.simRender();
    s.raf = requestAnimationFrame((n)=>this.simTick(n));
  },
  simTogglePlay(){
    this._sim.playing ? this.simPause() : this.simPlay();
  },
  simPlay(){
    const s = this._sim;
    if(s.t >= s.dur) this.simSeek(s.tMin);
    s.playing = true;
    s.lastNow = 0;
    const el = this.simVideoEl();
    if(el && s.t >= 0){
      el.currentTime = s.t;
      el.playbackRate = s.rate;
      el.play().catch(()=>{});
    }
    this.simSetPlayingUI();
  },
  simPause(){
    this._sim.playing = false;
    const el = this.simVideoEl();
    if(el) el.pause();
    this.simSetPlayingUI();
  },
  simSetPlayingUI(){
    const btn = document.getElementById('simPlayBtn');
    if(btn) btn.textContent = this._sim.playing ? '❚❚ Pausar' : '▶ Play';
  },
  simSeek(t){
    const s = this._sim;
    t = Math.min(Math.max(Number(t) || 0, s.tMin), s.dur);
    const d = this._simD;
    if(d && d.offerOn && d.offer.oferta != null && t < d.offer.oferta){
      s.offerDismissed = false; s.checkoutOpen = false;
    }
    s.t = t;
    const el = this.simVideoEl();
    if(el){
      if(t >= 0 && t < (el.duration || Infinity)) el.currentTime = t;
      if(t < 0) el.pause();
    }
    this.simRender();
  },
  simSkip(delta){
    this.simSeek(this._sim.t + delta);
  },
  simSetSpeed(v){
    this._sim.rate = Number(v) || 1;
    const el = this.simVideoEl();
    if(el) el.playbackRate = this._sim.rate;
  },
  simToggleMute(){
    const el = document.getElementById('simVideo');
    el.muted = !el.muted;
    document.getElementById('simMuteBtn').textContent = el.muted ? '🔇' : '🔊';
  },
  simGotoTyped(){
    const v = document.getElementById('simGotoInput').value.trim();
    if(v) this.simSeek(this.parseTimeToSeconds(v));
  },
  simGoMarker(kind){
    const o = this._simD.offer;
    const seg = kind === 'pitch' ? o.pitch : o.oferta;
    if(seg != null) this.simSeek(seg - 3); // 3s antes, pra ver acontecer
  },
  simFilteredList(){
    const d = this._simD, f = this._sim.filter;
    if(f === 'gatilhos') return this._simEv;
    const chat = d.chat.map(c=>({ seg: c.eff, kind: c.suporte ? 'sup' : 'chat', title: `${c.nome}: ${c.msg}`, dest: c.suporte ? 'Mensagem do suporte' : (c.pre ? 'Mensagem pré-live' : 'Mensagem no chat'), chatIdx: c.idx }));
    const sales = d.sales.map(s=>({ seg: s.seg, kind:'sale', title:`${s.nome} — Venda confirmada!`, dest:'Notificação de venda sobre o vídeo (6s)', saleIdx: s.idx }));
    if(f === 'chat') return chat;
    if(f === 'vendas') return sales;
    return [...this._simEv, ...chat, ...sales].sort((a,b)=>a.seg-b.seg);
  },
  simJumpEvent(dir){
    const t = this._sim.t;
    const list = this.simFilteredList();
    const target = dir > 0 ? list.find(e=>e.seg > t + 2.01) : [...list].reverse().find(e=>e.seg < t - 0.01);
    if(target) this.simSeek(target.seg - 2);
  },
  // Com o vídeo rodando, pisca na tela cada gatilho que acabou de passar.
  simCrossed(prev, t){
    if(t <= prev || t - prev > 5) return;
    const hit = this._simEv.filter(e=>e.seg > prev && e.seg <= t && e.kind !== 'info');
    if(!hit.length) return;
    const el = document.getElementById('simFlash');
    el.innerHTML = hit.map(e=>`<div class="sim-flash-item sim-k-${e.kind}">⚡ ${escapeHtmlAdmin(e.title)}<small>${escapeHtmlAdmin(e.dest)}</small></div>`).join('');
    el.classList.add('show');
    clearTimeout(this._simFlashT);
    this._simFlashT = setTimeout(()=>el.classList.remove('show'), 2600);
  },
  // Mesma curva e mesmo sorteio da sala (tickReactions roda a cada ~300ms de relógio).
  simTickReactions(dt){
    const d = this._simD, t = this._sim.t;
    if(!d.reacoes || t < 0) return;
    this._simReactAcc = (this._simReactAcc || 0) + dt;
    if(this._simReactAcc < 0.3) return;
    this._simReactAcc = 0;
    const pts = d.reactionPoints;
    if(!pts.length) return;
    let intensity = pts[pts.length - 1].intensidade;
    if(t <= pts[0].segundo) intensity = pts[0].intensidade;
    else for(let i=0; i<pts.length-1; i++){
      const a = pts[i], b = pts[i+1];
      if(t >= a.segundo && t <= b.segundo){ intensity = a.intensidade + (b.intensidade - a.intensidade) * ((t - a.segundo) / (b.segundo - a.segundo || 1)); break; }
    }
    const spawn = ()=>{
      const wrap = document.getElementById('simReactions');
      const el = document.createElement('div');
      el.className = 'pub-reaction';
      el.textContent = ['❤️','😄','🎉','😮','💯'][Math.floor(Math.random() * 5)];
      el.style.left = (10 + Math.random() * 80) + '%';
      el.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
      wrap.appendChild(el);
      setTimeout(()=>el.remove(), 2900);
    };
    if(Math.random() * 100 < intensity) spawn();
    if(intensity > 60 && Math.random() * 100 < (intensity - 60)) spawn();
  },

  // ----- linha do tempo -----
  simPct(seg){
    const s = this._sim;
    return Math.min(100, Math.max(0, (seg - s.tMin) / ((s.dur - s.tMin) || 1) * 100));
  },
  renderSimMarks(){
    const d = this._simD;
    const marks = [];
    d.chat.forEach(c=>marks.push(`<i class="sim-m ${c.suporte ? 'm-sup' : 'm-chat'}" style="left:${this.simPct(c.eff)}%"></i>`));
    d.sales.forEach(s=>marks.push(`<i class="sim-m m-sale" style="left:${this.simPct(s.seg)}%"></i>`));
    this._simEv.forEach(e=>{
      if(e.kind === 'hook') marks.push(`<i class="sim-m m-hook" style="left:${this.simPct(e.seg)}%"></i>`);
      if(e.kind === 'pitch' || e.kind === 'offer' || e.kind === 'lock'){
        const lbl = e.kind === 'pitch' ? 'Pitch' : e.kind === 'offer' ? 'Oferta' : 'Trava';
        marks.push(`<i class="sim-m m-big m-${e.kind}" style="left:${this.simPct(e.seg)}%"><b>${lbl}</b></i>`);
      }
    });
    document.getElementById('simTrackMarks').innerHTML = marks.join('');
    document.getElementById('simTrackPre').style.width = this.simPct(0) + '%';
  },
  simBindTrack(){
    if(this._simTrackBound) return;
    this._simTrackBound = true;
    const track = document.getElementById('simTrack');
    const tip = document.getElementById('simTrackTip');
    const timeAt = (e)=>{
      const r = track.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      return { t: this._sim.tMin + pct * (this._sim.dur - this._sim.tMin), pct };
    };
    let dragging = false, wasPlaying = false;
    track.addEventListener('pointerdown', (e)=>{
      dragging = true;
      wasPlaying = this._sim.playing;
      if(wasPlaying) this.simPause();
      track.setPointerCapture(e.pointerId);
      this.simSeek(timeAt(e).t);
    });
    track.addEventListener('pointermove', (e)=>{
      const { t, pct } = timeAt(e);
      if(dragging){ this._sim.t = t; this.simRender(); }
      const range = (this._sim.dur - this._sim.tMin) * 0.006;
      const near = (this._simEv || []).filter(ev=>Math.abs(ev.seg - t) <= range && ev.kind !== 'info');
      tip.innerHTML = `<b>${this.simFmt(t)}</b>${near.map(ev=>`<br>${escapeHtmlAdmin(ev.title)}`).join('')}`;
      tip.style.left = (pct * 100) + '%';
      tip.style.display = 'block';
    });
    const end = (e)=>{
      if(!dragging) return;
      dragging = false;
      this.simSeek(timeAt(e).t);
      if(wasPlaying) this.simPlay();
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('pointerleave', ()=>{ tip.style.display = 'none'; });
  },

  // ----- desenho do estado no segundo t (só refaz cada pedaço quando ele muda) -----
  simChanged(key, sig){
    const s = this._sim;
    if(s.sigs[key] === sig) return false;
    s.sigs[key] = sig;
    return true;
  },
  simRender(){
    const d = this._simD, s = this._sim;
    if(!d) return;
    const t = s.t;
    document.getElementById('simTimeNow').textContent = this.simFmt(t);
    document.getElementById('simPlayhead').style.left = this.simPct(t) + '%';
    const played = document.getElementById('simTrackPlayed');
    played.style.left = this.simPct(Math.min(t, 0)) + '%';
    played.style.width = (this.simPct(t) - this.simPct(Math.min(t, 0))) + '%';
    const live = t >= 0;
    document.getElementById('simLiveBadge').style.display = live ? '' : 'none';

    // tela antes da live / sem vídeo
    const hasVideo = !!this._simVideoUrl;
    const phSig = !live ? 'pre' + Math.floor(-t) : (hasVideo ? 'video' : 'novideo');
    if(this.simChanged('ph', phSig)){
      const ph = document.getElementById('simPlaceholder');
      if(!live){
        ph.innerHTML = `<div class="sim-ph-title">SALA DE ESPERA</div><div class="sim-ph-num">${this.simFmt(-t).slice(3)}</div><div class="sim-ph-sub">para a live começar — mensagens pré-live aparecem no chat</div>`;
        ph.style.display = 'flex';
      } else if(!hasVideo){
        ph.innerHTML = `<div class="sim-ph-title">${d.video ? 'VÍDEO PROCESSANDO' : 'SEM VÍDEO'}</div><div class="sim-ph-sub">A simulação segue no relógio — os tempos continuam valendo.</div>`;
        ph.style.display = 'flex';
      } else ph.style.display = 'none';
    }

    // audiência (mesma fórmula da sala, que usa o relógio e não o vídeo)
    const a = d.audiencia, audEl = document.getElementById('simAudience');
    if(!live || a.tipo === 'nenhuma' || !a.live) audEl.style.display = 'none';
    else {
      const min = Math.max(0, a.min), max = Math.max(min, a.max);
      let count = max;
      if(a.tipo === 'dinamica' && max > min){
        const phase = (Date.now() / 1000) % 7200;
        const pct = phase < 1800 ? phase / 1800 : phase < 3600 ? 1 : Math.max(0, 1 - (phase - 3600) / 3600);
        count = Math.round(min + (max - min) * pct);
      }
      audEl.textContent = '👁 ' + count.toLocaleString('pt-BR');
      audEl.style.display = '';
    }

    if(s.tab === 'chat') this.simRenderChat(t);

    const salesOn = d.sales.filter(x=>x.seg <= t && t < x.seg + 6);
    if(this.simChanged('sales', salesOn.map(x=>x.idx).join(','))){
      document.getElementById('simSales').innerHTML = salesOn.map(x=>`<div class="sale-item"><span>🛒</span><span>${escapeHtmlAdmin(x.nome)} — Venda confirmada!</span></div>`).join('');
    }

    const o = d.offer;
    const offerReached = d.offerOn && o.oferta != null && t >= o.oferta;
    const offerOpen = offerReached && !s.offerDismissed;
    const offerSig = offerOpen ? (s.checkoutOpen ? 'checkout' : 'card') : (offerReached ? 'dismissed' : 'off');
    if(this.simChanged('offer', offerSig)) this.simRenderOffer(offerSig);

    if(s.tab === 'eventos'){
      const list = this.simFilteredList();
      let fired = 0;
      while(fired < list.length && list[fired].seg <= t) fired++;
      if(this.simChanged('ev', s.filter + '|' + fired + '|' + list.length)) this.simRenderEvents(t, list);
    }

    const next = this._simEv.find(e=>e.seg > t && e.kind !== 'info');
    const nextSig = next ? next.title + Math.ceil(next.seg - t) : 'none';
    if(this.simChanged('next', nextSig)){
      document.getElementById('simNext').innerHTML = next
        ? `Próximo gatilho: <b>${escapeHtmlAdmin(next.title)}</b> em ${this.simFmt(next.seg - t)} <span>(no ${this.simFmt(next.seg)})</span>`
        : 'Nenhum gatilho pela frente.';
    }
  },
  simRenderChat(t){
    const d = this._simD;
    let nVis = 0;
    while(nVis < d.chat.length && d.chat[nVis].eff <= t) nVis++;
    const user = this._simUserMsgs.filter(m=>m.seg <= t);
    const pending = this._simUserMsgs.filter(m=>m.bot && m.seg > t);
    if(!this.simChanged('chat', nVis + '|' + user.length + '|' + pending.length)) return;
    const rows = [
      ...d.chat.slice(0, nVis).map(c=>({ seg: c.eff, c })),
      ...user.map(m=>({ seg: m.seg, m })),
    ].sort((a,b)=>a.seg-b.seg).slice(-80);
    const box = document.getElementById('simChat');
    box.innerHTML = (rows.length ? '' : '<div class="empty-state">Nenhuma mensagem até aqui.</div>') + rows.map(r=>{
      const time = `<span class="sim-chat-t">${this.simFmt(r.seg)}</span>`;
      if(r.m){
        return r.m.bot
          ? `<div class="pub-chat-support" style="background:${d.suporteBg};">${time}Suporte (chatbot)<br>${escapeHtmlAdmin(r.m.msg)}</div>`
          : `<div class="pub-chat-msg mine">${time}<span class="name">Você:</span>${escapeHtmlAdmin(r.m.msg)}</div>`;
      }
      const c = r.c;
      const move = `<button class="sim-move" title="Mover esta mensagem pro tempo atual do vídeo" onclick="App.simMoveToNow('chat',${c.idx})">⟲ agora</button>`;
      return c.suporte
        ? `<div class="pub-chat-support sim-chat-row" style="background:${d.suporteBg};">${time}${escapeHtmlAdmin(c.nome)}<br>${escapeHtmlAdmin(c.msg)}${move}</div>`
        : `<div class="pub-chat-msg sim-chat-row">${time}<span class="name">${escapeHtmlAdmin(c.nome)}:</span>${escapeHtmlAdmin(c.msg)}${move}</div>`;
    }).join('') + pending.map(m=>`<div class="sim-chat-pending">Chatbot responde no ${this.simFmt(m.seg)} — avance o vídeo</div>`).join('');
    box.scrollTop = box.scrollHeight;
  },
  simRenderOffer(sig){
    const o = this._simD.offer;
    const box = document.getElementById('simOffer');
    document.getElementById('simStage').classList.toggle('offer-open', sig === 'card' || sig === 'checkout');
    if(sig === 'off'){ box.innerHTML = ''; return; }
    if(sig === 'dismissed'){
      box.innerHTML = `<button class="sim-reopen" style="background:${escapeHtmlAdmin(o.reopenCor)};" onclick="App._sim.offerDismissed=false;App.simRender()">Oferta — reabrir</button>`;
      return;
    }
    const close = `<button class="sim-offer-close" onclick="App._sim.offerDismissed=true;App._sim.checkoutOpen=false;App.simRender()" title="Fechar (como o aluno fecharia)">✕</button>`;
    if(sig === 'checkout'){
      box.innerHTML = `<div class="sim-offer-panel">${close}
        <div class="sim-offer-checkout"><b>Checkout embutido abriria aqui</b><span>${escapeHtmlAdmin(o.link)}</span><small>Na simulação o checkout não carrega. Na sala ele fica aberto até o aluno fechar.</small></div></div>`;
      return;
    }
    box.innerHTML = `<div class="sim-offer-panel">${close}
      ${o.imagem ? `<img src="${escapeHtmlAdmin(o.imagem)}" alt="">` : ''}
      ${o.titulo ? `<div class="sim-offer-title">${escapeHtmlAdmin(o.titulo)}</div>` : ''}
      ${this.parseMoneyToCents(o.precoOriginal) ? `<div class="sim-offer-orig">De ${escapeHtmlAdmin(o.precoOriginal)}</div>` : ''}
      <div class="sim-offer-price">Por ${escapeHtmlAdmin(o.preco)}</div>
      <div class="sim-offer-note">Por tempo limitado — Oferta só hoje!</div>
      <button class="sim-offer-buy" style="background:${escapeHtmlAdmin(o.cor)};" onclick="App.simBuy()">${escapeHtmlAdmin(o.botao)}</button>
    </div>`;
  },
  simRenderEvents(t, list){
    const box = document.getElementById('simEvents');
    const nowIdx = list.findIndex(e=>e.seg > t);
    const nowLine = `<div class="sim-now-line">agora · ${this.simFmt(t)}</div>`;
    const clear = (this._simUserEvents.length || this._simUserMsgs.length)
      ? `<button class="btn btn-ghost btn-sm sim-clear" onclick="App.simClearUser()">Limpar cliques e mensagens de teste</button>` : '';
    box.innerHTML = clear + (list.length ? '' : '<div class="empty-state">Nada configurado aqui.</div>') + list.map((e, i)=>{
      const fired = e.seg <= t;
      const recent = fired && t - e.seg < 6;
      const move = e.chatIdx != null ? `<button class="sim-move" onclick="event.stopPropagation();App.simMoveToNow('chat',${e.chatIdx})">⟲ agora</button>`
        : e.saleIdx != null ? `<button class="sim-move" onclick="event.stopPropagation();App.simMoveToNow('sale',${e.saleIdx})">⟲ agora</button>` : '';
      return `${i === nowIdx ? nowLine : ''}
        <div class="sim-ev sim-k-${e.kind}${fired ? ' fired' : ''}${recent ? ' recent' : ''}">
          <div class="sim-ev-head" onclick="App.simSeek(${e.seg - 2})" title="Ir pra 2s antes">
            <span class="sim-ev-t">${this.simFmt(e.seg)}</span>
            <span class="sim-ev-st">${fired ? '✓' : '○'}</span>
            <span class="sim-ev-body"><b>${escapeHtmlAdmin(e.title)}</b><small>${escapeHtmlAdmin(e.dest)}</small></span>
            ${move}
          </div>
          ${e.sino ? `<details class="sim-ev-payload"><summary>payload do webhook</summary><pre>${escapeHtmlAdmin(this.simPayload(e))}</pre></details>` : ''}
        </div>`;
    }).join('') + (nowIdx === -1 && list.length ? nowLine : '');
    const line = box.querySelector('.sim-now-line');
    if(line) box.scrollTop = Math.max(0, line.offsetTop - box.clientHeight / 2);
  },
  simTab(tab){
    this._sim.tab = tab;
    document.getElementById('simTabChat').classList.toggle('active', tab === 'chat');
    document.getElementById('simTabEventos').classList.toggle('active', tab === 'eventos');
    document.getElementById('simChatPane').style.display = tab === 'chat' ? '' : 'none';
    document.getElementById('simEventosPane').style.display = tab === 'eventos' ? '' : 'none';
    this._sim.sigs.ev = null; this._sim.sigs.chat = null;
    this.simRender();
  },
  simSetFilter(f){
    this._sim.filter = f;
    document.querySelectorAll('#simFilter button').forEach(b=>b.classList.toggle('active', b.dataset.f === f));
    this.simRender();
  },

  // ----- interações do "aluno" (só na simulação) -----
  simUserEvent(e){
    this._simUserEvents.push(e);
    this._simEv = this.simEvents(this._simD);
    this.renderSimMarks();
    this._sim.sigs.ev = null;
    this.simCrossed(e.seg - 0.01, e.seg);
  },
  simBuy(){
    const o = this._simD.offer, t = Math.max(0, Math.round(this._sim.t));
    this.simUserEvent({ seg: t, kind:'hook', title:'Clique no botão de compra (simulado)', dest:'Funil: clicou em comprar (conta cada clique) · Webhook Sino · clicou_botao', sino:'clicou_botao' });
    if(!o.link){ this.toast('Sem link de checkout: na sala o botão não faria nada.'); return; }
    if(o.modo === 'embutido'){ this._sim.checkoutOpen = true; this.simRender(); }
    else this.toast('Na sala, o aluno sairia pro checkout: ' + o.link);
  },
  simSendChat(){
    const inp = document.getElementById('simChatInput');
    const txt = inp.value.trim();
    if(!txt) return;
    inp.value = '';
    const t = this._sim.t;
    this._simUserMsgs.push({ seg: t, msg: txt });
    if(!this._simUserEvents.some(e=>e.sino === 'chat')){
      this.simUserEvent({ seg: Math.round(t), kind:'hook', title:'1ª mensagem do aluno no chat (simulada)', dest:'Funil: interagiu no chat · Webhook Sino · chat · abre atendimento na Sala de Atendimento', sino:'chat' });
    }
    const low = txt.toLowerCase();
    const kw = this._simD.keywords.find(k=>k.kw && low.includes(String(k.kw).toLowerCase()));
    if(kw){
      const delay = parseInt(kw.delay, 10) || 3;
      this._simUserMsgs.push({ seg: t + delay, msg: String(kw.resp || '').replace('#nome', 'você'), bot: true });
    }
    this._sim.sigs.chat = null;
    this.simRender();
  },
  simClearUser(){
    this._simUserMsgs = [];
    this._simUserEvents = [];
    this.simRefresh();
  },

  // ----- ajustes feitos daqui (salvos ao sair da etapa) -----
  simMarkHere(kind){
    const t = Math.round(this._sim.t);
    if(t < 0) return this.toast('Avance até o vídeo começar pra marcar esse ponto.');
    document.getElementById(kind === 'pitch' ? 'w_pitchInicio' : 'w_ofertaInicio').value = this.secondsToTime(t);
    this._simDirty.offer = true;
    this.renderOfertaPreview();
    this.simRefresh();
    this.toast(`${kind === 'pitch' ? 'Pitch' : 'Oferta'} agora em ${this.secondsToTime(t)}${this._simD.offerOn ? '' : ' (a oferta está desabilitada)'} — salva ao sair desta etapa.`);
  },
  simMoveToNow(kind, idx){
    const t = Math.round(this._sim.t);
    if(kind === 'chat'){
      const c = this.chatMsgs[idx];
      if(!c) return;
      c.pre = t < 0;
      c.t = this.secondsToTime(Math.abs(t));
      this._simDirty.chat = true;
      this.sortChatMsgs();
      this.renderChatList();
    } else {
      const s = this.sales[idx];
      if(!s) return;
      if(t < 0) return this.toast('Venda só pode ficar depois do início do vídeo.');
      s.t = this.secondsToTime(t);
      this._simDirty.sales = true;
      this.renderSalesList();
    }
    this.simRefresh();
    this.toast(`Movida pro ${this.simFmt(t)} — salva ao sair desta etapa.`);
  },
  async saveSimAdjustments(){
    const dirty = this._simDirty || {};
    if(dirty.offer && !(await this.saveOfferConfig())) return false;
    if(dirty.chat && !(await this.saveChatConfig())) return false;
    if(dirty.sales && !(await this.saveSalesConfig())) return false;
    this._simDirty = {};
    return true;
  },

  // ---------- ETAPA "SINO / IA DO CHAT" ----------
  fillSinoForm(c){
    const set = (id, v)=>{ const el = document.getElementById(id); if(el) el.value = v; };
    const chk = (id, v)=>{ const el = document.getElementById(id); if(el) el.checked = !!v; };
    chk('sino_habilitado', c.habilitado);
    chk('sino_segurar', c.segurarChat);
    set('sino_atuacao', c.atuacao || 'ao_vivo');
    set('sino_objetivo', c.objetivo || 'venda');
    set('sino_limite', c.limiteRespostasIa ?? 20);
    set('sino_prompt', c.prompt || '');
    set('sino_agente', c.agenteId || '');
    set('sino_setorVenda', c.setorVenda || '');
    set('sino_setorSuporte', c.setorSuporte || '');
    chk('sino_followup', c.followupHabilitado ?? true);
    set('sino_followupDias', c.followupDias || '1,3');
    set('sino_tpl1', c.followupTemplate1 || '');
    set('sino_tpl2', c.followupTemplate2 || '');
    set('sino_followupPublico', c.followupPublico || 'chat');
    const st = document.getElementById('sino_ctxStatus');
    if(st) st.textContent = c.contextoEnviadoEm ? 'Enviado ao Sino ' + this.formatDateTime(c.contextoEnviadoEm) : (c.habilitado ? 'Aguardando envio' : 'Integração desligada');
  },
  async loadSinoStep(){
    if(!this.wz.id) return;
    const webinarId = this.wz.id;
    try{
      const [cfg, prompts] = await Promise.all([
        this.apiFetch(`/api/webinar-sino/${webinarId}/config`),
        this.apiFetch('/api/webinar-sino/prompts'),
      ]);
      if(this.wz.id !== webinarId) return;
      this.fillSinoForm(cfg);
      this._sinoAgenteNome = cfg.agenteNome || '';
      this._sinoPrompts = prompts;
      document.getElementById('sino_promptLib').innerHTML = '<option value="">Biblioteca de prompts…</option>'
        + prompts.map(p=>`<option value="${p.id}">${escapeHtmlAdmin(p.nome)}</option>`).join('');
      this._sinoLoadedFor = webinarId;
    }catch(e){
      this.toast('Erro ao carregar a integração com o Sino: ' + e.message);
      return;
    }
    this.loadSinoContext();
    // a lista de agentes vem do Sino - se ele ainda nao expoe, os campos aceitam texto livre
    this.apiFetch('/api/webinar-sino/agents').then(data=>{
      const hint = document.getElementById('sino_agentsHint');
      document.getElementById('sino_agentesList').innerHTML = (data.agentes||[]).map(a=>`<option value="${escapeHtmlAdmin(a.id)}">${escapeHtmlAdmin(a.nome)}</option>`).join('');
      document.getElementById('sino_setoresList').innerHTML = (data.setores||[]).map(s=>`<option value="${escapeHtmlAdmin(s.id)}">${escapeHtmlAdmin(s.nome)}</option>`).join('');
      this._sinoAgentes = data.agentes || [];
      hint.textContent = data.erro
        ? `Não consegui listar os agentes do Sino (${data.erro}) — digite o identificador do agente e dos setores.`
        : `${data.agentes.length} agente(s) e ${data.setores.length} setor(es) disponíveis no Sino.`;
    }).catch(()=>{});
  },
  async loadSinoContext(){
    if(!this.wz.id) return;
    const pre = document.getElementById('sino_ctxPreview');
    try{
      const ctx = await this.apiFetch(`/api/webinar-sino/${this.wz.id}/context`);
      pre.textContent = JSON.stringify({ webinar: ctx.webinar, oferta: ctx.oferta }, null, 2);
    }catch(e){ pre.textContent = 'Erro ao montar a prévia: ' + e.message; }
  },
  async saveSinoConfig(){
    if(!this.wz.id || this._sinoLoadedFor !== this.wz.id) return true; // etapa nao chegou a carregar
    const val = (id)=>document.getElementById(id).value;
    const agenteId = val('sino_agente').trim();
    const agente = (this._sinoAgentes||[]).find(a=>a.id===agenteId);
    const body = {
      habilitado: document.getElementById('sino_habilitado').checked,
      segurarChat: document.getElementById('sino_segurar').checked,
      atuacao: val('sino_atuacao'),
      objetivo: val('sino_objetivo'),
      limiteRespostasIa: Number(val('sino_limite')) || 20,
      prompt: val('sino_prompt'),
      agenteId,
      agenteNome: agente ? agente.nome : agenteId,
      setorVenda: val('sino_setorVenda').trim(),
      setorSuporte: val('sino_setorSuporte').trim(),
      followupHabilitado: document.getElementById('sino_followup').checked,
      followupDias: val('sino_followupDias'),
      followupTemplate1: val('sino_tpl1').trim(),
      followupTemplate2: val('sino_tpl2').trim(),
      followupPublico: val('sino_followupPublico'),
    };
    try{
      await this.apiFetch(`/api/webinar-sino/${this.wz.id}/config`, {method:'PUT', body: JSON.stringify(body)});
      return true;
    }catch(e){
      this.toast('Sino / IA: ' + e.message);
      return false;
    }
  },
  async sinoFillModelo(){
    const el = document.getElementById('sino_prompt');
    if(el.value.trim() && !confirm('Substituir o prompt atual pelo modelo?')) return;
    try{
      const data = await this.apiFetch('/api/webinar-sino/prompt-modelo');
      el.value = data.conteudo;
    }catch(e){ this.toast('Erro: ' + e.message); }
  },
  sinoApplyPromptFromLib(){
    const sel = document.getElementById('sino_promptLib');
    const p = (this._sinoPrompts||[]).find(x=>String(x.id)===sel.value);
    sel.value = '';
    if(!p) return;
    const el = document.getElementById('sino_prompt');
    if(el.value.trim() && !confirm(`Substituir o prompt atual por "${p.nome}"?`)) return;
    el.value = p.conteudo;
    document.getElementById('sino_objetivo').value = p.objetivo;
  },
  async sinoSavePromptToLib(){
    const conteudo = document.getElementById('sino_prompt').value.trim();
    if(!conteudo) return this.toast('Escreva o prompt antes de salvar como modelo');
    const nome = prompt('Nome do modelo (ex.: "Live de venda – Comunidade FERA")');
    if(!nome) return;
    try{
      await this.apiFetch('/api/webinar-sino/prompts', {method:'POST', body: JSON.stringify({nome, objetivo: document.getElementById('sino_objetivo').value, conteudo})});
      this._sinoPrompts = await this.apiFetch('/api/webinar-sino/prompts');
      document.getElementById('sino_promptLib').innerHTML = '<option value="">Biblioteca de prompts…</option>'
        + this._sinoPrompts.map(p=>`<option value="${p.id}">${escapeHtmlAdmin(p.nome)}</option>`).join('');
      this.toast('Modelo salvo na biblioteca');
    }catch(e){ this.toast('Erro: ' + e.message); }
  },
  async wzGo(n){
    if(n<0) n=0;
    if(n>12) n=12;
    if(this._savingWizardStep) return;
    const leaving = this.getActiveWizardStep();
    this.wz.step = leaving;
    if(leaving !== n){
      const ok = await this.saveWizardStep(leaving);
      if(!ok) return;
    }
    if(leaving === 11 && n !== 11) this.simClose();
    this.wz.step = n;
    document.querySelectorAll('.wizard-panel').forEach(p=>p.classList.toggle('active', +p.dataset.step===n));
    this.updateStepperUI();
    document.getElementById('wzBack').style.visibility = n===0 ? 'hidden' : 'visible';
    const nextBtn = document.getElementById('wzNext');
    if(n===12){
      nextBtn.textContent = 'Publicar Webinar';
      this.renderSummary();
    } else {
      nextBtn.textContent = 'Continuar';
      nextBtn.onclick = ()=>App.wzNext();
    }
    if(n===12){
      nextBtn.onclick = ()=>App.publishWebinar();
    }
    if(n===4) this.loadE4payCheckouts();
    if(n===5) this.renderReactionGraph();
    if(n===7) this.updateAudiencePreview();
    if(n===10) this.loadSinoStep();
    if(n===11) this.simOpen();
    document.querySelector('.wizard-card').scrollIntoView({behavior:'smooth', block:'start'});
  },
  async saveWizardStep(step){
    const nextBtn = document.getElementById('wzNext');
    const originalText = nextBtn?.textContent;
    this._savingWizardStep = true;
    if(nextBtn){ nextBtn.disabled = true; nextBtn.textContent = 'Salvando...'; }
    try{
      if(!this.wz.id && step !== 0){
        const created = await this.createWebinarDraft();
        if(!created) return false;
      }

      let ok = true;
      if(step === 0) ok = await this.saveBasicConfig();
      else if(step === 1) ok = await this.saveScheduleConfig();
      else if(step === 2) ok = await this.saveLoginConfig();
      else if(step === 3) ok = await this.saveVideoConfig();
      else if(step === 4) ok = await this.saveOfferConfig();
      else if(step === 5) ok = await this.saveChatConfig();
      else if(step === 6) ok = await this.saveSalesConfig();
      else if(step === 7) ok = await this.saveAudienceConfig();
      else if(step === 9) ok = await this.saveChatbotConfig();
      else if(step === 10) ok = await this.saveSinoConfig();
      else if(step === 11) ok = await this.saveSimAdjustments();
      return ok !== false;
    }finally{
      this._savingWizardStep = false;
      if(nextBtn){ nextBtn.disabled = false; nextBtn.textContent = originalText || 'Continuar'; }
    }
  },
  async saveBasicConfig(){
    if(!this.wz.id) return this.createWebinarDraft();
    try{
      const data = await this.apiFetch(`/api/webinars/${this.wz.id}`, {method:'PUT', body: JSON.stringify({
        nome: this.wz.nome,
        titulo: this.wz.titulo || undefined,
        nome_apresentador: this.wz.apresentador || undefined,
        slug: this.wz.slug || undefined,
      })});
      if(data && data.slug){
        this.wz.slug = data.slug;
        const slugEl = document.getElementById('w_slug');
        if(slugEl) slugEl.value = data.slug;
      }
      return true;
    }catch(e){
      this.toast('Erro ao salvar início: ' + e.message);
      return false;
    }
  },
  async createWebinarDraft(){
    if(!this.wz.nome){ this.toast('Dê um nome ao webinar antes de continuar'); return false; }
    try{
      const data = await this.apiFetch('/api/webinars', {method:'POST', body: JSON.stringify({
        nome: this.wz.nome,
        titulo: this.wz.titulo || undefined,
        nome_apresentador: this.wz.apresentador || undefined,
        slug: this.wz.slug || undefined,
      })});
      this.wz.id = data.id;
      this.wz.slug = data.slug;
      const slugEl = document.getElementById('w_slug');
      if(slugEl) slugEl.value = data.slug;
      return true;
    }catch(e){
      this.toast('Erro ao criar webinar: ' + e.message);
      return false;
    }
  },
  toggleBloqueioEspecifico(){
    const tipo = document.getElementById('selectBloqueioTipo').value;
    document.getElementById('bloqueioEspecificoField').style.display = tipo === 'especifico' ? 'block' : 'none';
  },
  async saveVideoConfig(){
    if(!this.wz.videoId) return true;
    const bloqueioTipo = document.getElementById('selectBloqueioTipo').value || null;
    const bloqueioMinutos = document.getElementById('inputBloqueioMinutos').value;
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/video`, {method:'PUT', body: JSON.stringify({
        video_id: this.wz.videoId,
        video_autoplay: document.getElementById('chkAutoplay').checked,
        video_fullscreen: document.getElementById('chkFullscreen').checked,
        ocultar_barra_progresso: document.getElementById('chkOcultarBarra').checked,
        bloquear_avanco_video: document.getElementById('chkBloquearAvanco').checked,
        modo_youtube: document.getElementById('chkModoYoutube').checked,
        modo_youtube_bloqueio_tipo: bloqueioTipo,
        modo_youtube_bloqueio_segundo: (bloqueioTipo === 'especifico' && bloqueioMinutos)
          ? Math.round(Number(bloqueioMinutos) * 60) : null,
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar configuração de vídeo: ' + e.message);
      return false;
    }
  },
  selectSchedType(t){
    document.getElementById('tabWebUnico').classList.toggle('active', t==='unico');
  },
  selectStartMode(mode){
    this.wz.startMode = mode;
    document.getElementById('startModeImmediate')?.classList.toggle('sel', mode === 'immediate');
    document.getElementById('startModeScheduled')?.classList.toggle('sel', mode === 'scheduled');
  },
  localDateTimeToIso(value){
    if(!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  },
  async saveScheduleConfig(){
    const dataInicioEl = document.getElementById('w_dataInicio');
    const dataFimEl = document.getElementById('w_dataFim');
    const fusoEl = document.getElementById('w_fusoHorario');
    const dataInicio = this.localDateTimeToIso(dataInicioEl?.value || '');
    const dataFim = this.localDateTimeToIso(dataFimEl?.value || '');

    if(this.wz.startMode === 'scheduled' && !dataInicio){
      this.toast('Informe a data e hora de início para obedecer o horário do webinar');
      return false;
    }

    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}`, {method:'PUT', body: JSON.stringify({
        tipo_agendamento: 'unico',
        repeticao_automatica: false,
        data_inicio: dataInicio,
        data_fim: dataFim,
        fuso_horario: fusoEl?.value || 'America/Sao_Paulo',
        usar_sala_espera: this.wz.startMode === 'scheduled',
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar agendamento: ' + e.message);
      return false;
    }
  },
  parseMoneyToCents(value){
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  },
  formatCentsToMoney(cents){
    const value = (Number(cents) || 0) / 100;
    return 'R$ ' + value.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  },
  parseTimeToSeconds(value){
    const parts = String(value || '').split(':').map(p=>Number(p.replace(/\D/g, '') || 0));
    if(parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if(parts.length === 2) return (parts[0] * 60) + parts[1];
    return parts[0] || 0;
  },
  async saveLoginConfig(){
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/login-config`, {method:'PUT', body: JSON.stringify({
        exibir_barra_progresso: document.getElementById('chkBarraProgresso')?.checked ?? true,
        progresso_inicial: Number(document.getElementById('w_progInicio')?.value || 0),
        pedir_whatsapp: document.getElementById('chkWhats')?.checked ?? true,
        pedir_empresa: document.getElementById('chkEmpresa')?.checked ?? false,
        titulo_botao: document.getElementById('w_botaoTitulo')?.value || 'Entrar na Aula',
        logo_url: document.getElementById('w_logoUrl')?.value.trim() || null,
        ocultar_marca: document.getElementById('chkOcultarMarca')?.checked ?? false,
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar login: ' + e.message);
      return false;
    }
  },
  maskTimeInput(el){
    // Pega os ÚLTIMOS 6 dígitos (não os primeiros) — o campo já nasce com "00:00:00"
    // (6 dígitos), então pegar os primeiros 6 sempre descartava o dígito recém-digitado
    // e o campo parecia travado, sem aceitar nada.
    const digits = el.value.replace(/\D/g, '').slice(-6);
    let hh = '00', mm = '00', ss = '00';
    if(digits.length <= 2){
      ss = digits.padStart(2, '0');
    } else if(digits.length <= 4){
      mm = digits.slice(0, -2).padStart(2, '0');
      ss = digits.slice(-2);
    } else {
      hh = digits.slice(0, -4).padStart(2, '0');
      mm = digits.slice(-4, -2);
      ss = digits.slice(-2);
    }
    el.value = digits ? `${hh}:${mm}:${ss}` : '';
  },
  async uploadOfertaImagem(file){
    if(!file) return;
    const textEl = document.getElementById('ofertaImgDropzoneText');
    const original = textEl.innerHTML;
    textEl.textContent = 'Enviando...';
    try{
      const formData = new FormData();
      formData.append('imagem', file);
      const data = await this.apiFetch('/api/uploads/image', { method: 'POST', body: formData });
      document.getElementById('w_ofertaImagemUrl').value = data.url;
      textEl.innerHTML = `<img src="${data.url}" style="max-height:60px;border-radius:6px;display:block;margin:0 auto 6px;">Imagem enviada — clique pra trocar`;
      this.renderOfertaPreview();
    }catch(e){
      textEl.innerHTML = original;
      this.toast('Erro ao enviar imagem: ' + e.message);
    }
  },
  handleOfertaImgDrop(event){
    event.preventDefault();
    event.currentTarget.classList.remove('drag');
    const file = event.dataTransfer?.files?.[0];
    if(file) this.uploadOfertaImagem(file);
  },
  async uploadLogoImagem(file){
    if(!file) return;
    const textEl = document.getElementById('logoImgDropzoneText');
    const original = textEl.innerHTML;
    textEl.textContent = 'Enviando...';
    try{
      const formData = new FormData();
      formData.append('imagem', file);
      const data = await this.apiFetch('/api/uploads/image', { method: 'POST', body: formData });
      document.getElementById('w_logoUrl').value = data.url;
      textEl.innerHTML = `<img src="${data.url}" style="max-height:60px;border-radius:6px;display:block;margin:0 auto 6px;">Imagem enviada — clique pra trocar`;
      this.renderLoginPreview();
    }catch(e){
      textEl.innerHTML = original;
      this.toast('Erro ao enviar imagem: ' + e.message);
    }
  },
  handleLogoImgDrop(event){
    event.preventDefault();
    event.currentTarget.classList.remove('drag');
    const file = event.dataTransfer?.files?.[0];
    if(file) this.uploadLogoImagem(file);
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
  renderSuporteColorPreview(){
    const color = document.getElementById('w_suporteCor')?.value || '#FFCC00';
    const transp = Number(document.getElementById('w_suporteCorTransparencia')?.value || 0);
    const label = document.getElementById('suporteCorTransparenciaLabel');
    if(label) label.textContent = transp;
    const bubble = document.getElementById('suporteColorPreviewBubble');
    if(bubble) bubble.style.background = this.hexToRgba(color, transp);
  },
  async loadE4payCheckouts(){
    const select = document.getElementById('w_checkoutSlug');
    if(!select || !this.wz.id) return;
    select.innerHTML = '<option value="">Carregando...</option>';
    try{
      const list = await this.apiFetch(`/api/webinars/${this.wz.id}/e4pay-checkouts`);
      this._e4payCheckouts = list;
      const currentUrl = document.getElementById('w_linkCheckout')?.value || '';
      const match = list.find(c=>c.checkout_url === currentUrl);
      select.innerHTML = list.map(c=>`<option value="${c.slug}">${escapeHtmlAdmin(c.nome_produto)} — ${this.formatCentsToMoney(c.preco_centavos)}</option>`).join('')
        + '<option value="__manual__">Outro link (colar manualmente)</option>';
      select.value = match ? match.slug : (list[0] ? list[0].slug : '__manual__');
      this.setModoCheckout(this.wz.modoCheckout || 'link');
    }catch(e){
      select.innerHTML = '<option value="__manual__">Não foi possível carregar — cole o link manualmente</option>';
      select.value = '__manual__';
      this.setModoCheckout(this.wz.modoCheckout || 'link');
    }
  },
  onCheckoutSlugChange(){
    const select = document.getElementById('w_checkoutSlug');
    const isEmbutido = this.wz.modoCheckout === 'embutido';
    const manual = !isEmbutido && select && select.value === '__manual__';
    const manualField = document.getElementById('linkCheckoutManualField');
    if(manualField) manualField.style.display = manual ? 'block' : 'none';
    if(!manual && select){
      const chosen = (this._e4payCheckouts || []).find(c=>c.slug === select.value);
      if(chosen) document.getElementById('w_linkCheckout').value = chosen.checkout_url;
    }
  },
  setChatCreateTab(tab){
    document.getElementById('chatTabIndividual').classList.toggle('active', tab === 'individual');
    document.getElementById('chatTabPlanilha').classList.toggle('active', tab === 'planilha');
    document.getElementById('chatCreateIndividual').style.display = tab === 'individual' ? 'block' : 'none';
    document.getElementById('chatCreatePlanilha').style.display = tab === 'planilha' ? 'block' : 'none';
  },
  setModoCheckout(mode){
    this.wz.modoCheckout = mode;
    document.getElementById('modoCheckoutLinkCard').classList.toggle('sel', mode === 'link');
    document.getElementById('modoCheckoutEmbutidoCard').classList.toggle('sel', mode === 'embutido');
    document.getElementById('checkoutDuracaoField').style.display = mode === 'embutido' ? 'flex' : 'none';
    const select = document.getElementById('w_checkoutSlug');
    const manualOption = select?.querySelector('option[value="__manual__"]');
    const hint = document.getElementById('checkoutSlugHint');
    if(mode === 'embutido'){
      if(manualOption) manualOption.style.display = 'none';
      if(select && select.value === '__manual__' && this._e4payCheckouts?.length){
        select.value = this._e4payCheckouts[0].slug;
      }
      if(hint) hint.textContent = 'O checkout embutido só funciona com checkouts da E4Pay (por segurança do navegador).';
    } else {
      if(manualOption) manualOption.style.display = '';
      if(hint) hint.textContent = 'Lista os checkouts ativos da sua conta E4Pay. Pra usar outro provedor, escolha "Outro link".';
    }
    this.onCheckoutSlugChange();
  },
  async saveOfferConfig(){
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/offer-config`, {method:'PUT', body: JSON.stringify({
        nome_oferta: document.getElementById('w_produto')?.value || this.wz.produto || 'Oferta',
        titulo_oferta: document.getElementById('w_ofertaTitulo')?.value || null,
        preco_original_centavos: this.parseMoneyToCents(document.getElementById('w_precoOriginal')?.value || ''),
        preco_oferta_centavos: this.parseMoneyToCents(document.getElementById('w_preco')?.value || ''),
        texto_botao: document.getElementById('w_ofertaBotao')?.value || 'inscreva-se aqui',
        cor_botao: document.getElementById('w_ofertaBotaoCor')?.value || '#D93B3B',
        imagem_desktop_url: document.getElementById('w_ofertaImagemUrl')?.value.trim() || null,
        inicio_oferta_segundos: document.getElementById('w_ofertaInicio')?.value.trim() ? this.parseTimeToSeconds(document.getElementById('w_ofertaInicio').value) : null,
        inicio_pitch_segundos: document.getElementById('w_pitchInicio')?.value.trim() ? this.parseTimeToSeconds(document.getElementById('w_pitchInicio').value) : null,
        link_checkout: document.getElementById('w_linkCheckout')?.value.trim() || '',
        oferta_desabilitada: !!document.getElementById('chkOfertaDesabilitada')?.checked,
        modo_checkout: this.wz.modoCheckout || 'link',
        checkout_duracao_segundos: Number(document.getElementById('w_checkoutDuracao')?.value || 600),
        reopen_cor: document.getElementById('w_reopenCor')?.value || '#FFCC00',
        checkout_pip_tamanho: document.getElementById('w_checkoutPipTamanho')?.value || 'medio',
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar oferta: ' + e.message);
      return false;
    }
  },
  async saveChatConfig(){
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/chat-messages`, {method:'PUT', body: JSON.stringify({
        messages: this.chatMsgs.map(c=>({
          segundo_exibicao: (c.pre ? -1 : 1) * this.parseTimeToSeconds(c.t),
          nome_exibido: c.n,
          mensagem: c.m,
          eh_suporte: !!c.s,
        })),
      })});
      await this.apiFetch(`/api/webinars/${this.wz.id}`, {method:'PUT', body: JSON.stringify({
        chat_tamanho_fonte: document.getElementById('chatFontSize')?.value || 'media',
        habilitar_reacoes: !!document.getElementById('chkHabilitarReacoes')?.checked,
        suporte_cor_destaque: document.getElementById('w_suporteCor')?.value || '#FFCC00',
        suporte_cor_transparencia: Number(document.getElementById('w_suporteCorTransparencia')?.value || 0),
        tema_sala: document.getElementById('w_temaSala')?.value || 'escuro',
      })});
      await this.apiFetch(`/api/webinars/${this.wz.id}/reaction-keyframes`, {method:'PUT', body: JSON.stringify({
        keyframes: (this.reactionPoints || []).map(p=>({segundo: p.segundo, intensidade: p.intensidade})),
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar chat: ' + e.message);
      return false;
    }
  },
  makeDefaultReactionPoints(){
    const totalSeconds = 3600;
    const numPoints = 37;
    const pts = [];
    for(let i=0;i<numPoints;i++){
      pts.push({segundo: Math.round(i*totalSeconds/(numPoints-1)), intensidade: 15});
    }
    return pts;
  },
  setReactionPreset(value){
    if(!this.reactionPoints) this.reactionPoints = this.makeDefaultReactionPoints();
    this.reactionPoints.forEach(p=>p.intensidade = value);
    this.renderReactionGraph();
  },
  initReactionGraphEvents(){
    if(this._reactionGraphBound) return;
    const canvas = document.getElementById('reactionGraph');
    if(!canvas) return;
    this._reactionGraphBound = true;
    const tip = document.getElementById('reactionGraphTip');
    let dragging = false;

    const posFromEvent = (e)=>{
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        cx: (clientX - rect.left) * (canvas.width / rect.width),
        cy: (clientY - rect.top) * (canvas.height / rect.height),
        cssX: clientX - rect.left,
        cssY: clientY - rect.top,
      };
    };
    const idxFromCanvasX = (cx)=>{
      const geom = this._reactionGraphGeom;
      const pts = this.reactionPoints;
      if(!geom || !pts || !pts.length) return null;
      const stepX = geom.plotW / (pts.length - 1);
      return Math.max(0, Math.min(pts.length - 1, Math.round((cx - geom.marginLeft) / stepX)));
    };
    const showTip = (pos, idx)=>{
      if(!tip) return;
      const p = this.reactionPoints[idx];
      tip.textContent = this.secondsToTime(p.segundo) + ' — ' + p.intensidade + '%';
      tip.style.left = pos.cssX + 'px';
      tip.style.top = Math.max(0, pos.cssY - 10) + 'px';
      tip.style.display = 'block';
    };
    const hideTip = ()=>{ if(tip) tip.style.display = 'none'; };

    const paint = (e)=>{
      const pos = posFromEvent(e);
      const geom = this._reactionGraphGeom;
      const idx = idxFromCanvasX(pos.cx);
      if(idx == null || !geom) return;
      const intensidade = Math.max(0, Math.min(100, Math.round((1 - (pos.cy - geom.marginTop) / geom.plotH) * 100)));
      this.reactionPoints[idx].intensidade = intensidade;
      this.renderReactionGraph();
      showTip(pos, idx);
    };

    canvas.addEventListener('mousedown', e=>{ dragging = true; paint(e); });
    window.addEventListener('mousemove', e=>{ if(dragging) paint(e); });
    window.addEventListener('mouseup', ()=>{ dragging = false; });
    canvas.addEventListener('mousemove', e=>{
      if(dragging) return;
      const pos = posFromEvent(e);
      const idx = idxFromCanvasX(pos.cx);
      if(idx != null) showTip(pos, idx);
    });
    canvas.addEventListener('mouseleave', hideTip);
    canvas.addEventListener('touchstart', e=>{ dragging = true; paint(e); e.preventDefault(); }, {passive:false});
    canvas.addEventListener('touchmove', e=>{ if(dragging){ paint(e); e.preventDefault(); } }, {passive:false});
    canvas.addEventListener('touchend', ()=>{ dragging = false; hideTip(); });
  },
  renderReactionGraph(){
    this.initReactionGraphEvents();
    const canvas = document.getElementById('reactionGraph');
    const pts = this.reactionPoints;
    if(!canvas || !pts || !pts.length) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const marginLeft = 36, marginTop = 6, marginBottom = 6;
    const plotW = w - marginLeft;
    const plotH = h - marginTop - marginBottom;
    this._reactionGraphGeom = {marginLeft, marginTop, plotW, plotH};

    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    [0,25,50,75,100].forEach(pct=>{
      const y = marginTop + plotH - (pct/100)*plotH;
      ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.fillText(pct+'%', marginLeft - 6, y);
    });

    const stepX = plotW / (pts.length - 1);
    ctx.beginPath();
    pts.forEach((p,i)=>{
      const x = marginLeft + i*stepX;
      const y = marginTop + plotH - (p.intensidade/100)*plotH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = '#F2C230';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.lineTo(marginLeft + plotW, marginTop + plotH);
    ctx.lineTo(marginLeft, marginTop + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(242,194,48,.18)';
    ctx.fill();

    const dur = pts[pts.length-1].segundo;
    const durEl = document.getElementById('reactionGraphDuration');
    if(durEl) durEl.textContent = 'duração estimada: ' + Math.round(dur/60) + ' min';
  },
  async saveSalesConfig(){
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/sales-notifications`, {method:'PUT', body: JSON.stringify({
        sales: this.sales.map(s=>({
          segundo_exibicao: this.parseTimeToSeconds(s.t),
          nome_exibido: s.n,
          titulo_notificacao: 'Venda confirmada!',
        })),
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar vendas: ' + e.message);
      return false;
    }
  },
  setAudienceType(type){
    this.wz.audienceType = type;
    document.querySelectorAll('input[name="audTipo"]').forEach(input=>{
      input.checked = input.value === type;
    });
    this.updateAudiencePreview();
  },
  getAudienceValues(){
    const minEl = document.getElementById('audMin');
    const maxEl = document.getElementById('audMax');
    const min = Math.max(0, Number(minEl?.value || 0));
    const max = Math.max(min, Number(maxEl?.value || min));
    if(maxEl && Number(maxEl.value || 0) < min) maxEl.value = min;
    return {
      tipo: this.wz.audienceType || document.querySelector('input[name="audTipo"]:checked')?.value || 'nenhuma',
      min,
      max,
      mostrarBotaoAoVivo: document.getElementById('audLiveToggle')?.checked ?? true,
    };
  },
  updateAudiencePreview(){
    const cfg = this.getAudienceValues();
    const minPreview = document.getElementById('audMinPreview');
    const maxPreview = document.getElementById('audMaxPreview');
    if(minPreview) minPreview.textContent = cfg.min;
    if(maxPreview) maxPreview.textContent = cfg.max;

    const xs = [70, 150, 230, 310, 390, 470, 550, 590];
    const raw = cfg.tipo === 'fixa'
      ? xs.map(()=>cfg.max)
      : [cfg.min, cfg.max, cfg.max, cfg.max, cfg.max, Math.round(cfg.max - ((cfg.max - cfg.min) * .35)), Math.round(cfg.max - ((cfg.max - cfg.min) * .65)), cfg.min];
    const chartMax = Math.max(80, cfg.max + 10);
    const points = raw.map((value, idx)=>{
      const y = 300 - ((value / chartMax) * 270);
      return { x: xs[idx], y: Math.max(30, Math.min(300, y)), value };
    });
    const line = document.getElementById('audChartLine');
    const dots = document.getElementById('audChartDots');
    if(line) line.setAttribute('points', points.map(p=>`${p.x},${p.y}`).join(' '));
    if(dots) dots.innerHTML = points.map(p=>`<circle class="aud-chart-dot" cx="${p.x}" cy="${p.y}" r="5"></circle>`).join('');
  },
  async saveAudienceConfig(){
    const cfg = this.getAudienceValues();
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}`, {method:'PUT', body: JSON.stringify({
        tipo_audiencia: cfg.tipo,
        audiencia_min_participantes: cfg.min,
        audiencia_max_participantes: cfg.max,
        mostrar_botao_ao_vivo: cfg.mostrarBotaoAoVivo,
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar audiência: ' + e.message);
      return false;
    }
  },
  async saveChatbotConfig(){
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/chatbot-keywords`, {method:'PUT', body: JSON.stringify({
        keywords: this.keywords.map(k=>({
          remetente_exibido: k.rem,
          palavra_chave: k.kw,
          resposta_automatica: k.resp,
          delay_segundos: Number(String(k.delay || '5').replace(/\D/g, '') || 5),
        })),
      })});
      return true;
    }catch(e){
      this.toast('Erro ao salvar chatbot: ' + e.message);
      return false;
    }
  },
  renderLoginPreview(){
    const whats = document.getElementById('chkWhats')?.checked;
    const emp = document.getElementById('chkEmpresa')?.checked;
    let html = `<div class="field" style="margin-bottom:8px;"><input class="input" placeholder="Nome" style="width:100%;" disabled></div>
                <div class="field" style="margin-bottom:8px;"><input class="input" placeholder="E-mail" style="width:100%;" disabled></div>`;
    if(whats) html += `<div class="field" style="margin-bottom:8px;"><input class="input" placeholder="WhatsApp" style="width:100%;" disabled></div>`;
    if(emp) html += `<div class="field" style="margin-bottom:8px;"><input class="input" placeholder="Empresa" style="width:100%;" disabled></div>`;
    document.getElementById('loginPreview').innerHTML = html;
    const t = document.getElementById('w_tituloWebinar'); if(t) document.getElementById('loginPreviewTitle').textContent = t.value;
    const b = document.getElementById('w_botaoTitulo'); if(b) document.getElementById('loginPreviewBtn').textContent = b.value || 'Entrar na Aula';
    const barra = document.getElementById('chkBarraProgresso');
    const pct = document.getElementById('w_progInicio');
    const badge = document.getElementById('loginPreviewBadge');
    if(badge){
      badge.style.display = (barra && !barra.checked) ? 'none' : 'block';
      badge.textContent = (pct?.value || '63') + '% das vagas preenchidas...';
    }
  },
  buildVideoPickGrid(){
    const el = document.getElementById('videoPickGrid');
    el.innerHTML = this.videos.map((v,i)=>{
      const dur = this.formatVideoDuration(v.duracaoSegundos);
      return `
      <div class="video-pick ${v.id===this.wz.videoId?'sel':''}" onclick="App.pickVideo(this,${v.id})">
        <div class="vp-thumb" ${v.thumbnailUrl ? `style="background-image:url('${escapeHtmlAdmin(v.thumbnailUrl)}');background-size:cover;background-position:center;"` : ''}>
          ${!v.thumbnailUrl ? ICONS.play : ''}
          ${v.playbackUrl ? `<button type="button" class="vp-preview-btn" onclick="event.stopPropagation();App.openVideoPreview(${v.id})" title="Pré-visualizar">${ICONS.play}</button>` : ''}
          ${dur ? `<span class="thumb-duration">${dur}</span>` : ''}
        </div>
        <div class="vp-name">${escapeHtmlAdmin(v.nome)}</div>
      </div>`;
    }).join('');
    if(!this.wz.videoId && this.videos[0]) this.wz.videoId = Number(this.videos[0].id);
    this.applyVideoDurationToWizard();
  },
  pickVideo(el, videoId){
    document.querySelectorAll('.video-pick').forEach(v=>v.classList.remove('sel'));
    el.classList.add('sel');
    this.wz.videoId = Number(videoId);
    this.applyVideoDurationToWizard();
  },
  applyVideoDurationToWizard(){
    const v = this.videos.find(x=>x.id===this.wz.videoId);
    const durField = document.getElementById('w_duracao');
    if(v && v.duracaoSegundos && durField){
      durField.value = Math.round(v.duracaoSegundos / 60);
      this.wz.duracao = Math.round(v.duracaoSegundos / 60);
    }
  },
  triggerUpload(context){
    this._uploadContext = context;
    document.getElementById('videoFileInput').click();
  },
  async uploadVideoFile(file){
    let initData;
    try{
      initData = await this.apiFetch('/api/videos/upload-init', {method:'POST', body: JSON.stringify({titulo: file.name})});
    }catch(e){
      this.toast('Erro ao iniciar envio: ' + e.message);
      return;
    }

    const progressBox = document.getElementById('uploadProgressBox');
    const rowId = 'upl_' + initData.id;
    if(progressBox){
      progressBox.insertAdjacentHTML('beforeend', `
        <div class="upload-progress-item" id="${rowId}">
          <span>${file.name}</span><div class="bar"><div style="width:0%;"></div></div><span class="pct">0%</span>
        </div>`);
    }

    await new Promise((resolve)=>{
      const upload = new tus.Upload(file, {
        endpoint: initData.tusEndpoint,
        retryDelays: [0, 1000, 3000, 5000],
        headers: {
          AuthorizationSignature: initData.assinatura,
          AuthorizationExpire: String(initData.expira),
          VideoId: initData.bunnyVideoId,
          LibraryId: String(initData.libraryId),
        },
        metadata: { filetype: file.type, title: file.name },
        onError: (error)=>{
          this.toast('Falha no envio: ' + error.message);
          resolve();
        },
        onProgress: (bytesUploaded, bytesTotal)=>{
          const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
          const row = document.getElementById(rowId);
          if(row){ row.querySelector('.bar > div').style.width = pct + '%'; row.querySelector('.pct').textContent = pct + '%'; }
        },
        onSuccess: async ()=>{
          this.toast('Envio concluído! Processando vídeo na Bunny Stream...');
          await this.pollVideoStatus(initData.id);
          document.getElementById(rowId)?.remove();
          resolve();
        },
      });
      upload.start();
    });

    await this.loadVideos();
    this.renderVideos();
    if(this._uploadContext === 'wizard'){
      this.wz.videoId = initData.id;
      this.buildVideoPickGrid();
    }
  },
  async pollVideoStatus(id){
    for(let i=0;i<40;i++){
      let data;
      try{ data = await this.apiFetch('/api/videos/' + id + '/status'); }catch(e){ return; }
      if(data.status_processamento === 'pronto'){ this.toast('Vídeo pronto! ✓'); return; }
      if(data.status_processamento === 'erro'){ this.toast('Erro ao processar o vídeo na Bunny Stream'); return; }
      await new Promise(r=>setTimeout(r, 3000));
    }
    this.toast('O vídeo ainda está processando — confira a Biblioteca de Vídeos em instantes');
  },
  buildChatList(){ this.renderChatList(); },
  addChatMsg(){
    const t = document.getElementById('chatTime').value.trim() || '00:00:00';
    const n = document.getElementById('chatName').value.trim() || 'Espectador';
    const m = document.getElementById('chatMsg').value.trim();
    const s = document.getElementById('chatIsSuporte').checked;
    const pre = document.getElementById('chatIsPreLive').checked;
    if(!m) return this.toast('Escreva uma mensagem primeiro');
    this.chatMsgs.push({t,n,m,s,pre});
    this.sortChatMsgs();
    document.getElementById('chatTime').value='';
    document.getElementById('chatName').value='';
    document.getElementById('chatMsg').value='';
    document.getElementById('chatIsSuporte').checked = false;
    document.getElementById('chatIsPreLive').checked = false;
    this.togglePreLiveLabel();
    this.renderChatList();
  },
  togglePreLiveLabel(){
    const pre = document.getElementById('chatIsPreLive')?.checked;
    const label = document.getElementById('chatTimeLabel');
    if(label) label.textContent = pre ? 'Minutos antes de começar (mm:ss)' : 'Tempo (hh:mm:ss)';
  },
  // Pré-live (pre:true) é tratado como "negativo" (antes do início) e sempre vem antes
  // do zero; entre mensagens do mesmo tipo, ordena pelo tempo normalmente.
  sortChatMsgs(){
    const eff = (c)=>(c.pre ? -1 : 1) * this.parseTimeToSeconds(c.t);
    this.chatMsgs.sort((a,b)=>eff(a)-eff(b));
  },
  renderChatList(){
    document.getElementById('chatList').innerHTML = this.chatMsgs.map((c,i)=>`
      <div class="chat-row ${c.s?'suporte':''}"><span class="c-time">${c.pre ? '-'+c.t : c.t}</span>
      <span class="c-body"><b>${c.n}:</b> ${c.m}${c.s?'<span class="c-badge">SUPORTE</span>':''}${c.pre?'<span class="c-badge" style="background:var(--yellow-soft);color:var(--yellow);">PRÉ-LIVE</span>':''}</span>
      <button class="c-del" onclick="App.delChatMsg(${i})">${ICONS.trash}</button></div>
    `).join('') || `<div class="empty-state">Nenhuma mensagem ainda — adicione manualmente ou envie uma planilha.</div>`;
  },
  delChatMsg(i){ this.chatMsgs.splice(i,1); this.renderChatList(); },
  delAllChatMsgs(){
    if(this.chatMsgs.length && !confirm('Excluir todas as mensagens do chat deste webinar?')) return;
    this.chatMsgs = [];
    this.renderChatList();
    this.toast('Chat esvaziado');
  },

  downloadChatTemplate(){
    if(!window.XLSX) return this.toast('Biblioteca de planilha ainda não carregou, tente de novo em instantes');
    const header = ['Hora para ser enviado','Minuto para ser enviado','Segundo para ser enviado','Nome do participante','Texto enviado','Suporte(Caso não seja, deixe em branco)'];
    const example = [
      ['00','00','15','Maria','Boa noite, cheguei a tempo!',''],
      ['00','00','20','Suporte - Equipe','Sejam bem-vindos à aula!','true'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chat');
    XLSX.writeFile(wb, 'modelo-chat-webnarpro.xlsx');
  },

  handleChatFileSelect(e){
    const file = e.target.files[0];
    if(file) this.importChatFile(file);
    e.target.value = '';
  },
  handleChatFileDrop(e){
    e.preventDefault();
    e.currentTarget.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if(file) this.importChatFile(file);
  },
  importChatFile(file){
    if(!window.XLSX) return this.toast('Biblioteca de planilha ainda não carregou, tente de novo em instantes');
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try{
        const wb = XLSX.read(ev.target.result, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1, blankrows:false});
        let added = 0;
        rows.slice(1).forEach(row=>{
          if(!row || row.length === 0) return;
          const [hora, minuto, segundo, nome, texto, suporte] = row;
          const mensagem = String(texto ?? '').trim();
          if(!mensagem) return;
          const totalSecs = (Number(hora)||0)*3600 + (Number(minuto)||0)*60 + (Number(segundo)||0);
          const isSuporte = suporte !== undefined && suporte !== null && String(suporte).trim() !== '';
          this.chatMsgs.push({
            t: this.secondsToTime(totalSecs),
            n: String(nome ?? '').trim() || 'Espectador',
            m: mensagem,
            s: isSuporte,
          });
          added++;
        });
        if(added === 0){ this.toast('Nenhuma linha válida encontrada na planilha'); return; }
        this.sortChatMsgs();
        this.renderChatList();
        this.toast(`${added} mensagens importadas da planilha!`);
      }catch(err){
        this.toast('Erro ao ler a planilha: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },
  renderOfertaPreview(){
    const imgUrl = document.getElementById('w_ofertaImagemUrl')?.value;
    const imgBox = document.getElementById('ofertaPreviewImg');
    if(imgBox){
      if(imgUrl){
        imgBox.style.backgroundImage = `url("${imgUrl}")`;
        imgBox.style.backgroundSize = 'cover';
        imgBox.style.backgroundPosition = 'center';
        imgBox.textContent = '';
      } else {
        imgBox.style.backgroundImage = '';
      }
    }
    const t = document.getElementById('w_ofertaTitulo'); if(t && !imgUrl) document.getElementById('ofertaPreviewImg').textContent = (t.value||'').slice(0,20) || 'F.E.R.A';
    const po = document.getElementById('w_precoOriginal'); if(po) document.getElementById('ofertaPreviewOriginal').textContent = 'De ' + po.value;
    const pp = document.getElementById('w_preco'); if(pp) document.getElementById('ofertaPreviewPreco').textContent = 'Por ' + pp.value;
    const btn = document.getElementById('w_ofertaBotao'); if(btn) document.getElementById('ofertaPreviewBtn').textContent = btn.value || 'inscreva-se aqui';
    const btnCor = document.getElementById('w_ofertaBotaoCor');
    const previewBtn = document.getElementById('ofertaPreviewBtn');
    if(btnCor && previewBtn){ previewBtn.style.background = btnCor.value; previewBtn.style.borderColor = btnCor.value; }
  },
  selTimerLayout(el){
    el.parentElement.querySelectorAll('.type-card').forEach(c=>c.classList.remove('sel'));
    el.classList.add('sel');
  },
  selAudiencia(el){
    el.parentElement.querySelectorAll('.radio-card').forEach(c=>c.classList.remove('sel'));
    el.classList.add('sel');
  },
  sales: loadLS('wp_sales_v2', []),
  renderSalesList(){
    document.getElementById('salesList').innerHTML = this.sales.map((s,i)=>`
      <div class="sale-item"><span class="s-time">${s.t}</span><span style="flex:1;">${s.n} comprou</span>
      <button onclick="App.sales.splice(${i},1);saveLS('wp_sales_v2',App.sales);App.renderSalesList();">${ICONS.trash}</button></div>
    `).join('');
  },
  addSale(){
    const t = document.getElementById('saleTime').value.trim() || '00:00';
    const n = document.getElementById('saleName').value.trim();
    if(!n) return this.toast('Escreva um nome primeiro');
    this.sales.push({t, n});
    saveLS('wp_sales_v2', this.sales);
    document.getElementById('saleTime').value=''; document.getElementById('saleName').value='';
    this.renderSalesList();
  },
  keywords: loadLS('wp_keywords_v2', []),
  renderKeywords(){
    document.getElementById('keywordTbody').innerHTML = this.keywords.map((k,i)=>`
      <tr><td>${k.rem}</td><td>${k.kw}</td><td>${k.resp}</td><td>${k.delay}</td>
      <td style="text-align:right;"><div class="iconbar" style="justify-content:flex-end;">
        <button title="Editar">${ICONS.edit}</button>
        <button title="Excluir" onclick="App.keywords.splice(${i},1);saveLS('wp_keywords_v2',App.keywords);App.renderKeywords();">${ICONS.trash}</button>
      </div></td></tr>`).join('');
  },
  addKeyword(){
    const rem = document.getElementById('kw_remetente').value.trim() || 'Suporte';
    const kw = document.getElementById('kw_palavra').value.trim();
    const resp = document.getElementById('kw_resposta').value.trim();
    const delay = document.getElementById('kw_delay').value.trim();
    if(!kw || !resp) return this.toast('Preencha a palavra-chave e a resposta');
    this.keywords.push({rem, kw, resp, delay:(delay||'5')+'s'});
    saveLS('wp_keywords_v2', this.keywords);
    ['kw_remetente','kw_palavra','kw_resposta','kw_delay'].forEach(id=>document.getElementById(id).value='');
    this.renderKeywords();
  },
  renderSummary(){
    const items = [
      ['Nome do webinar', this.wz.nome || '(sem nome)'],
      ['Tipo', 'Webinar único'],
      ['Início', this.wz.startMode === 'scheduled' ? 'Obedecer horário de início' : 'Quando o aluno entrar'],
      ['Duração', this.wz.duracao + ' minutos'],
      ['Vídeo selecionado', this.videos.find(v=>v.id===this.wz.videoId)?.nome || '—'],
      ['Produto', this.wz.produto],
      ['Preço', this.wz.preco],
      ['Mensagens de chat configuradas', this.chatMsgs.length],
      ['Vendas configuradas', this.sales.length]
    ];
    document.getElementById('summaryList').innerHTML = items.map(([k,v])=>`
      <div class="summary-item"><div class="s-k">${k}</div><div class="s-v">${v}</div></div>`).join('');
    if(this.wz.slug){
      const links = this.webinarLinks(this.wz.slug);
      document.getElementById('linkPrincipal').value = links.principal;
      document.getElementById('linkMagic').value = links.magic;
      document.getElementById('linkReplay').value = links.replay;
    }else{
      const placeholder = 'Clique em "Publicar Webinar" para gerar o link';
      document.getElementById('linkPrincipal').value = placeholder;
      document.getElementById('linkMagic').value = placeholder;
      document.getElementById('linkReplay').value = placeholder;
    }
  },
  copyLink(id){
    const el = document.getElementById(id);
    if(el){
      el.select();
      this.writeToClipboard(el.value, 'Link copiado!');
    }
  },
  async publishWebinar(){
    if(!this.wz.id){
      const ok = await this.createWebinarDraft();
      if(!ok) return;
    }
    const scheduleOk = await this.saveScheduleConfig();
    if(!scheduleOk) return;
    await this.saveVideoConfig();
    try{
      const data = await this.apiFetch(`/api/webinars/${this.wz.id}/publish`, {method:'POST'});
      document.getElementById('linkPrincipal').value = data.salaPrincipal;
      document.getElementById('linkMagic').value = data.magicLink;
      document.getElementById('linkReplay').value = data.replay;
      document.getElementById('wizardBanner').innerHTML = `<div class="wizard-created-banner">${ICONS.check} Webinar publicado com sucesso!</div>`;
      await this.loadWebinars();
      this.renderWebinars();
      this.renderDashboard();
      setTimeout(()=>this.showView('webinars'), 900);
    }catch(e){
      this.toast('Erro ao publicar: ' + e.message);
    }
  },

  // ---------- VÍDEOS ----------
  renderVideos(){
    document.getElementById('videosTbody').innerHTML = this.videos.map(v=>{
      const dur = this.formatVideoDuration(v.duracaoSegundos);
      const clickable = v.status === 'pronto' && v.playbackUrl;
      return `
      <tr>
        <td>
          <div class="row-thumb" ${clickable ? `onclick="App.openVideoPreview(${v.id})" style="cursor:pointer;"` : ''} title="${clickable ? 'Clique para assistir' : ''}">
            <div class="thumb thumb-wide" ${v.thumbnailUrl ? `style="background-image:url('${escapeHtmlAdmin(v.thumbnailUrl)}');background-size:cover;background-position:center;"` : ''}>
              ${!v.thumbnailUrl ? ICONS.play : `<span class="thumb-play-overlay">${ICONS.play}</span>`}
              ${dur ? `<span class="thumb-duration">${dur}</span>` : ''}
            </div>
            <div class="row-title">${escapeHtmlAdmin(v.nome)}</div>
          </div>
        </td>
        <td>${v.data}</td><td>${v.tamanho}</td>
        <td style="text-align:right;">
          ${v.status === 'pronto' ? `<span class="badge badge-green">Pronto</span>`
            : v.status === 'erro' ? `<span class="badge badge-grey">Erro</span>`
            : `<span class="badge badge-yellow">Processando…</span>`}
          <button class="icon-btn" style="margin-left:8px;">${ICONS.more}</button>
        </td>
      </tr>`;
    }).join('');
  },

  // ---------- SALAS DE ATENDIMENTO (inbox estilo Sino) ----------
  salasWebinarId: null,
  salasFiltro: 'pendentes',
  salasItems: new Map(),
  salasCursor: null,
  salasSelectedId: null,
  salasContadores: {},
  SALAS_FILTROS: [
    {id:'pendentes', label:'Pendentes'},
    {id:'ia', label:'IA respondendo'},
    {id:'humano', label:'Com humano'},
    {id:'minhas', label:'Minhas'},
    {id:'encerradas', label:'Encerradas'},
  ],
  async renderSalasPicker(){
    const grid = document.getElementById('salasPickerGrid');
    const search = document.getElementById('salasPickerSearch')?.value.trim().toLowerCase() || '';
    grid.innerHTML = '<div class="empty-state">Carregando…</div>';
    try{
      let rows = await this.apiFetch('/api/webinars/ongoing');
      if(search) rows = rows.filter(w=>w.nome.toLowerCase().includes(search));
      if(rows.length === 0){
        grid.innerHTML = '<div class="empty-state">Nenhum webinar em andamento ou com atendimentos ainda.</div>';
        return;
      }
      grid.innerHTML = rows.map(w=>`
        <div class="card" style="margin:0;">
          <div class="thumb thumb-wide" style="width:100%;height:110px;margin-bottom:12px;${w.thumbnailUrl ? `background-image:url('${escapeHtmlAdmin(w.thumbnailUrl)}');background-size:cover;background-position:center;` : ''}"></div>
          <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
            ${w.liveCount > 0 ? '<span class="badge badge-green">Em andamento</span>' : ''}
            <span class="badge badge-grey">${w.tipoAgendamento==='just_in_time' ? 'Just-in-time' : (w.repeticaoAutomatica ? 'Recorrente' : 'Único')}</span>
          </div>
          <div style="font-weight:700;font-size:13.5px;margin-bottom:4px;">${escapeHtmlAdmin(w.nome)}</div>
          <div style="font-size:10.5px;color:var(--text-faint);margin-bottom:12px;">${this.formatDateTime(w.dataInicio)}</div>
          <div style="display:flex;gap:14px;font-size:11px;color:var(--text-faint);margin-bottom:14px;">
            <span>👁 ${w.liveCount} ao vivo</span>
            ${w.pendentes > 0 ? `<span style="color:var(--red);font-weight:700;">${w.pendentes} esperando resposta</span>` : ''}
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="App.openSalaWebinar(${w.id})">Sala de Atendimento</button>
        </div>`).join('');
      this._salasOngoingCache = rows;
    }catch(e){
      grid.innerHTML = `<div class="empty-state">Erro ao carregar: ${e.message}</div>`;
    }
  },
  stopSalasTimers(){
    clearInterval(this._salasLiveCountTimer);
    clearInterval(this._salasQueueTimer);
    clearInterval(this._salasThreadTimer);
  },
  openSalaWebinar(webinarId){
    this.salasWebinarId = webinarId;
    this.salasSelectedId = null;
    this.salasItems = new Map();
    this.salasCursor = null;
    const w = (this._salasOngoingCache || []).find(x=>x.id===webinarId);
    document.getElementById('salasPicker').style.display = 'none';
    document.getElementById('salasQueue').style.display = 'block';
    document.getElementById('salasQueueTitle').textContent = w?.nome || '';
    document.getElementById('salasQueueViewers').textContent = '👁 ' + (w?.liveCount ?? 0);
    document.getElementById('salasSom').checked = loadLS('wp_salas_som', false);
    document.getElementById('salasThread').innerHTML = '<div class="empty-state">Escolha uma conversa à esquerda.</div>';
    document.getElementById('salasCard').innerHTML = '';
    this.loadSalasSegurar();
    this.reloadSalas();
    this.stopSalasTimers();
    this._salasLiveCountTimer = setInterval(()=>{ if(!document.hidden) this.refreshSalasLiveCount(); }, 20000);
    this._salasQueueTimer = setInterval(()=>{ if(!document.hidden) this.pollSalas(); }, 5000);
    this._salasThreadTimer = setInterval(()=>{ if(!document.hidden && this.salasSelectedId) this.loadSalaThread(true); }, 4000);
  },
  backToSalasPicker(){
    document.getElementById('salasQueue').style.display = 'none';
    document.getElementById('salasPicker').style.display = 'block';
    this.salasWebinarId = null;
    this.salasSelectedId = null;
    this.stopSalasTimers();
    this.renderSalasPicker();
  },
  async refreshSalasLiveCount(){
    if(!this.salasWebinarId) return;
    try{
      const data = await this.apiFetch(`/api/webinars/${this.salasWebinarId}/live-count`);
      document.getElementById('salasQueueViewers').textContent = '👁 ' + data.count;
    }catch(e){}
  },
  formatDateTime(iso){
    if(!iso) return '';
    return new Date(iso).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  },
  formatListTime(iso){
    if(!iso) return '';
    const d = new Date(iso);
    const hoje = new Date();
    return d.toDateString() === hoje.toDateString()
      ? d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})
      : d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
  },
  toggleSalasSom(){
    saveLS('wp_salas_som', document.getElementById('salasSom').checked);
  },
  playSalasSom(){
    try{
      const ctx = this._audioCtx || (this._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.35);
    }catch(e){}
  },
  salasMatchesFiltro(it, filtro){
    const aberta = it.status !== 'encerrado';
    if(filtro === 'pendentes') return aberta && it.ultima_mensagem_remetente === 'lead';
    if(filtro === 'ia') return aberta && it.modo === 'ia';
    if(filtro === 'humano') return aberta && it.modo === 'humano' && (!!it.atendente_id || it.status === 'em_atendimento');
    if(filtro === 'minhas') return aberta && it.atendente_id === this.currentUser?.id;
    if(filtro === 'encerradas') return !aberta;
    return aberta;
  },
  salasQueryParams(extra){
    const p = new URLSearchParams({filtro: this.salasFiltro, webinar_id: this.salasWebinarId, ordem: document.getElementById('salasOrdem').value});
    const search = document.getElementById('salasSearch').value.trim();
    if(search) p.set('search', search);
    Object.entries(extra || {}).forEach(([k,v])=>p.set(k, v));
    return p.toString();
  },
  onSalasSearch(){
    clearTimeout(this._salasSearchT);
    this._salasSearchT = setTimeout(()=>this.reloadSalas(), 300);
  },
  setSalasFiltro(f){
    this.salasFiltro = f;
    this.reloadSalas();
  },
  async reloadSalas(){
    if(!this.salasWebinarId) return;
    try{
      const data = await this.apiFetch('/api/atendimentos?' + this.salasQueryParams());
      this.salasItems = new Map(data.itens.map(i=>[i.id, i]));
      this.salasCursor = data.agora;
      this.salasContadores = data.contadores;
      this.renderSalasList();
    }catch(e){
      document.getElementById('salasList').innerHTML = `<div class="empty-state">Erro ao carregar: ${e.message}</div>`;
    }
  },
  async pollSalas(){
    if(!this.salasWebinarId || !this.salasCursor) return;
    try{
      const data = await this.apiFetch('/api/atendimentos?' + this.salasQueryParams({desde: this.salasCursor}));
      let novaMsgAluno = false;
      for(const it of data.itens){
        const antes = this.salasItems.get(it.id);
        if(it.ultima_mensagem_remetente === 'lead' && (!antes || antes.ultima_mensagem_lead_em !== it.ultima_mensagem_lead_em)) novaMsgAluno = true;
        this.salasItems.set(it.id, it);
        if(it.id === this.salasSelectedId) this.loadSalaThread(true);
      }
      this.salasCursor = data.agora;
      this.salasContadores = data.contadores;
      if(novaMsgAluno && document.getElementById('salasSom').checked) this.playSalasSom();
      if(data.itens.length) this.renderSalasList();
      else this.renderSalasFilters();
      this.refreshPendentesBadge();
    }catch(e){}
  },
  renderSalasFilters(){
    const c = this.salasContadores || {};
    document.getElementById('salasFilters').innerHTML = this.SALAS_FILTROS.map(f=>`
      <button class="inbox-filter ${this.salasFiltro===f.id ? 'active' : ''}" onclick="App.setSalasFiltro('${f.id}')">
        ${f.label}${c[f.id] ? `<span class="inbox-filter-count ${f.id==='pendentes' ? 'red' : ''}">${c[f.id]}</span>` : ''}
      </button>`).join('');
  },
  salasWaitClass(it){
    if(it.status === 'encerrado' || it.ultima_mensagem_remetente !== 'lead' || !it.ultima_mensagem_lead_em) return '';
    const min = (Date.now() - new Date(it.ultima_mensagem_lead_em).getTime()) / 60000;
    return min > 5 ? 'wait-red' : min > 2 ? 'wait-yellow' : '';
  },
  renderSalasList(){
    this.renderSalasFilters();
    const ordem = document.getElementById('salasOrdem').value;
    // a conversa aberta continua na lista mesmo se mudou de filtro (ex.: IA -> Humano ao responder)
    const items = [...this.salasItems.values()].filter(it=>it.id === this.salasSelectedId || this.salasMatchesFiltro(it, this.salasFiltro));
    const t = (s)=>s ? new Date(s).getTime() : 0;
    items.sort((a,b)=> ordem==='antigas' ? t(a.ultima_mensagem_lead_em) - t(b.ultima_mensagem_lead_em)
      : ordem==='mais_mensagens' ? b.total_mensagens_lead - a.total_mensagens_lead
      : t(b.ultima_mensagem_em) - t(a.ultima_mensagem_em));
    const list = document.getElementById('salasList');
    if(items.length === 0){
      list.innerHTML = '<div class="empty-state">Nenhuma conversa neste filtro.</div>';
      return;
    }
    const prefixo = {ia:'IA: ', suporte:'Equipe: ', sistema:''};
    list.innerHTML = items.map(it=>{
      const iniciais = (it.lead_nome||'?').split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase();
      const preview = (prefixo[it.ultima_mensagem_remetente] || '') + (it.ultima_mensagem || '(sem mensagens)');
      return `<div class="inbox-item ${it.id===this.salasSelectedId ? 'active' : ''} ${this.salasWaitClass(it)}" onclick="App.openSalaConversa(${it.id})">
        <div class="inbox-avatar">${escapeHtmlAdmin(iniciais)}</div>
        <div class="inbox-item-main">
          <div class="inbox-item-top"><b>${escapeHtmlAdmin(it.lead_nome)}</b><span class="inbox-time">${this.formatListTime(it.ultima_mensagem_em)}</span></div>
          <div class="inbox-preview">${escapeHtmlAdmin(preview)}</div>
          <div class="inbox-tags">
            <span class="badge ${it.modo==='ia' ? 'badge-blue' : 'badge-grey'}">${it.modo==='ia' ? 'IA' : 'Humano'}</span>
            ${it.atendente_nome ? `<span class="badge badge-green">${escapeHtmlAdmin(it.atendente_nome)}</span>` : ''}
            ${it.status==='encerrado' ? '<span class="badge badge-grey">Encerrada</span>' : ''}
          </div>
        </div>
        ${it.nao_lidas > 0 ? `<span class="inbox-unread">${it.nao_lidas}</span>` : ''}
      </div>`;
    }).join('');
  },
  async openSalaConversa(id){
    this.salasSelectedId = id;
    this._salaThreadSig = null;
    document.getElementById('salasThread').innerHTML = '<div class="empty-state">Carregando…</div>';
    this.renderSalasList();
    await this.loadSalaThread();
    const it = this.salasItems.get(id);
    if(it && it.nao_lidas > 0){
      it.nao_lidas = 0;
      this.renderSalasList();
      this.apiFetch(`/api/atendimentos/${id}/lida`, {method:'POST'}).then(()=>this.refreshPendentesBadge()).catch(()=>{});
    }
  },
  async loadSalaThread(silent){
    const id = this.salasSelectedId;
    if(!id) return;
    try{
      const data = await this.apiFetch(`/api/atendimentos/${id}/mensagens`);
      if(id !== this.salasSelectedId) return;
      const sig = data.mensagens.length + ':' + (data.mensagens.at(-1)?.id || 0) + ':' + data.atendimento.modo + ':' + data.atendimento.status;
      if(silent && sig === this._salaThreadSig) return;
      this._salaThreadSig = sig;
      this.renderSalaThread(data);
      this.renderSalaCard(data);
    }catch(e){
      if(!silent) document.getElementById('salasThread').innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
    }
  },
  renderSalaThread(data){
    const a = data.atendimento;
    const thread = document.getElementById('salasThread');
    const prevBox = thread.querySelector('.inbox-msgs');
    const wasNearBottom = !prevBox || prevBox.scrollHeight - prevBox.scrollTop - prevBox.clientHeight < 80;
    const draft = thread.querySelector('#salaReplyInput')?.value || '';
    const hora = (s)=>new Date(s).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    const msgs = data.mensagens.map(m=>{
      if(m.remetente === 'sistema') return `<div class="inbox-msg-system">⚙ ${escapeHtmlAdmin(m.mensagem)} · ${hora(m.criado_em)}</div>`;
      const mine = m.remetente !== 'lead';
      const autor = m.remetente === 'lead' ? a.lead_nome : (m.remetente === 'ia' ? `${m.autor_nome || 'IA'} · IA` : `${m.autor_nome || 'Equipe'} · Humano`);
      return `<div class="inbox-msg ${mine ? 'mine' : ''} ${m.remetente === 'ia' ? 'ia' : ''}">
        <div class="inbox-msg-autor">${escapeHtmlAdmin(autor)}</div>
        <div class="inbox-msg-txt">${escapeHtmlAdmin(m.mensagem)}</div>
        <div class="inbox-msg-time">${hora(m.criado_em)}</div>
      </div>`;
    }).join('') || '<div class="empty-state">Nenhuma mensagem ainda.</div>';
    const quick = this.getQuickReplies();
    const aberta = a.status !== 'encerrado';
    thread.innerHTML = `
      <div class="inbox-thread-head">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800;font-size:14px;">${escapeHtmlAdmin(a.lead_nome)}</div>
          <div style="font-size:11.5px;color:var(--text-faint);">${escapeHtmlAdmin(a.lead_whatsapp || a.lead_email || '')}</div>
        </div>
        <span class="badge ${a.modo==='ia' ? 'badge-blue' : 'badge-grey'}">${a.modo==='ia' ? 'IA' : 'Humano'}</span>
        ${a.atendente_nome ? `<span class="badge badge-green">${escapeHtmlAdmin(a.atendente_nome)}</span>` : ''}
      </div>
      <div class="inbox-actions">
        ${a.atendente_id !== this.currentUser?.id || !aberta ? `<button class="btn btn-sm btn-primary" onclick="App.salaAcao('atender')">✋ Assumir</button>` : ''}
        ${data.ficha.sinoHabilitado && aberta ? `<button class="btn btn-sm" onclick="App.salaAcao('devolver-ia')">🤖 Devolver para a IA</button>` : ''}
        ${aberta ? `<button class="btn btn-sm" onclick="App.salaAcao('encerrar')">Encerrar</button>` : '<span class="badge badge-grey">Encerrada</span>'}
      </div>
      <div class="inbox-msgs">${msgs}</div>
      <div class="inbox-quick">
        ${quick.map((q,i)=>`<button class="inbox-quick-btn" title="${escapeHtmlAdmin(q)}" onclick="App.useQuickReply(${i})">${escapeHtmlAdmin(q.length > 28 ? q.slice(0,28)+'…' : q)}</button>`).join('')}
        <button class="inbox-quick-btn" title="Gerenciar respostas rápidas" onclick="App.editQuickReplies()">＋</button>
      </div>
      <div class="inbox-reply">
        <input class="input" id="salaReplyInput" autocomplete="off" data-lpignore="true" placeholder="Digite sua resposta..." onkeydown="if(event.key==='Enter')App.sendSalaReply()">
        <button class="btn btn-primary btn-sm" onclick="App.sendSalaReply()">Enviar</button>
      </div>`;
    const input = thread.querySelector('#salaReplyInput');
    input.value = draft;
    const box = thread.querySelector('.inbox-msgs');
    if(wasNearBottom) box.scrollTop = box.scrollHeight;
  },
  renderSalaCard(data){
    const a = data.atendimento;
    const s = data.ficha.sessao;
    const sim = (v)=>v ? '<span style="color:var(--green);font-weight:700;">Sim</span>' : '<span style="color:var(--text-faint);">Não</span>';
    const tempo = s ? this.secondsToTime(s.max_segundos || 0) : '—';
    const whats = (a.lead_whatsapp || '').replace(/\D/g, '');
    const linha = (k, v)=>`<div class="inbox-card-row"><span>${k}</span><b>${v}</b></div>`;
    document.getElementById('salasCard').innerHTML = `
      <div class="inbox-card-title">Aluno</div>
      ${linha('Nome', escapeHtmlAdmin(a.lead_nome))}
      ${linha('E-mail', escapeHtmlAdmin(a.lead_email || '—'))}
      ${linha('WhatsApp', whats ? `<a href="https://wa.me/${whats.length <= 11 ? '55' + whats : whats}" target="_blank" rel="noopener">${escapeHtmlAdmin(a.lead_whatsapp)}</a>` : '—')}
      ${linha('Cadastro', this.formatDateTime(a.lead_cadastrado_em))}
      ${linha('Outras lives', data.ficha.outrasLives)}
      <div class="inbox-card-title">Nesta live</div>
      ${linha('Webinar', escapeHtmlAdmin(a.webinar_nome))}
      ${linha('Entrou', s ? this.formatDateTime(s.entrou_em) : '—')}
      ${linha('Tempo assistido', tempo)}
      ${linha('Chegou no pitch', sim(s?.chegou_pitch_em))}
      ${linha('Chegou na oferta', sim(s?.chegou_oferta_em))}
      ${linha('Clicou em comprar', s?.clicou_compra_em ? `<span style="color:var(--green);font-weight:700;">Sim (${s.cliques_compra}x)</span>` : sim(false))}
      ${linha('Comprou', a.comprou_em ? `<span style="color:var(--green);font-weight:700;">Sim${a.valor_comprado_centavos ? ' · ' + (a.valor_comprado_centavos/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : ''}</span>` : sim(false))}
      <div class="inbox-card-title">Conversa</div>
      ${linha('Mensagens do aluno', a.total_mensagens_lead)}
      ${linha('Respostas da IA', a.respostas_ia)}
      ${linha('Integração Sino', data.ficha.sinoHabilitado ? '<span class="badge badge-blue">Ligada</span>' : '<span class="badge badge-grey">Desligada</span>')}`;
  },
  async salaAcao(acao){
    const id = this.salasSelectedId;
    if(!id) return;
    if(acao === 'encerrar' && !confirm('Encerrar esta conversa?')) return;
    try{
      await this.apiFetch(`/api/atendimentos/${id}/${acao}`, {method:'POST'});
      this._salaThreadSig = null;
      await this.loadSalaThread();
      this.pollSalas();
      this.toast({atender:'Conversa assumida', 'devolver-ia':'Conversa devolvida para a IA', encerrar:'Conversa encerrada'}[acao]);
    }catch(e){ this.toast('Erro: ' + e.message); }
  },
  async sendSalaReply(){
    const input = document.getElementById('salaReplyInput');
    const mensagem = input.value.trim();
    if(!mensagem || !this.salasSelectedId) return;
    input.value = '';
    try{
      await this.apiFetch(`/api/atendimentos/${this.salasSelectedId}/mensagens`, {method:'POST', body: JSON.stringify({mensagem})});
      this._salaThreadSig = null;
      await this.loadSalaThread();
      this.pollSalas();
    }catch(e){
      input.value = mensagem;
      this.toast('Erro ao enviar: ' + e.message);
    }
  },
  getQuickReplies(){
    return loadLS('wp_quick_replies', [
      'Oi! Já te ajudo 😊',
      'Recarregue a página que o vídeo volta ao normal.',
      'O link de compra aparece na aba Oferta, logo abaixo do vídeo.',
      'Vou te chamar no WhatsApp para resolver, tudo bem?',
    ]);
  },
  useQuickReply(i){
    const input = document.getElementById('salaReplyInput');
    input.value = this.getQuickReplies()[i] || '';
    input.focus();
  },
  editQuickReplies(){
    const atual = this.getQuickReplies().join('\n');
    const novo = prompt('Respostas rápidas (uma por linha):', atual);
    if(novo === null) return;
    saveLS('wp_quick_replies', novo.split('\n').map(s=>s.trim()).filter(Boolean).slice(0, 12));
    this._salaThreadSig = null;
    this.loadSalaThread();
  },
  async loadSalasSegurar(){
    const btn = document.getElementById('salasSegurarBtn');
    btn.style.display = 'none';
    try{
      const cfg = await this.apiFetch(`/api/webinar-sino/${this.salasWebinarId}/config`);
      if(!cfg.habilitado) return;
      this._salasSegurar = cfg.segurarChat;
      btn.style.display = '';
      btn.textContent = cfg.segurarChat ? '▶ Soltar chat (Sino)' : '⏸ Segurar chat (Sino)';
      btn.classList.toggle('btn-primary', !!cfg.segurarChat);
    }catch(e){}
  },
  async toggleSegurarChatWebinar(){
    const ligar = !this._salasSegurar;
    if(ligar && !confirm('Segurar o chat deste webinar? Nada vai para o Sino em tempo real e os alunos recebem uma resposta automática até você soltar.')) return;
    try{
      await this.apiFetch(`/api/webinar-sino/${this.salasWebinarId}/segurar-chat`, {method:'POST', body: JSON.stringify({ligado: ligar})});
      this.toast(ligar ? 'Chat segurado' : 'Chat liberado');
      this.loadSalasSegurar();
    }catch(e){ this.toast('Erro: ' + e.message); }
  },
  // Contador de conversas esperando resposta: no menu e no titulo da aba
  async refreshPendentesBadge(){
    try{
      const data = await this.apiFetch('/api/atendimentos/pendentes-count');
      const n = data.pendentes || 0;
      const badge = document.getElementById('navBadge-salas');
      if(badge){ badge.textContent = n > 99 ? '99+' : n; badge.style.display = n > 0 ? '' : 'none'; }
      document.title = (n > 0 ? `(${n}) ` : '') + 'WebnarPRO';
    }catch(e){}
  },
  startPendentesBadge(){
    this.refreshPendentesBadge();
    clearInterval(this._pendentesTimer);
    this._pendentesTimer = setInterval(()=>{ if(!document.hidden) this.refreshPendentesBadge(); }, 30000);
  },

  // ---------- PÁGINA PÚBLICA (visão do aluno) ----------
  pubActiveTab:'chat',
  openPublic(slugOrIdx){
    let w;
    if(typeof slugOrIdx === 'number'){
      w = this.webinars[slugOrIdx];
    } else {
      w = this.webinars.find(item => item.slug === slugOrIdx || item.nome === slugOrIdx);
    }
    const slug = w ? w.slug : slugOrIdx;
    if(!slug){
      this.toast('Webinar não encontrado ou sem link configurado');
      return;
    }
    window.open('/' + encodeURIComponent(slug) + '?preview=1', '_blank');
  },
  closePublic(){
    document.getElementById('publicPage').classList.remove('open');
    document.querySelector('.app-shell').style.display = 'flex';
    clearInterval(this._pubCountdown);
    clearInterval(this._pubTimer);
    (this._pubTimeouts||[]).forEach(id=>clearTimeout(id));
  },
  pubReset(){
    clearInterval(this._pubCountdown);
    clearInterval(this._pubTimer);
    (this._pubTimeouts||[]).forEach(id=>clearTimeout(id));
    this._pubTimeouts = [];
    document.getElementById('pubMsgsChat').innerHTML = '';
    document.getElementById('pubMsgsSuporte').innerHTML = '<div class="empty-state">Envie uma mensagem privada para o suporte.</div>';
    this.pubTab('chat');
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-cover" onclick="App.pubStartCountdown()">
        <div class="pub-play-btn"><svg viewBox="0 0 24 24"><path d="M9 7l9 5-9 5V7z"/></svg></div>
        <div class="pub-cover-text">SUA AULA JÁ COMEÇOU<span>CLIQUE PARA ASSISTIR</span></div>
      </div>`;
  },
  pubTab(t){
    this.pubActiveTab = t;
    document.getElementById('tabChat').classList.toggle('active', t==='chat');
    document.getElementById('tabSuporte').classList.toggle('active', t==='suporte');
    document.getElementById('pubMsgsChat').style.display = t==='chat' ? 'flex' : 'none';
    document.getElementById('pubMsgsSuporte').style.display = t==='suporte' ? 'flex' : 'none';
  },
  pubStartCountdown(){
    let secs = 57;
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
    this.pubQueueJoinMessages();
    this._pubCountdown = setInterval(()=>{
      secs--;
      if(secs<=0){ clearInterval(this._pubCountdown); this.pubStartLive(); return; }
      render();
    }, 1000);
  },
  pubQueueJoinMessages(){
    const supportMsgs = [
      'Boa noite a todos. Sejam bem-vindos',
      'Sou da equipe do Professor e darei suporte a vocês por aqui hj'
    ];
    supportMsgs.forEach((txt,i)=>{
      this._pubTimeouts.push(setTimeout(()=>this.pubPushSupport(txt), i*700));
    });
    const joiners = [
      ['Edevailson Rodrigues','Boa noite.'],
      ['Genario Soares','boa noite a todos estamos prontos professor'],
      ['Rodrigo Patricio','Boa Noite'],
      ['Jose','boa noite']
    ];
    joiners.forEach((j,i)=>{
      this._pubTimeouts.push(setTimeout(()=>this.pubPushMsg(j[0], j[1]), 1600 + i*1500));
    });
  },
  pubStartLive(){
    document.getElementById('pubVideo').innerHTML = `
      <div class="pub-live">
        <div class="pub-live-badge">AO VIVO</div>
        <div class="pub-brand-badge">⚡ WebnarPRO</div>
        Reproduzindo aula...
      </div>`;
    this._pubElapsed = 0;
    const sorted = [...this.chatMsgs].sort((a,b)=>a.t.localeCompare(b.t));
    let idx = 0;
    this._pubTimer = setInterval(()=>{
      this._pubElapsed++;
      const mm = String(Math.floor(this._pubElapsed/60)).padStart(2,'0');
      const ss = String(this._pubElapsed%60).padStart(2,'0');
      const cur = mm+':'+ss;
      while(idx < sorted.length && sorted[idx].t <= cur){
        this.pubPushMsg(sorted[idx].n, sorted[idx].m);
        idx++;
      }
    }, 1000);
  },
  pubPushSupport(txt){
    const box = document.getElementById('pubMsgsChat');
    box.insertAdjacentHTML('beforeend', `<div class="pub-chat-support">Suporte - Prof. Emerson<br>${txt}</div>`);
    box.scrollTop = box.scrollHeight;
  },
  pubPushMsg(name, txt, mine){
    const box = document.getElementById('pubMsgsChat');
    box.insertAdjacentHTML('beforeend', `<div class="pub-chat-msg ${mine?'mine':''}"><span class="name">${name}:</span>${txt}</div>`);
    box.scrollTop = box.scrollHeight;
  },
  pubSend(){
    const inp = document.getElementById('pubInput');
    const val = inp.value.trim();
    if(!val) return;
    if(this.pubActiveTab==='suporte'){
      const sBox = document.getElementById('pubMsgsSuporte');
      if(sBox.querySelector('.empty-state')) sBox.innerHTML='';
      sBox.insertAdjacentHTML('beforeend', `<div class="pub-chat-msg mine"><span class="name">Você:</span>${val}</div>`);
    } else {
      this.pubPushMsg('Você', val, true);
    }
    inp.value='';
  },

  // ---------- HISTÓRICO ----------
  renderHistorico(filter){
    filter = filter || 'Todos';
    const map = {'Criou':'badge-green','Editou':'badge-blue','Deletou':'badge-red'};
    const list = this.historico.filter(h => filter==='Todos' || h.acao===filter);
    document.getElementById('histTbody').innerHTML = list.map(h=>`
      <tr><td>${h.user}</td><td>${h.data}</td><td>${h.webinar}</td>
      <td><span class="badge ${map[h.acao]}">${h.acao}</span></td><td>${h.desc}</td></tr>
    `).join('') || `<tr><td colspan="5"><div class="empty-state">Nada por aqui com esse filtro.</div></td></tr>`;
  },
  filterHist(btn, f){
    document.querySelectorAll('#histFilters button').forEach(b=>b.classList.remove('btn-primary'));
    btn.classList.add('btn-primary');
    this.renderHistorico(f);
  },

  // ---------- USUÁRIOS ----------
  renderUsers(){
    document.getElementById('usersTbody').innerHTML = this.users.map((u,i)=>`
      <tr><td>${u.nome}</td><td>${u.email}</td><td><span class="badge ${u.tipo==='Administrador'?'badge-yellow':'badge-blue'}">${u.tipo}</span></td>
      <td style="text-align:right;"><div class="iconbar" style="justify-content:flex-end;">
        <button title="Editar">${ICONS.edit}</button>
        <button title="Excluir" onclick="App.delUser(${i})">${ICONS.trash}</button>
      </div></td></tr>`).join('');
  },
  openNewUser(){ document.getElementById('newUserForm').style.display='block'; },
  closeNewUser(){ document.getElementById('newUserForm').style.display='none'; },
  saveNewUser(){
    const nome = document.getElementById('nu_nome').value.trim();
    const email = document.getElementById('nu_email').value.trim();
    const tipo = document.getElementById('nu_tipo').value;
    if(!nome || !email) return this.toast('Preencha nome e e-mail');
    this.users.push({nome,email,tipo});
    saveLS('wp_users_v2', this.users);
    this.renderUsers();
    this.closeNewUser();
    document.getElementById('nu_nome').value='';document.getElementById('nu_email').value='';
    this.toast('Usuário criado');
  },
  delUser(i){ this.users.splice(i,1); saveLS('wp_users_v2', this.users); this.renderUsers(); this.toast('Usuário removido'); },

  // ---------- CONFIGURAÇÕES ----------
  integList: [],
  integState: {},
  renderConfigInteg(){
    document.getElementById('configIntegGrid').innerHTML = `<div class="empty-state">Nenhuma integração conectada ainda.</div>`;
  },
  toggleConfigInteg(el, name){
    this.integState[name] = !this.integState[name];
    saveLS('wp_integstate', this.integState);
    el.querySelector('.integ-status').classList.toggle('on', this.integState[name]);
    this.toast((this.integState[name]?'Conectado a ':'Desconectado de ') + name);
  },

  // ---------- MEU PLANO ----------
  planIdx: loadLS('wp_planidx', 1),
  renderPlan(){
    const p = this.planTiers[this.planIdx];
    document.getElementById('planName').textContent = p.name;
    document.getElementById('planPrice').innerHTML = p.price + ' <span style="font-size:12px;color:var(--text-faint);">/mês</span>';
    document.getElementById('planLimits').innerHTML = `Armazenamento: ${p.storage}<br>Banda: ${p.banda}<br>Tokens de IA: ${p.tokens}`;
  },
  cyclePlan(){
    this.planIdx = (this.planIdx+1) % this.planTiers.length;
    saveLS('wp_planidx', this.planIdx);
    this.renderPlan();
    this.toast('Plano atualizado para ' + this.planTiers[this.planIdx].name);
  },

  // ---------- SIMULADOR DE CUSTO ----------
  BITRATE_GB_H: {480:0.5, 720:1.0, 1080:2.5},
  MUX_TIERS: {
    720:[[5000,0.025],[10000,0.02375],[10000,0.023125],[Infinity,0.0225]],
    1080:[[5000,0.03125],[10000,0.029688],[10000,0.028906],[Infinity,0.028125]]
  },
  muxCost(minutes, quality){
    const payable = Math.max(0, minutes - 100000); // 100k free minutes/month
    if(payable<=0) return 0;
    const tierKey = quality>=1080 ? 1080 : 720; // 480p bills on the "up to 720p" column
    const tiers = this.MUX_TIERS[tierKey];
    let remaining = payable, cost = 0;
    for(const [size, rate] of tiers){
      const chunk = Math.min(remaining, size);
      cost += chunk*rate;
      remaining -= chunk;
      if(remaining<=0) break;
    }
    return cost;
  },
  calcSim(){
    const webinars = +document.getElementById('simWebinars').value;
    const viewers = +document.getElementById('simViewers').value;
    const duration = +document.getElementById('simDuration').value;
    const quality = +document.getElementById('simQuality').value;
    document.getElementById('simWebinarsVal').textContent = webinars;
    document.getElementById('simViewersVal').textContent = viewers.toLocaleString('pt-BR');
    document.getElementById('simDurationVal').textContent = duration;

    const totalMinutes = viewers*duration*webinars;
    const totalGB = viewers*(duration/60)*this.BITRATE_GB_H[quality]*webinars;

    const bunny = totalGB*0.005 + 0.15;
    const cloudflare = (totalMinutes/1000)*1 + 2;
    const mux = this.muxCost(totalMinutes, quality);

    const usd = 5.5;
    const results = [
      {name:'Bunny Stream', cost:bunny, note:'Cobra por GB entregue — a mais previsível em alto volume.'},
      {name:'Cloudflare Stream', cost:cloudflare, note:'Cobra por minuto entregue, independente da resolução.'},
      {name:'Mux', cost:mux, note: totalMinutes<=100000 ? 'Dentro dos 100.000 min grátis por mês.' : 'Acima do free tier — fica caro rápido em alto volume.'}
    ];
    const min = Math.min(...results.map(r=>r.cost));
    document.getElementById('providerCards').innerHTML = results.map(r=>`
      <div class="provider-card ${r.cost===min?'best':''}">
        <div class="p-name">${r.name} ${r.cost===min?'<span class="pill-best">MAIS BARATO</span>':''}</div>
        <div class="p-cost">US$ ${r.cost.toFixed(2)}</div>
        <div class="p-costbrl">≈ R$ ${(r.cost*usd).toLocaleString('pt-BR',{maximumFractionDigits:0})} /mês</div>
        <div class="p-note">${r.note}</div>
      </div>`).join('');

    if(this._simChart){
      this._simChart.data.datasets[0].data = results.map(r=>+r.cost.toFixed(2));
      this._simChart.update();
    } else {
      const ctx = document.getElementById('simChart');
      this._simChart = new Chart(ctx, {
        type:'bar',
        data:{ labels:results.map(r=>r.name), datasets:[{ data:results.map(r=>+r.cost.toFixed(2)),
          backgroundColor:['#FFCC00','#5AA9FF','#FF5C5C'], borderRadius:6 }]},
        options:{ indexAxis:'y', plugins:{legend:{display:false}}, maintainAspectRatio:false,
          scales:{ x:{grid:{color:'#232320'}, ticks:{color:'#a6a59a', callback:v=>'US$ '+v}},
                   y:{grid:{display:false}, ticks:{color:'#F3F2EA'}} } }
      });
    }

    const hotwebinarPlanBRL = 397;
    const bunnyBRL = bunny*usd;
    const diff = hotwebinarPlanBRL - bunnyBRL;
    let calloutHtml;
    if(diff > 0){
      calloutHtml = `Nesse volume, construir a arquitetura própria com <b>Bunny Stream</b> custaria aproximadamente <b>R$ ${bunnyBRL.toLocaleString('pt-BR',{maximumFractionDigits:0})}/mês</b> —
        uma economia de cerca de <b>R$ ${diff.toLocaleString('pt-BR',{maximumFractionDigits:0})}/mês</b> frente ao plano equivalente do Hotwebinar (R$ 397).`;
    } else {
      calloutHtml = `Nesse volume específico, a diferença de custo de infraestrutura é pequena — o plano pronto do Hotwebinar (R$ 397/mês) pode valer a pena
        pela conveniência de não precisar manter a arquitetura própria.`;
    }
    document.getElementById('simCallout').innerHTML = calloutHtml + ' <span style="opacity:.7;">Estimativa educacional baseada em tabelas públicas de preço — confirme direto no site de cada provedor.</span>';
  },

  // ---------- TESTE A/B ----------
  abTests: [],

  async loadAbTests(){
    try{
      this.abTests = await this.apiFetch('/api/ab-tests');
    }catch(e){
      this.toast('Erro ao carregar testes A/B: ' + e.message);
    }
  },

  renderAbTests(){
    const tb = document.getElementById('abTestsTbody');
    if(!tb) return;
    if(this.abTests.length === 0){
      tb.innerHTML = `<tr><td colspan="5"><div class="empty-state">Nenhum Teste A/B criado ainda.</div></td></tr>`;
      return;
    }
    const statusMap = { rascunho:'badge-grey', ativo:'badge-green', finalizado:'badge-yellow' };
    const statusLabel = { rascunho:'Rascunho', ativo:'Ativo', finalizado:'Finalizado' };
    tb.innerHTML = this.abTests.map(t=>`
      <tr>
        <td>${t.nome}</td>
        <td><a href="#" onclick="App.copyAbLink('${t.slug}');return false;" style="color:var(--yellow);">/${t.slug}</a></td>
        <td>${t.variants.map(v=>`<span class="badge badge-grey" style="margin-right:4px;">${v.rotulo} ${v.peso}%</span>`).join('')}</td>
        <td><span class="badge ${statusMap[t.status]||'badge-grey'}">${statusLabel[t.status]||t.status}</span></td>
        <td style="text-align:right;"><div class="iconbar" style="justify-content:flex-end;">
          <button title="Ver resultados" onclick="App.openAbResults(${t.id})">${ICONS.chart}</button>
          <button title="Editar" onclick="App.openAbModal(${t.id})">${ICONS.edit}</button>
          <button title="Excluir" onclick="App.deleteAbTest(${t.id})">${ICONS.trash}</button>
        </div></td>
      </tr>`).join('');
  },

  copyAbLink(slug){
    const url = window.location.origin + '/' + slug;
    try{ navigator.clipboard.writeText(url); }catch(e){}
    this.toast('Link copiado: /' + slug);
  },

  openAbModal(testId){
    this._abEditingId = testId || null;
    document.getElementById('abModalTitle').textContent = testId ? 'Editar Teste A/B' : 'Novo Teste A/B';
    document.getElementById('abModalError').style.display = 'none';
    document.getElementById('abNome').value = '';
    document.getElementById('abSlug').value = '';
    document.getElementById('abVariantsList').innerHTML = '';

    if(testId){
      const t = this.abTests.find(x=>x.id===testId);
      if(t){
        document.getElementById('abNome').value = t.nome;
        document.getElementById('abSlug').value = t.slug;
      }
      this.apiFetch('/api/ab-tests/' + testId).then(full=>{
        full.variants.forEach(v=>this.abAddVariantRow(v.webinar_id, v.peso));
      }).catch(()=>{ this.abAddVariantRow(); this.abAddVariantRow(); });
    } else {
      this.abAddVariantRow();
      this.abAddVariantRow();
    }
    document.getElementById('abModal').classList.add('open');
  },

  closeAbModal(){
    document.getElementById('abModal').classList.remove('open');
  },

  abSuggestSlug(){
    if(this._abEditingId) return;
    const slugField = document.getElementById('abSlug');
    if(slugField.dataset.touched) return;
    slugField.value = document.getElementById('abNome').value
      .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
      .trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  },

  abAddVariantRow(webinarId, peso){
    const list = document.getElementById('abVariantsList');
    const row = document.createElement('div');
    row.className = 'ab-variant-row';
    const options = this.webinars.map(w=>`<option value="${w.id}" ${w.id===webinarId?'selected':''}>${w.nome}</option>`).join('');
    row.innerHTML = `
      <select class="select">${options || '<option value="">Nenhum webinar disponível</option>'}</select>
      <input class="input" type="number" min="1" max="100" value="${peso || 50}" title="Peso (%)">
      <button class="icon-btn" onclick="this.closest('.ab-variant-row').remove()">${ICONS.trash}</button>`;
    list.appendChild(row);
  },

  async saveAbTest(){
    const nome = document.getElementById('abNome').value.trim();
    const slug = document.getElementById('abSlug').value.trim();
    const errEl = document.getElementById('abModalError');
    errEl.style.display = 'none';

    const rows = [...document.querySelectorAll('#abVariantsList .ab-variant-row')];
    const variants = rows.map(r=>({
      webinar_id: Number(r.querySelector('select').value),
      peso: Number(r.querySelector('input').value) || 50,
    })).filter(v=>v.webinar_id);

    if(!nome){ errEl.textContent = 'Dê um nome ao teste.'; errEl.style.display = 'block'; return; }
    if(variants.length < 2){ errEl.textContent = 'Escolha pelo menos 2 variantes.'; errEl.style.display = 'block'; return; }
    const ids = variants.map(v=>v.webinar_id);
    if(new Set(ids).size !== ids.length){ errEl.textContent = 'Cada variante precisa ser um webinar diferente.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('abSaveBtn');
    btn.disabled = true;
    try{
      const payload = { nome, slug: slug || undefined, variants };
      if(this._abEditingId) await this.apiFetch('/api/ab-tests/' + this._abEditingId, { method:'PUT', body: JSON.stringify(payload) });
      else await this.apiFetch('/api/ab-tests', { method:'POST', body: JSON.stringify(payload) });
      this.closeAbModal();
      await this.loadAbTests();
      this.renderAbTests();
      this.toast('Teste A/B salvo!');
    }catch(e){
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }finally{
      btn.disabled = false;
    }
  },

  async deleteAbTest(testId){
    if(!confirm('Excluir este Teste A/B? Isso não apaga os webinars, só o teste.')) return;
    try{
      await this.apiFetch('/api/ab-tests/' + testId, { method:'DELETE' });
      await this.loadAbTests();
      this.renderAbTests();
      this.toast('Teste A/B excluído');
    }catch(e){
      this.toast('Erro ao excluir: ' + e.message);
    }
  },

  async openAbResults(testId){
    document.getElementById('abResultsBody').innerHTML = '<div class="empty-state">Carregando...</div>';
    document.getElementById('abResultsModal').classList.add('open');
    try{
      const data = await this.apiFetch('/api/ab-tests/' + testId + '/results');
      document.getElementById('abResultsTitle').textContent = 'Resultados — ' + data.testeNome;
      document.getElementById('abResultsBody').innerHTML = data.results.map(r=>`
        <div class="card ab-variant-card ${r.variantId===data.winnerId?'winner':''}" style="margin-top:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <b style="font-size:13.5px;">Variante ${r.rotulo} — ${r.webinarNome}</b>
            ${r.variantId===data.winnerId ? `<span class="ab-winner-badge">🏆 Vencedora</span>` : ''}
          </div>
          <div class="ab-metric-grid">
            <div><div class="m-v">${r.exposicoes}</div><div class="m-k">Visitantes</div></div>
            <div><div class="m-v">${r.leads}</div><div class="m-k">Cadastros</div></div>
            <div><div class="m-v">${r.taxaCadastro}%</div><div class="m-k">Taxa cadastro</div></div>
            <div><div class="m-v">${r.taxaConclusao}%</div><div class="m-k">Concluíram</div></div>
          </div>
        </div>`).join('') || '<div class="empty-state">Sem dados ainda.</div>';
    }catch(e){
      document.getElementById('abResultsBody').innerHTML = `<div class="empty-state">Erro ao carregar resultados: ${e.message}</div>`;
    }
  },

  closeAbResults(){
    document.getElementById('abResultsModal').classList.remove('open');
  }
};

document.addEventListener('DOMContentLoaded', ()=>App.init());
