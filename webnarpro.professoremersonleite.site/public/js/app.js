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
  rocket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2c3 3 4 7 4 10-1 1-2 2-4 2s-3-1-4-2c0-3 1-7 4-10z"/><path d="M9 14l-3 3 1 4 4-1"/><path d="M15 14l3 3-1 4-4-1"/></svg>',
  upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/></svg>'
};

const NAV = [
  {id:'dashboard', label:'Dashboard', ico:'dashboard'},
  {id:'webinars',  label:'Webinars',  ico:'webinars'},
  {id:'ab',        label:'Teste A/B', ico:'ab', locked:true},
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
  {label:'Chatbot', ico:'bot'}, {label:'Agente de IA', ico:'ai'}, {label:'Pronto', ico:'rocket'}
];

function loadLS(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
}
function saveLS(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
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
  wz:{step:0, nome:'', titulo:'', url:'', apresentador:'', tipo:'Único', duracao:150, espectadores:500, produto:'Comunidade FERA', preco:'R$ 997,00', video:null},

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
    this.renderSalas();
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
      id: v.id, nome: v.nome_arquivo,
      data: v.criado_em ? new Date(v.criado_em).toLocaleString('pt-BR') : '—',
      tamanho: v.tamanho_bytes ? (v.tamanho_bytes / 1e9).toFixed(2) + ' GB' : '—',
      status: v.status_processamento,
    }));
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
      return `<li class="nav-item" data-view="${n.id}" onclick="App.showView('${n.id}')">${ICONS[n.ico]}<span class="nav-label">${n.label}</span></li>`;
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
    const ctx = document.getElementById('dashChart');
    if(ctx && window.Chart){
      new Chart(ctx, {
        type:'line',
        data:{ labels:['S1','S2','S3','S4','S5','S6','S7','S8'],
          datasets:[{ label:'Espectadores', data:[0,0,0,0,0,0,0,0],
            borderColor:'#FFCC00', backgroundColor:'rgba(255,204,0,.12)', tension:.35, fill:true, pointRadius:3, pointBackgroundColor:'#FFCC00'}]},
        options:{ plugins:{legend:{display:false}}, scales:{
          x:{grid:{color:'#232320'}, ticks:{color:'#a6a59a'}},
          y:{grid:{color:'#232320'}, ticks:{color:'#a6a59a'}}
        }, maintainAspectRatio:false }
      });
    }
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
          <button title="Copiar link" onclick="App.toast('Link copiado!')">${ICONS.link}</button>
          <button title="Editar" onclick="App.editWebinar(${this.webinars.indexOf(w)})">${ICONS.edit}</button>
          <button title="Métricas" onclick="App.toast('Métricas em construção nesta prévia')">${ICONS.chart}</button>
          <button title="Ver como aluno" onclick="App.openPublic(${this.webinars.indexOf(w)})">${ICONS.globe}</button>
          <button title="Duplicar" onclick="App.dupWebinar(${this.webinars.indexOf(w)})">${ICONS.copy}</button>
          <button title="Excluir" onclick="App.delWebinar(${this.webinars.indexOf(w)})">${ICONS.trash}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="4"><div class="empty-state">Nenhum webinar encontrado.</div></td></tr>`;
    document.getElementById('webinarsCount').textContent = `Total de registros: ${list.length}`;
  },
  editWebinar(i){
    const w = this.webinars[i];
    this.resetWizard();
    this.wz.id = w.id;
    this.wz.slug = w.slug;
    this.wz.nome = w.nome;
    document.getElementById('w_nome').value = w.nome;
    this.showView('wizard');
    this.toast('Editando "'+w.nome+'"');
  },
  dupWebinar(i){
    this.toast('Duplicar webinar ainda não foi implementado no backend');
  },
  delWebinar(i){
    this.toast('Excluir webinar ainda não foi implementado no backend');
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
  },
  resetWizard(){
    this.wz = {step:0, id:null, slug:null, videoId:null, nome:'', titulo:'', url:'', apresentador:'', tipo:'Único', duracao:150, espectadores:500, produto:'Comunidade FERA', preco:'R$ 997,00', video:null};
    document.getElementById('w_nome').value='';
    document.getElementById('w_titulo').value='';
    document.getElementById('w_url').value='';
    document.getElementById('wizardBanner').innerHTML='';
    this.wzGo(0);
  },
  async wzGo(n){
    if(n<0) n=0;
    if(n>11) n=11;
    const leaving = this.wz.step;
    if(leaving===0 && n!==0 && !this.wz.id){
      const ok = await this.createWebinarDraft();
      if(!ok) return;
    }
    if(leaving===3 && n!==3 && this.wz.id){
      await this.saveVideoConfig();
    }
    this.wz.step = n;
    document.querySelectorAll('.wizard-panel').forEach(p=>p.classList.toggle('active', +p.dataset.step===n));
    this.updateStepperUI();
    document.getElementById('wzBack').style.visibility = n===0 ? 'hidden' : 'visible';
    const nextBtn = document.getElementById('wzNext');
    if(n===11){
      nextBtn.textContent = 'Publicar Webinar';
      this.renderSummary();
    } else {
      nextBtn.textContent = 'Continuar';
      nextBtn.onclick = ()=>App.wzGo(App.wz.step+1);
    }
    if(n===11){
      nextBtn.onclick = ()=>App.publishWebinar();
    }
    document.querySelector('.wizard-card').scrollIntoView({behavior:'smooth', block:'start'});
  },
  async createWebinarDraft(){
    if(!this.wz.nome){ this.toast('Dê um nome ao webinar antes de continuar'); return false; }
    try{
      const data = await this.apiFetch('/api/webinars', {method:'POST', body: JSON.stringify({
        nome: this.wz.nome,
        titulo: this.wz.titulo || undefined,
        nome_apresentador: this.wz.apresentador || undefined,
      })});
      this.wz.id = data.id;
      this.wz.slug = data.slug;
      return true;
    }catch(e){
      this.toast('Erro ao criar webinar: ' + e.message);
      return false;
    }
  },
  async saveVideoConfig(){
    if(!this.wz.videoId) return;
    try{
      await this.apiFetch(`/api/webinars/${this.wz.id}/video`, {method:'PUT', body: JSON.stringify({
        video_id: this.wz.videoId,
        video_autoplay: document.getElementById('chkAutoplay').checked,
        video_fullscreen: document.getElementById('chkFullscreen').checked,
        ocultar_barra_progresso: document.getElementById('chkOcultarBarra').checked,
        bloquear_avanco_video: document.getElementById('chkBloquearAvanco').checked,
      })});
    }catch(e){
      this.toast('Erro ao salvar configuração de vídeo: ' + e.message);
    }
  },
  selectSchedType(t){
    document.getElementById('tabWebUnico').classList.toggle('active', t==='unico');
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
    el.innerHTML = this.videos.map((v,i)=>`
      <div class="video-pick ${v.id===this.wz.videoId?'sel':''}" onclick="App.pickVideo(this,${v.id})">
        <div class="vp-thumb">${ICONS.play}</div>
        <div class="vp-name">${v.nome}</div>
      </div>`).join('');
    if(!this.wz.videoId && this.videos[0]) this.wz.videoId = this.videos[0].id;
  },
  pickVideo(el, videoId){
    document.querySelectorAll('.video-pick').forEach(v=>v.classList.remove('sel'));
    el.classList.add('sel');
    this.wz.videoId = videoId;
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
    const t = document.getElementById('chatTime').value.trim() || '00:00';
    const n = document.getElementById('chatName').value.trim() || 'Espectador';
    const m = document.getElementById('chatMsg').value.trim();
    if(!m) return this.toast('Escreva uma mensagem primeiro');
    this.chatMsgs.push({t,n,m});
    this.chatMsgs.sort((a,b)=>a.t.localeCompare(b.t));
    saveLS('wp_chatmsgs_v2', this.chatMsgs);
    document.getElementById('chatTime').value='';
    document.getElementById('chatName').value='';
    document.getElementById('chatMsg').value='';
    this.renderChatList();
  },
  renderChatList(){
    document.getElementById('chatList').innerHTML = this.chatMsgs.map((c,i)=>`
      <div class="chat-row"><span class="c-time">${c.t}</span><span class="c-body"><b>${c.n}:</b> ${c.m}</span>
      <button class="c-del" onclick="App.delChatMsg(${i})">${ICONS.trash}</button></div>
    `).join('');
  },
  delChatMsg(i){ this.chatMsgs.splice(i,1); saveLS('wp_chatmsgs_v2', this.chatMsgs); this.renderChatList(); },
  renderOfertaPreview(){
    const t = document.getElementById('w_ofertaTitulo'); if(t) document.getElementById('ofertaPreviewImg').textContent = (t.value||'').slice(0,20) || 'F.E.R.A';
    const po = document.getElementById('w_precoOriginal'); if(po) document.getElementById('ofertaPreviewOriginal').textContent = 'De ' + po.value;
    const pp = document.getElementById('w_preco'); if(pp) document.getElementById('ofertaPreviewPreco').textContent = 'Por ' + pp.value;
    const btn = document.getElementById('w_ofertaBotao'); if(btn) document.getElementById('ofertaPreviewBtn').textContent = btn.value || 'inscreva-se aqui';
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
      ['Duração', this.wz.duracao + ' minutos'],
      ['Vídeo selecionado', this.videos.find(v=>v.id===this.wz.videoId)?.nome || '—'],
      ['Produto', this.wz.produto],
      ['Preço', this.wz.preco],
      ['Mensagens de chat configuradas', this.chatMsgs.length],
      ['Vendas configuradas', this.sales.length]
    ];
    document.getElementById('summaryList').innerHTML = items.map(([k,v])=>`
      <div class="summary-item"><div class="s-k">${k}</div><div class="s-v">${v}</div></div>`).join('');
    const placeholder = 'Clique em "Publicar Webinar" para gerar o link';
    document.getElementById('linkPrincipal').value = placeholder;
    document.getElementById('linkMagic').value = placeholder;
    document.getElementById('linkReplay').value = placeholder;
  },
  copyLink(id){
    const el = document.getElementById(id);
    el.select();
    try{ navigator.clipboard.writeText(el.value); }catch(e){}
    this.toast('Link copiado!');
  },
  async publishWebinar(){
    if(!this.wz.id){
      const ok = await this.createWebinarDraft();
      if(!ok) return;
    }
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
    document.getElementById('videosTbody').innerHTML = this.videos.map(v=>`
      <tr>
        <td><div class="row-thumb"><div class="thumb thumb-wide">${ICONS.play}</div><div class="row-title">${v.nome}</div></div></td>
        <td>${v.data}</td><td>${v.tamanho}</td>
        <td style="text-align:right;">
          ${v.status === 'pronto' ? `<span class="badge badge-green">Pronto</span>`
            : v.status === 'erro' ? `<span class="badge badge-grey">Erro</span>`
            : `<span class="badge badge-yellow">Processando…</span>`}
          <button class="icon-btn" style="margin-left:8px;">${ICONS.more}</button>
        </td>
      </tr>`).join('');
  },

  // ---------- SALAS ----------
  renderSalas(){
    const salas = [];
    document.getElementById('salasGrid').innerHTML = salas.map((s,i)=>`
      <div class="card" style="margin-top:0;">
        <div class="thumb" style="width:100%;height:100px;margin-bottom:12px;">${ICONS.play}</div>
        <div style="display:flex;gap:6px;margin-bottom:10px;"><span class="badge badge-green">${s.status}</span><span class="badge badge-grey">${s.tipo}</span></div>
        <div style="font-size:11.5px;color:var(--text-faint);margin-bottom:6px;">${s.data}</div>
        <div style="font-weight:700;font-size:13.5px;margin-bottom:14px;">${s.nome}</div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="App.openAttend(${i}, '${s.nome}')">Sala de Atendimento</button>
      </div>`).join('');
  },
  openAttend(i, nome){
    document.getElementById('attendTitle').textContent = 'Sala de Atendimento — ' + nome;
    document.getElementById('attendList').innerHTML = [].map(a=>`<div class="a-item"><div class="a-name">${a.n}</div><div class="a-wait">${a.w}</div></div>`).join('');
    document.getElementById('attendMsgs').innerHTML = '';
    document.getElementById('attendModal').classList.add('open');
  },
  closeAttend(){ document.getElementById('attendModal').classList.remove('open'); },
  sendAttendReply(){
    const input = document.getElementById('attendInput');
    if(!input.value.trim()) return;
    const box = document.getElementById('attendMsgs');
    box.innerHTML += `<div class="ai-bubble mine"><div class="b-txt">${input.value}</div></div>`;
    input.value='';
    box.scrollTop = box.scrollHeight;
  },

  // ---------- PÁGINA PÚBLICA (visão do aluno) ----------
  pubActiveTab:'chat',
  openPublic(nameOrIdx){
    const nome = typeof nameOrIdx === 'number' ? (this.webinars[nameOrIdx]?.nome || 'Aula 06') : (nameOrIdx || 'Aula 06');
    document.getElementById('pubTitle').textContent = nome + ' (ao vivo)';
    document.querySelector('.app-shell').style.display = 'none';
    document.getElementById('publicPage').classList.add('open');
    this.pubReset();
    window.scrollTo(0,0);
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
  }
};

document.addEventListener('DOMContentLoaded', ()=>App.init());
