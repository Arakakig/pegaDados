# pegaDados — Dashboard de Sepultamentos

Coleta diária dos dados da aba "Ontem" do SCS Web (PMCG) e dashboard com gráficos por funerária e local de sepultamento.

## Rodar localmente

```bash
npm install
npx playwright install chromium
npm start
```

Acesse: **http://localhost:3000** (redireciona para o dashboard).

## Deploy em servidor em nuvem

### Requisitos

- **Node.js 18+**
- **Chromium** do Playwright (instalado com `npx playwright install chromium`)
- Em Linux, dependências para o Chromium:  
  `sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2`  
  (em Ubuntu/Debian; em outros distros consulte a [doc do Playwright](https://playwright.dev/docs/intro).)

### Passos

1. Envie o projeto para o servidor (git clone, upload, etc.).
2. No servidor:

```bash
cd pegadados
npm install --production
npx playwright install chromium
```

3. Inicie o servidor (porta definida por `PORT` ou 3000):

```bash
export PORT=3000
npm start
```

4. Para manter rodando em background (exemplo com `nohup`):

```bash
nohup npm start > server.log 2>&1 &
```

Ou use um gerenciador de processos como **PM2**:

```bash
npm install -g pm2
pm2 start server.js --name pegadados
pm2 save && pm2 startup
```

### Variáveis de ambiente (opcional)

| Variável       | Padrão              | Descrição                          |
|----------------|---------------------|------------------------------------|
| `PORT`         | `3000`              | Porta do servidor HTTP             |
| `TZ`           | `America/Sao_Paulo` | Fuso para o agendamento (9h)       |
| `CRON_HORA`    | `9`                 | Hora do dia para rodar a coleta    |
| `CRON_MINUTO`  | `0`                 | Minuto (0 = 9:00)                  |
| `NODE_ENV`     | -                   | `production` deixa o script headless |

### Coleta automática

O servidor agenda a coleta **todo dia às 9h da manhã** (horário de Brasília).  
Para rodar a coleta manualmente: **GET** `https://seu-servidor/atualizar`.

### Health check

**GET** `https://seu-servidor/health` — retorna `{ "ok": true }` para uso em load balancers e monitoramento.
