const express = require('express');
const { body } = require('express-validator');

const verificacaoController = require('../controllers/verificacao.controller');
const { validate } = require('../middlewares/validate');

const router = express.Router();

/**
 * @openapi
 * /api/verificar:
 *   post:
 *     summary: Verificar notícia (texto ou link)
 *     tags: [Verificação]
 *     description: Analisa uma notícia usando IA e fact-checking databases
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modo:
 *                 type: string
 *                 enum: [texto, link]
 *               texto:
 *                 type: string
 *                 description: Texto da notícia (se modo=texto)
 *               link:
 *                 type: string
 *                 description: URL da notícia (se modo=link)
 *               cidade:
 *                 type: string
 *               categoria:
 *                 type: string
 *             required: [modo]
 */
router.post(
  '/',
  [
    body('modo').isIn(['texto', 'link']),
    body('texto').optional({ nullable: true }).isString().trim(),
    body('link').optional({ nullable: true }).isString().trim().isURL(),
    body('cidade').optional({ nullable: true }).isString(),
    body('categoria').optional({ nullable: true }).isString(),
  ],
  validate,
  (req, res, next) => verificacaoController.verificar(req, res, next)
);

/**
 * Health check para verificador
 */
router.get('/status', (req, res) => verificacaoController.statusVerificador(req, res));

module.exports = router;
