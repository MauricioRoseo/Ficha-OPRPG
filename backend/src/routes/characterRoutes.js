const express = require('express');
const router = express.Router();

const CharacterController = require('../controllers/characterController');
const authMiddleware = require('../middlewares/authMiddleware');

// criar personagem
router.post('/', authMiddleware, CharacterController.create);
// listar personagens
router.get('/', authMiddleware, CharacterController.findAll);
router.get('/:id/full', authMiddleware, CharacterController.getFull);
// atualizar campos do personagem (stats)
router.put('/:id', authMiddleware, CharacterController.update);

module.exports = router;