const express = require('express');
const { body, query } = require('express-validator');

const searchController = require('../controllers/search.controller');
const { authJwt } = require('../middlewares/authJwt');
const { validate } = require('../middlewares/validate');

const router = express.Router();

/**
 * @openapi
 * /api/search:
 *   post:
 *     summary: Salvar resultado de uma notícia pesquisada
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authJwt,
  [
    body('modo').isIn(['texto', 'link']),
    body('texto').optional({ nullable: true }).isString(),
    body('url').optional({ nullable: true }).isString(),
    body('resultado').optional().isObject(),
  ],
  validate,
  (req, res, next) => searchController.save(req, res, next)
);

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Listar notícias pesquisadas do usuário
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authJwt,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('q').optional().isString(),
    query('veredito').optional().isString(),
    query('modo').optional().isIn(['texto', 'link']),
  ],
  validate,
  (req, res, next) => searchController.list(req, res, next)
);

module.exports = router;

