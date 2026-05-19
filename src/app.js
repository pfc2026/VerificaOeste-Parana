const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');
const { swaggerSetup } = require('./config/swagger');
const { errorHandler } = require('./middlewares/errorHandler');

/**
 * Cria e configura a aplicação Express.
 *
 * Separando criação do app do start do servidor melhora testabilidade e organização.
 */
function createApp() {
  const app = express();

  // JSON parser
  app.use(express.json({ limit: '1mb' }));

  // Servir arquivos estáticos (mantém compatível com o frontend já existente)
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // CORS
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Swagger (UI)
  swaggerSetup(app);

  // Rotas da API
  app.use('/api', routes);

  // Endpoint health
  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok' });
  });

  // 404 padrão (endpoint inexistente)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Rota ${req.method} ${req.originalUrl} não encontrada` },
    });
  });

  // Tratamento global de erros
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

