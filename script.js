const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // Em servidor (HEADLESS=1 ou NODE_ENV=production) roda sem abrir janela
  const headless = process.env.HEADLESS === '1' || process.env.NODE_ENV === 'production';
  const browser = await chromium.launch({ headless }); 
  const page = await browser.newPage();

  try {
    console.log("Acessando o site...");
    await page.goto('https://apl01.pmcg.ms.gov.br/scsweb/searchpref.jsp'); // URL base baseada no seu contexto

    // 1. Clica na aba "Ontem"
    console.log("Clicando na aba Ontem...");
    await page.click('#onte-tab');

    // Espera um pouco para a aba carregar o conteúdo
    await page.waitForTimeout(2000);

    // 2. Localiza todos os itens da lista dentro da seção de ontem
    // O seletor abaixo assume que a lista aparece após clicar na aba
    const itens = page.locator('#entries-yesterday ul li');
    const total = await itens.count();
    console.log(`Encontrados ${total} registros.`);

    let listaResultados = [];

    // 3. Loop para clicar em cada item e extrair os dados
    for (let i = 0; i < total; i++) {
      console.log(`Processando registro ${i + 1} de ${total}...`);
      
      // Clica no item da lista
      await itens.nth(i).click();

      // Aguarda o infocontainer atualizar (importante se houver transição)
      await page.waitForTimeout(800); 

      // 4. Extração dos dados de dentro do infocontainer
      const dados = await page.evaluate(() => {
        const container = document.querySelector('.infocontainer');
        if (!container) return null;

        const info = {};
        const paragrafos = container.querySelectorAll('p');

        paragrafos.forEach(p => {
          // O innerText vem como "Nome:\nAVELINO..." ou "Nome: AVELINO..."
          const texto = p.innerText.trim();
          const partes = texto.split(':');
          
          if (partes.length >= 2) {
            const chave = partes[0].trim();
            // Junta o restante caso o valor contenha ":" (ex: horários)
            const valor = partes.slice(1).join(':').replace(/\n/g, ' ').trim();
            info[chave] = valor;
          }
        });
        return info;
      });

      if (dados) {
        listaResultados.push(dados);
      }
    }

    // 5. Salva os dados em um arquivo JSON
    fs.writeFileSync('dados_ontem.json', JSON.stringify(listaResultados, null, 2), 'utf-8');
    console.log("Sucesso! Os dados foram salvos em 'dados_ontem.json'.");

  } catch (error) {
    console.error("Erro na automação:", error);
  } finally {
    await browser.close();
  }
})();