# Plano de implementação: otimização, capacidade e alertas do WebnarPRO

Criado em 21/10/2026, depois do travamento na live "Aula 06 – MCQDC 211026".

## Execução (22/10/2026)

| Fase | Situação |
|---|---|
| 0 | ✅ Aplicada em 21/10 (Apache 400 workers / Timeout 60 / KeepAlive 3) |
| 1 | ✅ Implementada e testada em homologação (polling só com conversa, pausa com aba escondida, cache, rate limit por aluno) |
| 2 | ⏳ Ver registro de deploy abaixo |
| 3 | ✅ Coletor root + motor de alertas + sininho (4 abas) + canais + "segurar chat" |
| 4 | ⏳ Teste de carga: ver resultados abaixo |
| 5 | ✅ Inbox estilo Sino (lista, conversa, ficha, filtros, não lidas, som, respostas rápidas, contador no menu) |
| 6 | ✅ Lado WebnarPRO completo e testado contra um Sino simulado (`server/scripts/mock-sino.js`). **Falta o lado do Sino (seção 6.8)**. Até lá, a integração fica desligada em todos os webinars |

**Homologação:** `/home/professoremerson/webnarpro-hml` (porta 3999, banco `professoremerson_webnarpro_hml`, Sino simulado na 3998), gerenciada no pm2 como `webnarpro-hml` e `mock-sino-hml`.
**Testes:** `server/scripts/test-e2e-hml.js` (backend, 59 verificações) e o teste de interface com navegador. Os dois só rodam contra a homologação.

## Contexto: o que aconteceu

- Com ~200 alunos ao vivo, o **Apache** (proxy na frente de todos os apps do servidor) parou de aceitar conexões. Páginas, API, Sala de Atendimento, Métricas e o checkout E4Pay levavam ~30 s ou davam "Failed to fetch".
- Node (2 ms por resposta), MySQL (2 threads ativas), CPU e RAM estavam folgados.
- **Causa:** `sala.js` consulta `GET /support-messages` a cada **4 s** para todos os alunos, o que era 87% do tráfego. Com `KeepAliveTimeout 5`, cada aluno segurava uma conexão permanente. Com `Timeout 300`, celulares lentos prendiam workers por até 5 min. O limite era `MaxRequestWorkers 150`.
- **Correção emergencial (já aplicada):** veja a Fase 0.

## Capacidade atual (configuração de hoje, polling ainda em 4 s)

O limite é de **alunos assistindo ao mesmo tempo**. Leads cadastrados não têm limite prático.

Perfil medido por aluno: ~0,28 req/s, ~1 conexão aberta no Apache e ~0,12–0,15 worker. No checkout (carregado só no clique em comprar), cada aluno abre mais 3–6 conexões por alguns segundos, porque o Apache está em HTTP/1.1.

| Recurso | Limite | Alunos até estourar |
|---|---|---|
| Conexões no Apache (16 processos × ~70) | ~1.100, menos ~90 de outros apps | **~1.000** (primeiro gargalo) |
| Workers do Apache | 400 | ~2.700 |
| Node WebnarPRO (1 processo) | ~2 ms por requisição | ~3.000+ |
| MySQL | 150 conexões (webnarpro: 60 por usuário, pool 50; e4pay: 25, Prisma usa ~9) | não é limitante |

- 🟢 até **~500** alunos simultâneos
- 🟡 **500–800**
- 🔴 acima de **800** (teto ~1.000)

Depois da Fase 1, a estimativa é de **~3.000** alunos, limitados pelo Node e pelo MySQL. O número precisa ser validado com o teste de carga da Fase 4.

---

## Fase 0: emergência ✅ (aplicada em 21/10/2026, ~19:23)

Arquivo `/etc/apache2/conf.d/includes/pre_virtualhost_global.conf`:

```
MaxRequestWorkers 400
Timeout 60
KeepAliveTimeout 3
```

Aplicado com `apachectl configtest && apachectl graceful`. Resultado: respostas de ~30 s caíram para ~0,15 s e a fila na porta 443 foi de 358 para 0.
**Para reverter:** esvaziar o arquivo e rodar `apachectl graceful`.

---

## Fase 1: reduzir a carga por aluno sem perder funções (depois da live)

| # | Tarefa | Arquivo | Função preservada |
|---|---|---|---|
| 1.1 | Só consultar o suporte se o aluno **já tiver uma conversa aberta** (depois da 1ª mensagem no chat ou no suporte). Com a aba do suporte ativa, a cada 5 s; com outra aba, a cada 20 s. Sem conversa, **não consultar** | `public/js/sala.js` (`startSupportPolling`, `send`) | O atendente continua respondendo, e o aluno vê a resposta na hora com a aba aberta |
| 1.2 | Pausar a consulta do suporte quando `document.hidden` e buscar na hora quando a aba voltar a ficar visível | `public/js/sala.js` | A presença continua a cada 30 s, então a retenção fica intacta |
| 1.3 | Cache longo (`maxAge` 30 d, `immutable`) para `/js`, `/css` e `/uploads` versionados | `server/src/app.js` (`express.static`) | O HTML continua sem cache, então versões novas chegam na hora |
| 1.4 | Cache nos assets do E4Pay (`/assets/*`; o `icons.svg` teve 613 hits em pouco tempo) | app E4Pay | — |
| 1.5 | Trocar a versão do `sala.js` para `v=26` em `sala.html` | `public/sala.html` | — |

Situação: uma versão provisória, que só muda o polling para 20 s com `v=26`, está **local, sem commit e sem publicar**. Ela será substituída pela 1.1.

**Ganho esperado:** de ~85 a 90% menos tráfego na sala.

---

## Fase 2: estrutural (próxima semana)

| # | Tarefa | Observação |
|---|---|---|
| 2.1 | Juntar presença e suporte numa chamada `POST /sync` a cada 20–30 s, devolvendo só mensagens novas (`desde=<ultimoId>`) | Uma requisição por aluno em vez de duas, e menos consultas ao banco |
| 2.2 | Instalar `mod_http2` pelo EasyApache. O `http2.conf` já existe, mas o módulo não está carregado | 1 conexão por navegador em vez de até 6. Grande alívio no checkout |
| 2.3 | `innodb_buffer_pool_size` de 128 MB para ~1 GB | **Exige reiniciar o MySQL**, então só fora de live |
| 2.4 | Mover os ajustes do Apache da Fase 0 para o WHM (Global Configuration) e esvaziar o include | Configuração oficial, sobrevive a atualizações do cPanel |
| 2.5 | **Tráfego interno entre WebnarPRO e Sino sem passar pelo Apache.** Hoje `SINO_WEBHOOK_URL=https://sino.professoremersonleite.site` sai pela internet e volta pela porta 443. A sincronização de participantes do Sino também chama a URL pública do WebnarPRO. Trocar para `http://127.0.0.1:3710` (Sino) e `http://127.0.0.1:3000` (WebnarPRO), com o cabeçalho `Host` correto | Tira do Apache todo o tráfego entre sistemas, que hoje compete com os alunos durante a live |

---

## Fase 3: monitoramento e alertas 🟢🟡🔴

### 3.1 Arquitetura

```
[cron root, a cada 60 s]  coleta métricas de infra (Apache, kernel, RAM, CPU, MySQL)
        │  grava JSON
        ▼
server/runtime/infra-metrics.json  (leitura pelo app)
        │
[worker no Node, a cada 60 s]  junta com as métricas internas do Node e do pool
        │  avalia as regras → muda de estado? → grava evento + notifica
        ▼
MySQL: system_metric_snapshots / system_alert_rules / system_alert_events
        │
        ├─► Sininho de alertas no painel (canto inferior direito)
        └─► Notificação ativa (sino e/ou WhatsApp via grupoflow)
```

- O coletor roda como **root** porque precisa de `apachectl status`, `ss` e `nstat`. Ele é leve, sem impacto na live.
- O worker no Node segue o mesmo padrão do `sino.startOutboxWorker()` em `server.js`.
- **Verificação externa (obrigatória):** se o Apache travar, o painel nem abre. Por isso:
  - o vermelho também precisa sair por notificação ativa (WhatsApp);
  - um monitor externo (ex.: UptimeRobot) deve checar `/api/health` de fora.
- Retenção: snapshots de 1 em 1 minuto por 14 dias. Eventos de alerta, por 180 dias.

### 3.2 Indicadores e limites

Os limites são editáveis no painel, e estes são os valores iniciais. A regra dispara quando o limite é ultrapassado em **2 coletas seguidas**, para evitar falso alarme, e volta ao normal depois de **3 coletas** dentro do limite.

**Negócio**

| Indicador | 🟡 | 🔴 |
|---|---|---|
| Alunos ao vivo (presença no último minuto) | > 500 | > 800 |

Depois da Fase 1, os limites de alunos passam para 2.000 / 2.500.

**Apache e rede**

| Indicador | Fonte | 🟡 | 🔴 |
|---|---|---|---|
| Conexões abertas na 443 | `ss` | > 600 | > 850 |
| Workers ocupados (de 400) | `apachectl status` | > 200 | > 300 |
| Processos sem aceitar conexão (`accepting: no`) | `apachectl fullstatus` | > 30% | > 60% |
| Fila de espera na 443 (Recv-Q) | `ss -ltn` | > 10 | > 50 |
| Conexões descartadas pelo kernel (`ListenOverflows`, aumento por minuto) | `nstat` | > 0 | > 50 |
| Tempo de resposta pelo caminho público (`/api/health` via HTTPS) | curl | > 1 s | > 3 s |

**Node (WebnarPRO)**

Métricas coletadas dentro do processo e expostas em `GET /api/admin/system/metrics`:

| Indicador | Como medir | 🟡 | 🔴 |
|---|---|---|---|
| Atraso do event loop (p99) | `perf_hooks.monitorEventLoopDelay` | > 100 ms | > 500 ms |
| Utilização do event loop | `performance.eventLoopUtilization()` | > 70% | > 90% |
| Latência da API (p95, por rota) | middleware de timing | > 300 ms | > 1 s |
| Requisições em andamento | contador no middleware | > 100 | > 300 |
| Taxa de erros 5xx | contador no middleware | > 1% | > 5% |
| Heap usado | `process.memoryUsage()` vs `v8.getHeapStatistics().heap_size_limit` | > 70% | > 85% |
| Pool MySQL: conexões em uso (de 50) | `pool.pool._allConnections` − `_freeConnections` | > 35 | > 45 |
| Pool MySQL: requisições esperando conexão | `pool.pool._connectionQueue.length` | > 0 por 2 min | > 10 |
| Tempo de espera para pegar conexão do pool | timing no `pool.getConnection` | > 50 ms | > 500 ms |
| Fila do sino (outbox pendente) | `SELECT COUNT(*)` no outbox | > 100 | > 1.000 |
| Processo reiniciado (uptime abaixo de 5 min) | `process.uptime()` | — | 🔴 informativo |

**MySQL**

| Indicador | Fonte | 🟡 | 🔴 |
|---|---|---|---|
| Conexões totais (de 150) | `Threads_connected` | > 105 | > 128 |
| Conexões do usuário webnarpro (de 60) | `information_schema.processlist` | > 40 | > 52 |
| Conexões do usuário e4pay (de 25) | idem | > 15 | > 21 |
| Queries executando ao mesmo tempo | `Threads_running` | > 8 | > 16 |
| Queries lentas (aumento por minuto) | `Slow_queries` | > 5 | > 20 |
| Esperas por lock | `Innodb_row_lock_current_waits` | > 0 por 2 min | > 5 |
| Taxa de acerto do buffer pool | `Innodb_buffer_pool_read_requests` / `_reads` | < 99% | < 95% |
| Conexões abortadas (aumento por minuto) | `Aborted_connects` | > 10 | > 50 |

**Servidor**

| Indicador | 🟡 | 🔴 |
|---|---|---|
| RAM disponível | < 1,5 GB | < 800 MB |
| Swap em uso (crescimento em 10 min) | > 200 MB | > 500 MB |
| Carga de CPU (4 núcleos) | > 3 | > 5 |
| Disco `/` | > 80% | > 90% |

### 3.3 Sininho de alertas no painel (canto inferior direito)

Botão flutuante fixo no canto **inferior direito** de todas as telas do painel, **só para administradores**. É diferente do sino de notificações que já existe no rodapé da barra lateral.

**Botão**
- Cor do estado geral: 🟢 tudo ok, 🟡 algum amarelo, 🔴 algum vermelho. No vermelho, pulsa.
- Contador de alertas ativos sem reconhecimento.
- Atualiza a cada 30 s, só com a aba visível. Uma única chamada leve: `GET /api/admin/system/status`.

**Painel (abre ao clicar), com 4 abas**
1. **Agora:** cartões por grupo (Negócio, Apache, Node, MySQL, Servidor), com valor atual, barra até o limite e cor. Mini gráfico da última hora usando os snapshots.
2. **Alertas ativos:** lista com indicador, valor, limite, desde quando, e os botões **Reconhecer** e **Silenciar** (30 min / 2 h / até o fim da live).
3. **Histórico:** linha do tempo das mudanças de estado (ex.: "19:05 🔴 Fila na 443 = 358 → 19:23 🟢"), com filtro por data e por indicador.
4. **Configurar:**
   - liga/desliga e edição dos limites 🟡/🔴 de cada indicador, com botão "restaurar padrão";
   - canais de notificação: sino (webhook já integrado) e WhatsApp (grupoflow), com número ou grupo de destino e a regra de envio (só 🔴, ou 🟡 e 🔴);
   - "Enviar alerta de teste".

**Endpoints (todos com autenticação de admin)**
- `GET  /api/admin/system/status`: estado geral e alertas ativos (para o botão)
- `GET  /api/admin/system/metrics?desde=`: snapshots para os gráficos
- `GET  /api/admin/system/alerts?status=&desde=`: histórico
- `POST /api/admin/system/alerts/:id/ack` e `/silence`
- `GET/PUT /api/admin/system/rules`: limites
- `PUT  /api/admin/system/channels` e `POST /api/admin/system/test-alert`

**Tabelas (em `database/schema.sql`)**
- `system_alert_rules` (metrica, limite_amarelo, limite_vermelho, direcao `acima/abaixo`, habilitado, account_id)
- `system_alert_events` (metrica, nivel, valor, limite, iniciado_em, encerrado_em, reconhecido_por, silenciado_ate)
- `system_metric_snapshots` (coletado_em, payload JSON)
- `system_alert_channels` (tipo, destino, nivel_minimo, habilitado)

**Notificação**
- Envia **só na mudança de estado** (🟢→🟡, 🟡→🔴, de volta a 🟢), nunca a cada minuto.
- Texto curto, por exemplo: `🔴 WebnarPRO: Conexões na 443 = 870 (limite 850). Alunos ao vivo: 812. 21:04`
- Não reenvia o que estiver silenciado.

---

## Fase 4: validação e escala (antes de lives maiores)

| # | Tarefa |
|---|---|
| 4.1 | **Teste de carga** fora de horário de live, com k6 ou autocannon de uma máquina externa, simulando o perfil real de aluno (sala + presença + suporte + clique no checkout) para 500, 1.000, 2.000 e 3.000 alunos. Acompanhar o sininho durante o teste e recalibrar os limites |
| 4.2 | Atualizar a tabela de capacidade deste documento com os números medidos |
| 4.3 | Se a meta passar de ~3.000: Cloudflare na frente (TLS, cache estático, segura conexões lentas) e/ou Node em modo cluster (atenção ao worker do sino, que deve rodar em um processo só) |

---

---

## Fase 5: Salas de Atendimento no estilo do Sino

**Por quê:** na live de 21/10 foram **266 conversas e 943 mensagens de alunos, mas só 10 respostas do suporte**, com pico de 46 mensagens por minuto (19:01 e 19:21). A tela atual, em cartões soltos, não permite acompanhar esse volume.

**Layout em 3 colunas, como o inbox do Sino**

| Coluna | Conteúdo |
|---|---|
| **Esquerda: lista de conversas** | Ordenada pela **última mensagem no topo**. **Bolinha vermelha** com o número de mensagens não lidas. Linha com avatar (iniciais), nome, prévia da última mensagem, horário e etiquetas (webinar, IA/Humano, responsável). Filtros: **Pendentes** (aluno escreveu por último, sem resposta), **IA respondendo**, **Com humano**, **Minhas**, **Encerradas**. Busca por nome, telefone ou e-mail. Ordenação: mais recentes, mais antigas sem resposta, mais mensagens |
| **Centro: conversa** | Linha do tempo com balões diferentes para aluno, IA e humano, e eventos do sistema ("IA pausada", "assumido por Priscila", "devolvido para a IA"). Topo com **Assumir**, **Devolver para a IA**, **Encerrar**, seletor de responsável e **respostas rápidas** |
| **Direita: ficha do aluno** | Webinar, data de cadastro, origem e UTM, **tempo assistido**, **chegou na oferta**, **clicou em comprar**, **comprou** (E4Pay), outras lives assistidas e link para a ficha no Sino |

**Comportamento**
- Contador de pendentes no item "Salas de Atendimento" do menu, e no título da aba do navegador, por exemplo "(12) WebnarPRO".
- Som opcional quando chega mensagem nova.
- Atualização por um único endpoint de mudanças (`GET /api/atendimentos/changes?desde=<cursor>`) a cada 4–5 s, só com a aba visível. Ele devolve só as conversas alteradas, não a lista inteira. Isso é leve, porque só os atendentes usam a tela.
- Tempo de espera do aluno destacado em cores: até 2 min normal, 2–5 min amarelo, mais de 5 min vermelho.

**Banco**
- `atendimentos`: colunas `ultima_mensagem_lead_em`, `ultima_resposta_em`, `nao_lidas`, `modo` (`ia` / `humano`), `ia_pausada_ate`.
- `atendimento_mensagens`: `remetente` passa a aceitar `ia` e `sistema`, mais a coluna `lida_em`.
- Índice `(webinar_id, status, ultima_mensagem_em)`.
- A lista atual faz 2 subconsultas por linha (última mensagem e total). Substituir pelas colunas acima, que são atualizadas a cada mensagem.

---

## Fase 6: integração WebnarPRO ↔ Sino (decidido em 21/10/2026 — começar pelo piloto)

### 6.1 Ideia central

O **WebnarPRO vira um "número" conectado no Sino**: um canal novo chamado `webnar`, que só recebe o público dos webinars.

- Toda conversa do chat ou do suporte de um webinar com a integração ligada vai para o Sino.
- O Sino trata essas conversas **como já trata as do WhatsApp**: a IA responde, e o roteamento manda **venda para venda** e **suporte para suporte**. Passagem para humano, devolução para a IA, setores e responsáveis funcionam igual.
- **Cada webinar tem um prompt e um contexto próprios.** Webinars de produtos e objetivos diferentes fazem o Sino responder com o contexto certo.
- **O chat é momentâneo:** quando a live acaba, o aluno perde o acesso à conversa. Por isso a conversa **continua pelo WhatsApp**, com o lead salvo e contextualizado no Sino e follow-ups feitos pelo Sino (6.7).

### 6.2 Princípio de prioridade: a live primeiro, o chat depois

O chat e a integração são **sistemas secundários**. Se o servidor pesar, eles param primeiro. O vídeo, a sala, a oferta e o checkout nunca podem ser prejudicados por eles.

| Estado do sistema (sininho, Fase 3) | Comportamento do chat ↔ Sino |
|---|---|
| 🟢 Verde | Normal: mensagens vão para o Sino em tempo real e a IA responde |
| 🟡 Amarelo | **Modo econômico:** só são encaminhadas mensagens com cara de pergunta. Conversa de plateia ("top", "boa noite", emojis) fica guardada para o resumo pós-live. Agrupamento das mensagens do mesmo aluno em janelas maiores (15 s) |
| 🔴 Vermelho | **Chat segurado:** nada é encaminhado em tempo real. O aluno vê uma resposta automática local: *"Recebemos sua mensagem! Nossa equipe vai te responder pelo WhatsApp."* Tudo fica na fila e é processado depois que o sistema se normalizar, ou no pós-live (6.7) |
| Manual | **Botão "Segurar chat"** no sininho e no webinar: vale para todos os webinars ou só para aquele. É um disjuntor manual |

Além disso, existe um **disjuntor automático**: se o Sino demorar mais de 10 s ou falhar 5 vezes seguidas, o WebnarPRO para de encaminhar por 2 minutos, coloca tudo na fila e tenta de novo. **O WebnarPRO nunca espera o Sino para responder ao aluno.** Todo envio é em segundo plano, no mesmo padrão "fire and forget" do `services/sino.js` atual.

### 6.3 Configuração dentro do webinar (WebnarPRO)

Nova etapa no assistente do webinar: **"Sino / IA do chat"**.

| Campo | Descrição |
|---|---|
| Integrar com o Sino | Liga ou desliga. Desligado, o chat funciona só na Sala de Atendimento do WebnarPRO, como hoje |
| Atuação | Só ao vivo / ao vivo e replay |
| **Objetivo do webinar** | Venda de produto / captação / aula de conteúdo / onboarding de alunos / outro. Ajuda o Sino a decidir entre venda e suporte |
| **Prompt do webinar** | Texto livre: do que é a aula, para quem é, o que a IA pode e não pode dizer, tom, objeções comuns e respostas. Com **modelo pronto** (botão "preencher com modelo") e **biblioteca de prompts reutilizáveis** (salvar este prompt como modelo e usar em outro webinar) |
| Contexto automático | Gerado **sem digitação**, a partir do que já está configurado: nome e data do webinar, produto, preço original e preço da oferta, horário do pitch e da oferta, link do checkout, bônus e texto da oferta. Mostrado como prévia, só leitura |
| Agente / setor no Sino | Qual agente responde (ex.: Larissa ou um agente específico) e para qual setor vai o que for venda e o que for suporte. A lista vem do Sino pela API |
| Follow-up pós-live | Liga ou desliga. Cadência (padrão: **D+1 e D+3**, opções D+1/D+3/D+5), template oficial de cada etapa e para quem enviar (6.7) |
| Limite de respostas da IA por aluno | Evita gasto excessivo com um aluno só (padrão: 20 por live) |

**O contexto é enviado ao Sino uma vez**, quando o webinar é publicado ou alterado, e não em cada mensagem. O Sino guarda e usa em todas as conversas daquele webinar. Isso deixa cada mensagem leve.

### 6.4 Arquitetura das conexões

```
 Aluno (navegador)                 WebnarPRO (Node :3000)                       Sino (API :3710 / worker)
 ─────────────────                 ──────────────────────                       ─────────────────────────
 envia msg no chat ──HTTPS──►  grava em atendimento_mensagens
                               filtro local (ruído? estado 🟡/🔴?)
                               fila interna webnar_sino_outbox ──127.0.0.1──► POST /api/channels/webnar/inbound
                                                                               fila → raia "webnar" (vagas próprias)
                                                                               IA (prompt do webinar + agente)
                                                                               roteia: venda / suporte / humano
                               POST /api/integracao/sino/reply  ◄──127.0.0.1── envia resposta (ChannelSender "webnar")
                               grava msg (remetente ia/humano)
 consulta a cada 3–20 s ◄────  devolve as novas mensagens
```

**Regras das conexões**
1. **Só rede interna:** `http://127.0.0.1:3710` (Sino) e `http://127.0.0.1:3000` (WebnarPRO), com cabeçalho `Host`. Nada passa pelo Apache nem pela internet (item 2.5).
2. **Conexão reaproveitada (keep-alive)** entre os dois servidores, sem abrir uma nova a cada mensagem.
3. **Autenticação por assinatura HMAC** (segredo compartilhado + carimbo de tempo) nas duas direções. Isso substitui o simples `x-webnarpro-secret` atual.
4. **Idempotência:** toda mensagem leva um `id` único do WebnarPRO, e toda resposta leva um `id` único do Sino. Reenvio nunca duplica.
5. **Agrupamento:** mensagens seguidas do mesmo aluno em até 6 s (15 s no 🟡) viram uma única tarefa de IA.
6. **Fila com reenvio** no WebnarPRO, como o `sino_webhook_outbox` já faz, com backoff. Mensagens velhas demais (aluno já saiu da live) não são respondidas no chat e vão direto para o pós-live.
7. **Raia `webnar` própria** no worker do Sino, com vagas separadas (ex.: 6). O chat da live **nunca** tira vaga da IA do WhatsApp, principalmente na abertura do carrinho, quando rodam as recuperações.
8. **Resposta sempre pelo canal de origem:** conversa nascida no `webnar` só responde no `webnar` enquanto a live existir. O WhatsApp só entra pelo follow-up oficial (6.7), nunca por engano.
9. **Fora dos limites dos números:** o canal `webnar` não conta no limite diário nem no aquecimento dos números de WhatsApp.
10. **Eventos que já existem:** os eventos de presença, oferta e clique (`services/sino.js`) passam a usar a mesma conexão interna. A **sincronização de participantes que o Sino faz consultando a API pública do WebnarPRO** deve virar **push de eventos**, ou passar a usar a rede interna, para não competir com os alunos.

### 6.5 Contrato da API (WebnarPRO ↔ Sino)

**WebnarPRO → Sino**

| Endpoint | Quando | Conteúdo principal |
|---|---|---|
| `PUT /api/channels/webnar/webinars/:webinarId` | Ao publicar ou alterar o webinar | nome, datas, objetivo, prompt do webinar, contexto automático (oferta, preço, checkout, pitch), agente e setores, regras de follow-up, ligado/desligado |
| `POST /api/channels/webnar/inbound` | Mensagem do aluno (já agrupada) | `messageId`, `webinarId`, `sessao` (ao vivo/replay), aluno `{leadId, nome, email, whatsapp}`, `texto`, `momentoDoVideo` (segundo), sinais `{chegouNaOferta, clicouComprar, comprou}` |
| `POST /api/channels/webnar/events` | Entrou, saiu, oferta, clique, compra, fim da live | o que o webhook atual já envia, mais o `fim_da_live` com o resumo por aluno |
| `GET /api/channels/webnar/agents` | Ao abrir a etapa do webinar | lista de agentes e setores para escolher |
| `GET /api/channels/webnar/health` | A cada coleta do sininho | estado e tamanho da fila da raia `webnar` |

**Sino → WebnarPRO**

| Endpoint | Quando | Conteúdo |
|---|---|---|
| `POST /api/integracao/sino/reply` | Resposta da IA ou de um humano no Sino | `replyId`, `messageId` de origem, `leadId`, `texto`, `autor` (`ia` / nome do humano), `setor` |
| `POST /api/integracao/sino/status` | Mudança na conversa | assumido por humano, devolvido para a IA, encerrado. Aparece como evento na Sala de Atendimento |

### 6.6 O que o aluno vê
- A resposta chega no mesmo chat, com o nome do agente ("Larissa · Equipe"), ou do humano quando ele assume.
- Depois de mandar uma mensagem, a sala consulta mais rápido (a cada 3 s) por 2 minutos e depois volta ao ritmo da Fase 1.
- Com o chat segurado (🔴 ou manual): resposta automática local, sem chamar o Sino.
- No fim da live, uma mensagem final no chat: *"Vamos continuar essa conversa pelo seu WhatsApp 😉"*. Isso só aparece se o follow-up estiver ligado e o aluno tiver WhatsApp válido.

### 6.7 Pós-live: lead no Sino e follow-up (executado pelo Sino)

Quando a live termina, ou a cada lote durante a live com o sistema em 🟢, o WebnarPRO envia ao Sino o resumo de cada aluno que **interagiu no chat**.

1. **Procurar o lead no Sino** pelo telefone normalizado (55 + DDD + número). Se não achar, procurar pelo e-mail.
2. **Se existir:** atualizar nome e e-mail se estiverem vazios, e adicionar à ficha o **contexto da live**: qual webinar, quanto tempo assistiu, se chegou na oferta, clicou ou comprou, **o que perguntou no chat**, o que a IA respondeu e o que ficou **sem resposta**.
3. **Se não existir:** **criar o lead automaticamente** com origem "webinar <nome>" e o mesmo contexto.
4. **Encaixar no follow-up do Sino:**
   - **Canal:** **API oficial com template aprovado** (preferência). A API não oficial fica só como alternativa configurável.
   - **Cadência padrão:** **2 follow-ups, em D+1 e D+3**, configurável por webinar (D+1 / D+3 / D+5).
   - **Quem recebe e o quê:**

     | Situação do aluno | Ação |
     |---|---|
     | Comprou | Sem follow-up de venda. Opcional: boas-vindas ou onboarding |
     | Clicou em comprar ou chegou na oferta | **Já existe a recuperação do Sino** (`LIVE_RECOVERY`). Não duplicar: o contexto do chat é **anexado** a essa recuperação |
     | **Conversou no chat e não se encaixa acima** | **Follow-up novo** (D+1, D+3) usando o contexto da conversa |
     | Fez uma pergunta que ficou **sem resposta** | Prioridade: o follow-up D+1 retoma a pergunta |
     | Pediu para não receber, ou está em opt-out | Nada é enviado (o Sino já tem `optout`) |

   - **O follow-up para** se o aluno responder (a conversa abre e a IA do Sino assume), se comprar (checagem no E4Pay) ou se pedir para sair.
5. **Templates:** aprovar na Meta **uma vez** templates **genéricos com variáveis**, para reaproveitar em todos os webinars sem esperar nova aprovação. Por exemplo: `{{1}}` nome, `{{2}}` nome da aula, `{{3}}` assunto que ele perguntou.

### 6.8 O que o Sino precisa desenvolver (base para o prompt que você vai levar ao Sino)

> **Contexto:** o WebnarPRO (plataforma de webinars do Professor Emerson Leite, mesmo servidor) vai se conectar ao Sino como um **novo canal chamado `webnar`**. Ele funciona como um "número" conectado que só recebe o público dos webinars. As conversas chegam pelo WebnarPRO e as respostas voltam para ele. O aluno conversa pelo chat da sala ao vivo.
>
> **Desenvolver no Sino:**
> 1. **Canal `webnar`**: um `ChannelSender` novo (ao lado de evolution/cloudapi/simulated) que envia as respostas para `POST http://127.0.0.1:3000/api/integracao/sino/reply` (assinado com HMAC), e uma entrada `POST /api/channels/webnar/inbound` que cria ou recebe a conversa e enfileira o processamento. Idempotência por `messageId`.
> 2. **Contexto por webinar**: `PUT /api/channels/webnar/webinars/:id` guarda o prompt, o objetivo, o contexto da oferta e o agente/setores do webinar. Toda conversa vinda de um webinar usa **esse prompt específico**, somado ao agente escolhido, na montagem do prompt (`prompt-builder`).
> 3. **Roteamento como já funciona**: a IA responde. O que for venda vai para o setor de vendas e o que for suporte vai para o suporte, com passagem para humano e devolução para a IA iguais ao WhatsApp. Avisar o WebnarPRO das mudanças (`/api/integracao/sino/status`).
> 4. **Raia própria `webnar`** no worker, com vagas separadas da raia "IA pensando", e **disjuntor**: se a raia acumular, responder ao WebnarPRO com "segurar" (HTTP 429/503) para ele reter as mensagens.
> 5. **Canal fora dos limites e do aquecimento** dos números de WhatsApp.
> 6. **Resposta sempre pelo canal de origem**: conversa `webnar` nunca responde por WhatsApp enquanto estiver no canal `webnar`.
> 7. **Pós-live** (`POST /api/channels/webnar/events` com `fim_da_live`): para cada aluno que interagiu, buscar o lead por telefone (e e-mail), atualizar ou criar, gravar o contexto (webinar, tempo assistido, oferta, clique, compra, perguntas, respostas, pendências), e **encaixar no follow-up**: API oficial com template aprovado, 2 envios (D+1 e D+3, configurável), sem duplicar a recuperação `LIVE_RECOVERY` existente, parando quando o aluno responder, comprar ou pedir opt-out.
> 8. **Listar agentes e setores** (`GET /api/channels/webnar/agents`) e **expor a saúde da raia** (`GET /api/channels/webnar/health`).
> 9. **No inbox do Sino:** etiqueta "Webinar · <nome>" na conversa e filtro por canal `webnar`.
> 10. **Testes:** roteamento venda/suporte por webinar, idempotência, conversa `webnar` nunca enviando por WhatsApp, follow-up não duplicado com `LIVE_RECOVERY`, e o comportamento do disjuntor.
>
> **Detalhes técnicos do lado WebnarPRO (já implementado e testado em 22/10/2026):**
> - **Base:** o WebnarPRO chama `http://127.0.0.1:3710/api/channels/webnar/...` (variável `SINO_CHANNEL_URL`).
> - **Assinatura WebnarPRO → Sino:**
>   - cabeçalhos `x-webnarpro-timestamp: <unix segundos>` e `x-webnarpro-signature: sha256=<hex>`;
>   - `<hex>` = HMAC-SHA256 com o segredo, calculado sobre `"<timestamp>.<corpo bruto>"`. Em GET, o corpo é vazio;
>   - segredo: `SINO_CHANNEL_SECRET`, ou, se ela não existir, o mesmo `SINO_WEBHOOK_SECRET` que o Sino já usa.
> - **Assinatura Sino → WebnarPRO:** mesmo formato, com os cabeçalhos `x-sino-timestamp` e `x-sino-signature`. O WebnarPRO recusa carimbos com mais de 5 min.
> - **Endpoints que o Sino chama no WebnarPRO** (`http://127.0.0.1:3000`):
>   - `POST /api/integracao/sino/reply`: `{ replyId, conversaId, texto, autor: { tipo: 'ia'|'humano', nome }, setor? }`. É idempotente por `replyId`. Textos acima de 1000 caracteres viram mais de um balão;
>   - `POST /api/integracao/sino/status`: `{ conversaId, status: 'assumido_humano'|'devolvido_ia'|'encerrado', por?, setor? }`.
> - **`conversaId`** = `webnar-<id do atendimento>`. Vem em todo `inbound` e deve voltar igual no `reply`/`status`.
> - **Agrupamento:** o `inbound` traz `texto` (as mensagens unidas por quebra de linha) e `mensagens[]` (cada uma separada). `messageId` = `webnar-<ids>` (chave de idempotência).
> - **Eventos (`POST /events`):**
>   - `fim_da_live`: em lotes de 100 alunos, com `alunos[]` = `{leadId, nome, email, whatsapp, tempoAssistidoSegundos, chegouNoPitch, chegouNaOferta, clicouComprar, comprou, interagiuNoChat, perguntas[], respostas[], ficouSemResposta}`;
>   - `resposta_equipe_webnar`: atendente do WebnarPRO respondeu;
>   - `status_atendimento`: `assumido_webnarpro`, `devolvido_ia` ou `encerrado`.
> - **Segurar:** o Sino responde **HTTP 429 ou 503** quando a raia `webnar` estiver cheia. O WebnarPRO pausa por 2 min sem contar como erro.
> - **Alertas do sistema:** se o canal "Sino" for ligado no sininho, o WebnarPRO manda `POST /webhooks/webnarpro` com `{ evento: 'alerta_sistema', estado, texto, alertas[] }`. O Sino pode repassar o `texto` ao dono por WhatsApp (já existe o job `owner_notify`).
> - **Sincronização de participantes:** hoje o Sino chama a URL pública do WebnarPRO (`/api/integracao/participantes`), passando pelo Apache. Trocar a URL dessa integração no Sino para `http://127.0.0.1:3000`.

### 6.9 O que o WebnarPRO precisa desenvolver

| # | Tarefa |
|---|---|
| 6.9.1 | Etapa "Sino / IA do chat" no assistente do webinar (6.3), com biblioteca de prompts reutilizáveis e prévia do contexto automático |
| 6.9.2 | Tabelas `webinar_sino_config`, `prompt_templates`, `webnar_sino_outbox` (fila de mensagens com status, tentativas e `messageId`) |
| 6.9.3 | Envio do contexto ao Sino ao publicar ou alterar o webinar |
| 6.9.4 | Encaminhamento das mensagens: filtro de ruído, agrupamento, fila, disjuntor, respeito ao estado 🟢🟡🔴 e ao "Segurar chat" |
| 6.9.5 | Endpoints `/api/integracao/sino/reply` e `/status`, com HMAC e idempotência |
| 6.9.6 | `atendimento_mensagens.remetente` aceita `ia`, `humano_sino` e `sistema`, e a sala mostra o nome do agente |
| 6.9.7 | Evento `fim_da_live` com o resumo por aluno (presença, oferta, clique, compra, perguntas e respostas) |
| 6.9.8 | Troca da URL pública para a rede interna nos eventos existentes (item 2.5) |
| 6.9.9 | Indicadores no sininho: fila `webnar_sino_outbox` (🟡 > 50, 🔴 > 200), tempo de resposta do Sino (🟡 > 5 s, 🔴 > 15 s) e disjuntor aberto (🔴) |

### 6.10 Piloto e critérios de sucesso

1. Ambiente de teste: o Sino em `SIMULATION_MODE` / dry-run, com um webinar de teste.
2. **Piloto real** em um webinar pequeno (< 100 alunos), com o follow-up indo **só para uma lista de telefones de teste** (o Sino já tem `ALLOWED_TEST_PHONES`).
3. **Teste de carga** (Fase 4): 1.000 alunos e 50 mensagens/min no chat, **ao mesmo tempo** que as recuperações do WhatsApp.
4. **Critérios para liberar em todas as lives:**
   - nenhum alerta 🟡 causado pela integração;
   - tempo médio de resposta da IA no chat < 15 s;
   - a IA do WhatsApp não atrasa mais de 20%;
   - zero mensagens de conversa `webnar` saindo pelo WhatsApp;
   - zero follow-ups duplicados.
5. Se algum critério falhar: a integração **continua desligada por padrão** e o chat funciona só pela Sala de Atendimento (Fase 5) até a correção.

**Papel da Fase 5 neste cenário:** o inbox principal das conversas de webinar passa a ser o do Sino. A Sala de Atendimento do WebnarPRO continua como **plano B**: integração desligada, chat segurado ou Sino fora. Por isso, nela basta o essencial: lista com bolinha vermelha e ordenada pela última conversa, e a conversa com resposta.

---

## Ordem de execução sugerida

1. **Fase 1** (1.1 a 1.5) e commit, com deploy fora de live.
2. **Fase 3**: coletor, regras, sininho e notificações. Base do "segurar chat" automático da Fase 6.
3. **Fase 2** (2.2, 2.3 e **2.5**, rede interna, em janela sem live).
4. **Fase 5 (essencial)**: Sala de Atendimento como plano B.
5. **Fase 6, lado WebnarPRO** (6.9), e você leva o texto da **6.8** para o Sino desenvolver a parte dele.
6. **Fase 4**: teste de carga com o cenário da integração.
7. **Piloto** (6.10), depois a liberação em todas as lives.

## Pendências de decisão

- Canal preferido para o 🔴 dos alertas: WhatsApp, sino ou os dois?
- Número ou grupo de WhatsApp de destino dos alertas.
- Quem mais (além de você) vê o sininho e recebe alertas.
- A IA atua também no replay, ou só ao vivo?
- Agente padrão no chat: a Larissa, ou um agente próprio para webinars?
- Textos dos templates oficiais genéricos de follow-up (D+1 e D+3), para enviar à Meta para aprovação o quanto antes, porque a aprovação leva tempo.
- Qual número oficial envia os follow-ups pós-live.
- O follow-up vale só para quem **conversou no chat** (como pedido), ou também para quem assistiu e não interagiu? Hoje o Sino não faz recuperação para quem assistiu sem chegar na oferta (decisão de 19/10).
