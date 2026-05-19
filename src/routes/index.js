const express = require('express');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const verificationsRoutes = require('./verifications.routes');
const logsRoutes = require('./logs.routes');
const searchRoutes = require('./search.routes');


const router = express.Router();

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de usuários
router.use('/users', usersRoutes);

// Rotas de verificações
router.use('/verifications', verificationsRoutes);

// Rotas de logs
router.use('/logs', logsRoutes);

// Rotas de busca/pesquisas (notícias pesquisadas)
router.use('/search', searchRoutes);

module.exports = router;


