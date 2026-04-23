const express = require('express');
const router = express.Router();
const ItemsController = require('../controllers/itemsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/items', authMiddleware, ItemsController.search);
router.get('/items/:id', authMiddleware, ItemsController.getById);
router.post('/items', authMiddleware, ItemsController.create);
router.put('/items/:id', authMiddleware, ItemsController.update);
router.delete('/items/:id', authMiddleware, ItemsController.remove);

module.exports = router;
