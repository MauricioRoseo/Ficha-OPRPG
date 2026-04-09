const express = require('express');
const router = express.Router();

const FeatureController = require('../controllers/featureController');

router.post('/', FeatureController.create);
router.get('/', FeatureController.findAll);

// vincular feature ao personagem
router.post('/:characterId/:featureId', FeatureController.addToCharacter);

// listar features do personagem
router.get('/character/:characterId', FeatureController.getByCharacter);

module.exports = router;