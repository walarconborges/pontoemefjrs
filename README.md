# Folha de Ponto — E.M.E.F. João Ribeiro Soares

Aplicação web de código público para cadastro de vínculos, ocorrências mensais e geração de folhas de frequência A4. **O repositório não contém os dados reais dos servidores.**

## Arquitetura

- **Site:** GitHub Pages, publicado automaticamente pelo GitHub Actions em `https://walarconborges.github.io/pontoemefjrs/`.
- **API:** Cloudflare Worker em `https://pontoemefjrs-api.wilberalarcon.workers.dev`. Código-fonte em `cloudflare/worker.js`.
- **Armazenamento:** Cloudflare Workers KV `pontoemefjrs-dados`, ligado à API como `DADOS`.
- **Autorização:** segredo `API_TOKEN` da Cloudflare (no mínimo 16 caracteres; senha exclusiva, difícil de adivinhar). A API verifica o token a cada acesso. CORS é restrito à origem do GitHub Pages, mas **não substitui a autenticação**.

## Como usar a sincronização

1. Abra o site do GitHub Pages.
2. Selecione **Conectar à nuvem** e informe a chave salva no seu gerenciador de senhas.
3. Se já existirem dados na nuvem, eles serão carregados. Se o KV estiver vazio, o site continuará vazio até que o operador cadastre ou importe uma planilha e mande salvar.
4. Depois da conexão, alterações em cadastros, calendários e situações acionam o salvamento automático. O botão **Salvar agora** permite forçar uma gravação.
5. A importação e exportação XLSX continuam disponíveis como cópia de segurança. Importar enquanto conectado substitui o conjunto de dados na nuvem, mediante confirmação.

A chave é mantida **somente na memória da aba**, e não é persistida em localStorage, sessionStorage ou no GitHub. É necessário informá-la novamente depois de recarregar a página.

## Segurança e limitações

- **Ainda em validação:** não importe nomes, matrículas nem situações reais antes de testar com registros inteiramente fictícios e confirmar a autorização institucional de uso.
- Nunca envie planilhas reais, credenciais, backups, `.env`, tokens ou dados pessoais ao GitHub público.
- O token é uma **chave compartilhada**: quem a possuir terá acesso de leitura e escrita a todos os dados. Não há contas separadas nem auditoria individual por usuário.
- KV é eventualmente consistente e não foi projetado para edição simultânea com controle de conflitos. Evite editar o mesmo cadastro em dois aparelhos ao mesmo tempo. Faça backups regulares em XLSX.
- Os dados não são criptografados de ponta a ponta pelo aplicativo; o provedor da nuvem os processa. Avalie requisitos de privacidade e governança antes do uso com registros funcionais reais.
- Caso a gravação automática falhe, o site indica o problema; utilize **Salvar agora** ou exporte um backup antes de fechar a aba.
- O endpoint `/health` apenas informa que o Worker está executando. Não comprova leitura nem escrita do KV.
- Não edite diretamente o segredo no código. Use **Settings → Variables and Secrets** no Worker.

## Desenvolvimento

O site permanece em um único `index.html` sem dependências externas de JavaScript. O código da API em `cloudflare/worker.js` é publicado separadamente no painel Cloudflare. Mudanças no HTML disparam o GitHub Actions.

Para testar sem dados pessoais: conecte à nuvem, crie um registro fictício, salve, recarregue a página, conecte novamente e confirme se o registro voltou. Teste também a edição do calendário e a exportação XLSX.

## Emissão em lote de meses

Na aba **Gerar folha de ponto**, selecione **Período de impressão → Vários meses em um PDF**. Informe o mês inicial, o mês final e o ano. A visualização gera as folhas mês a mês em um só documento, mantendo o mesmo modelo A4. Use **Imprimir / Salvar em PDF** para gravar todas as páginas num único PDF.

**Importante para o histórico:** o cadastro atual é uma lista geral de vínculos e pode não representar exatamente a composição da escola em cada mês de 2026. Antes de imprimir arquivos históricos definitivos, confira as ocorrências individuais, o calendário e a lista de servidores referentes a cada mês. Importar uma planilha XLSX substitui o estado inteiro, não acrescenta automaticamente outro mês: consolide os dados primeiro e mantenha um backup.

## Importação do histórico de julho a novembro de 2026

O site aceita a aba opcional `VinculosMensais` (Ano, Mês, Matrícula, Nome, Cargo, Turno), de modo que cada mês possa ter uma composição própria de servidores. O PDF em lote usa a lista, o cargo, o turno e a numeração de **cada mês**, sem alterar o modelo da folha impressa. A aba é preservada na próxima exportação Excel.

Para utilizar a planilha histórica:
1. Abra o site e **conecte à nuvem**.
2. **Antes de importar**, exporte uma cópia de segurança dos dados atualmente na nuvem, caso existam.
3. Importe a planilha consolidada com `Servidores`, `Calendario`, `Situacoes`, `VinculosMensais` e demais abas.
4. Espere o status **Salvo na nuvem** e teste a reconexão.
5. Em **Gerar folha de ponto**, selecione **Vários meses em um PDF**, de **julho a novembro de 2026**, e escolha **todos os servidores**. O site prevê **213 páginas** na base preparada a partir dos arquivos de referência.
6. Use o botão de impressão do próprio site e, no navegador, selecione **Salvar como PDF**.

**Revisão manual necessária:** foram encontradas divergências entre versões de agosto e outubro. O arquivo privado de importação explica cada situação na aba `Conferencias`. Consulte essa aba antes de imprimir um documento oficial.

**Privacidade:** não envie a planilha histórica nem o PDF gerado ao repositório público. A planilha é fornecida como arquivo privado da conversa; o GitHub contém exclusivamente o código.
