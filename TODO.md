# TODO: Implementar Busca de Notícias na Barra de Pesquisa

## Passos do Plano Aprovado

### 1. Modificar HTML (public/index.html)
- [x] Manter textarea, selects de cidade e categoria
- [x] Alterar título para "Pesquisar Notícias"
- [x] Alterar texto do botão para "Pesquisar Notícias"
- [x] Ajustar placeholder da textarea

### 2. Modificar JavaScript (public/js/script.js)
- [x] Ajustar handler do form para busca ao invés de verificação
- [x] Modificar modal para exibir resultados de busca (título, link, snippet)
- [x] Usar os filtros de cidade/categoria na busca se selecionados
- [x] Corrigir porta para 5000 e adicionar logs de debug

### 3. Ajustar Backend
- [x] Servidor rodando na porta 5000
- [x] Substituir API do Google por dados mockados para funcionar sem chaves

### 4. Testar Funcionalidade
- [x] Verificar se a busca funciona corretamente com dados mockados
- [x] Testar exibição dos resultados no modal

Progresso: Funcionalidade implementada com dados mockados. Agora a pesquisa mostra resultados no modal.
