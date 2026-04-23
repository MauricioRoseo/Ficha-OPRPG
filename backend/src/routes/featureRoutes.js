const express = require('express');
const router = express.Router();

const FeatureController = require('../controllers/featureController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', FeatureController.create);
router.get('/', FeatureController.findAll);
router.get('/search', FeatureController.search);

// admin: update or remove a feature template
router.put('/:id', authMiddleware, FeatureController.update);
router.delete('/:id', authMiddleware, FeatureController.remove);

// vincular feature ao personagem
router.post('/:characterId/:featureId', authMiddleware, FeatureController.addToCharacter);

// listar features do personagem
router.get('/character/:characterId', authMiddleware, FeatureController.getByCharacter);
router.put('/character/:characterId/:id', authMiddleware, FeatureController.updateCharacterFeature);
router.delete('/character/:characterId/:id', authMiddleware, FeatureController.removeFromCharacter);

module.exports = router;