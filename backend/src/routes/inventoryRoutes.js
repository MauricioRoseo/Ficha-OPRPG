const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/inventory/character/:characterId', authMiddleware, InventoryController.listByCharacter);
router.post('/inventory', authMiddleware, InventoryController.create);
router.put('/inventory/:id', authMiddleware, InventoryController.update);
router.delete('/inventory/:id', authMiddleware, InventoryController.remove);

module.exports = router;
