const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const DIR = __dirname;

// Horário da coleta (9h da manhã, fuso Brasil)
const CRON_HORA = process.env.CRON_HORA || '9';
const CRON_MINUTO = process.env.CRON_MINUTO || '0';
const TZ = process.env.TZ || 'America/Sao_Paulo';

// Servir arquivos estáticos (dashboard, dados_ontem.json)
app.use(express.static(DIR));

// Rota raiz redireciona para o dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard.html');
});

// Health check para serviços em nuvem
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Opcional: disparar coleta manualmente via GET (útil para testes)
app.get('/atualizar', (req, res) => {
  res.json({ ok: true, msg: 'Coleta iniciada em segundo plano.' });
  runScraper()
    .then(() => console.log('[Coleta manual] Concluída.'))
    .catch((err) => console.error('[Coleta manual] Erro:', err));
});

function runScraper() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['script.js'], {
      cwd: DIR,
      env: { ...process.env, HEADLESS: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; process.stderr.write(d); });
    child.stdout.on('data', (d) => process.stdout.write(d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `script.js exit code ${code}`));
    });
  });
}

// Agendamento: todo dia às 9h (horário de Brasília)
const cronExpr = `${CRON_MINUTO} ${CRON_HORA} * * *`;
cron.schedule(cronExpr, () => {
  console.log(`[${new Date().toISOString()}] Executando coleta agendada...`);
  runScraper()
    .then(() => console.log('[Coleta] Concluída com sucesso.'))
    .catch((err) => console.error('[Coleta] Erro:', err));
}, { timezone: TZ });

console.log(`Coleta agendada: todo dia às ${CRON_HORA}:${CRON_MINUTO.padStart(2,'0')} (${TZ}).`);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard.html`);
});
