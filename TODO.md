# TODO: Corrigir Bugs no server.js (Porta em Uso e Melhorias)

## Passos do Plano Aprovado

### 1. Liberar Porta 5000
- [x] Identificar e matar o processo Node.js usando a porta 5000.
  - Usar comandos Windows: `netstat -ano | findstr :5000` para encontrar PID, depois `taskkill /PID <PID> /F`.
  - Isso resolve o erro EADDRINUSE sem mudar o código.

### 2. Editar server.js
- [x] Remover import desnecessário de axios.
- [x] Adicionar Access-Control-Allow-Methods no CORS.
- [x] Adicionar default para PORT: process.env.PORT || 5000.
- [x] Logar req.body completo na rota /api/verificar para debug.

### 3. Instalar Dependências (se necessário)
- [ ] Executar `npm install` para garantir express, dotenv, etc.

### 4. Iniciar Servidor
- [x] Rodar `node server.js` e verificar logs sem erros.

### 5. Testar Rotas
- [ ] GET /teste: Deve retornar { mensagem: 'Servidor funcionando! ✅' }.
- [ ] POST /api/verificar com {texto: "teste"}: Deve processar sem crash (erro 500 se chaves ausentes).

### 6. Verificações Adicionais
- [ ] Testar frontend: Abrir http://localhost:5000 e submeter form.
- [ ] Se OK, configurar chaves Google no .env.

Progresso: Iniciando com liberação da porta.
