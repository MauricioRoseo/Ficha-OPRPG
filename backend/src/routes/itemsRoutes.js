const express = require('express');
const router = express.Router();
const ItemsController = require('../controllers/itemsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/items', authMiddleware, ItemsController.search);

module.exports = router;
