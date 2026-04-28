const express = require('express');
const router = express.Router();

const CharacterController = require('../controllers/characterController');
const authMiddleware = require('../middlewares/authMiddleware');

// criar personagem
router.post('/', authMiddleware, CharacterController.create);
// listar personagens
router.get('/', authMiddleware, CharacterController.findAll);
// allow deletion of a character (masters can delete any character)
router.delete('/:id', authMiddleware, CharacterController.delete);
router.get('/:id/full', authMiddleware, CharacterController.getFull);
// debug: get patrimonio value
router.get('/:id/patrimonio', authMiddleware, CharacterController.getPatrimonio);
// atualizar campos do personagem (stats)
router.put('/:id', authMiddleware, CharacterController.update);
// atualizar campos básicos/descrição/imagens do personagem
router.put('/:id/details', authMiddleware, CharacterController.updateDetails);
// completa a criação: o cliente envia escolhas de perícias/habilidades adicionais
router.post('/:id/complete', authMiddleware, CharacterController.completeCreation);
// level up endpoint: applies level/nex changes
router.post('/:id/levelup', authMiddleware, CharacterController.levelUp);
// atualizar/crear antecedentes (background)
router.put('/:id/background', authMiddleware, CharacterController.updateBackground);
// notas (character notes)
router.get('/:id/notes', authMiddleware, CharacterController.getNotes);
router.post('/:id/notes', authMiddleware, CharacterController.createNote);
router.put('/:id/notes/:noteId', authMiddleware, CharacterController.updateNote);
router.delete('/:id/notes/:noteId', authMiddleware, CharacterController.deleteNote);

module.exports = router;