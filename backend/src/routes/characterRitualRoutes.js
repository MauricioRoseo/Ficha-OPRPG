const express = require('express');
const router = express.Router();

const CharacterRitualController = require('../controllers/characterRitualController');
const authMiddleware = require('../middlewares/authMiddleware');

// adicionar ritual do catálogo ao personagem
router.post('/rituals/character/:characterId/:ritualId', authMiddleware, CharacterRitualController.addFromCatalog);

// criar ritual customizado e adicionar ao personagem
router.post('/rituals/character/:characterId', authMiddleware, CharacterRitualController.createCustom);

// listar rituais do personagem
router.get('/rituals/character/:characterId', authMiddleware, CharacterRitualController.getByCharacter);

// remover ritual do personagem
router.delete('/rituals/character/:characterId/:id', authMiddleware, CharacterRitualController.removeFromCharacter);
// atualizar ritual do personagem (editar circulo, dt_resistencia, símbolos, modifiers)
router.put('/rituals/character/:characterId/:id', authMiddleware, CharacterRitualController.update);

module.exports = router;
