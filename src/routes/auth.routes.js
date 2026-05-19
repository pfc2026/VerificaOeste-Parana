const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');
const { authJwt } = require('../middlewares/authJwt');


const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Cadastro de usuário
 *     tags: [Auth]
 */
router.post(
  '/register',
  [
    body('nome').isString().isLength({ min: 2, max: 120 }),
    body('email').isEmail(),
    body('senha').isString().isLength({ min: 6, max: 200 }),
    body('cpf').isString().optional({ nullable: true }),
    body('tipo').isIn(['admin', 'usuario']).optional({ nullable: true }),
    body('ativo').isBoolean().optional({ nullable: true }),
  ],
  validate,
  (req, res, next) => authController.register(req, res, next)
);


/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login e emissão de JWT
 *     tags: [Auth]
 */
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('senha').isString().isLength({ min: 1, max: 200 }),
  ],
  validate,
  (req, res, next) => authController.login(req, res, next)
);

const { authJwt } = require('../middlewares/authJwt');

// Dados do usuário logado
// @openapi
// /api/auth/me:
//   get:
//     summary: Retorna dados do usuário logado
//     tags: [Auth]
router.get('/me', authJwt, (req, res, next) => authController.me(req, res, next));

module.exports = router;




