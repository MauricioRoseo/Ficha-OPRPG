const express = require('express');
const router = express.Router();
const AttackController = require('../controllers/attackController');

// GET attacks for a character
router.get('/characters/:characterId/attacks', AttackController.listByCharacter);
// POST create attack for character
router.post('/characters/:characterId/attacks', AttackController.createForCharacter);
// PUT update attack
router.put('/attacks/:id', AttackController.update);
// DELETE attack
router.delete('/attacks/:id', AttackController.remove);

module.exports = router;
