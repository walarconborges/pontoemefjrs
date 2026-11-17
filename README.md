# Folha de Ponto — E.M.E.F. João Ribeiro Soares

Aplicação web para cadastro de vínculos de servidores, edição de ocorrências mensais, registro de situações individuais e geração de folhas de ponto A4.

## Situação do projeto

Esta primeira versão pública contém **somente o código da interface**, sem nomes, matrículas ou planilhas reais incorporados. Funciona como aplicação local no navegador: é possível adicionar servidores manualmente, importar um arquivo XLSX e exportar novamente. Os dados importados permanecem na sessão do navegador e não são transmitidos automaticamente para a nuvem.

**A integração com banco privado e autenticação ainda não está implementada.** A próxima etapa prevista é usar Cloudflare Pages, uma API protegida por autenticação e Cloudflare D1.

## Como usar a versão inicial

Abra `index.html` no navegador, cadastre dados fictícios ou importe uma planilha de teste. Edite situações/calendário, gere a folha e exporte um XLSX para preservar as alterações.

## Privacidade e segurança

- Não inclua nomes, matrículas, planilhas reais, credenciais, arquivos `.env` ou bancos de dados em commits, issues ou pull requests públicos.
- A visibilidade pública do repositório permite visualizar todo o conteúdo e histórico que forem enviados.
- Um banco D1 nunca deve ser acessado diretamente do navegador: as operações devem passar por API autenticada, com autorização conferida **no servidor**.
- Até a API privada estar pronta, o aplicativo **não possui sincronização entre dispositivos**; exporte sua planilha antes de fechar.
- Não use dados pessoais reais em páginas públicas sem um modelo de acesso, permissões e armazenamento seguro.

## Publicação planejada

Cloudflare Pages a partir da branch `main`, sem framework ou etapa de build (diretório de saída: raiz do repositório). A conexão com D1 e a proteção dos endpoints serão implementadas em uma etapa posterior.
