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
