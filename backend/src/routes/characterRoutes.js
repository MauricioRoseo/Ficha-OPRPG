const express = require('express');
const router = express.Router();

const CharacterController = require('../controllers/characterController');
const authMiddleware = require('../middlewares/authMiddleware');

// criar personagem
router.post('/', authMiddleware, (req, res) => CharacterController.create(req, res));
// listar personagens
router.get('/', authMiddleware, (req, res) => CharacterController.findAll(req, res));
// allow deletion of a character (masters can delete any character)
router.delete('/:id', authMiddleware, (req, res) => CharacterController.delete(req, res));
router.get('/:id/full', authMiddleware, (req, res) => CharacterController.getFull(req, res));
// debug: get patrimonio value
router.get('/:id/patrimonio', authMiddleware, (req, res) => CharacterController.getPatrimonio(req, res));
// atualizar campos do personagem (stats)
router.put('/:id', authMiddleware, (req, res) => CharacterController.update(req, res));
// atualizar campos básicos/descrição/imagens do personagem
router.put('/:id/details', authMiddleware, (req, res) => CharacterController.updateDetails(req, res));
// completa a criação: o cliente envia escolhas de perícias/habilidades adicionais
router.post('/:id/complete', authMiddleware, (req, res) => CharacterController.completeCreation(req, res));
// level up endpoint: applies level/nex changes
router.post('/:id/levelup', authMiddleware, (req, res) => CharacterController.levelUp(req, res));
// atualizar/crear antecedentes (background)
router.put('/:id/background', authMiddleware, (req, res) => CharacterController.updateBackground(req, res));
// notas (character notes)
router.get('/:id/notes', authMiddleware, (req, res) => CharacterController.getNotes(req, res));
router.post('/:id/notes', authMiddleware, (req, res) => CharacterController.createNote(req, res));
router.put('/:id/notes/:noteId', authMiddleware, (req, res) => CharacterController.updateNote(req, res));
router.delete('/:id/notes/:noteId', authMiddleware, (req, res) => CharacterController.deleteNote(req, res));

module.exports = router;