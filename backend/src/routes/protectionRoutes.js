const express = require('express');
const router = express.Router();

const ProtectionController = require('../controllers/protectionController');
const authMiddleware = require('../middlewares/authMiddleware');

// update partial protection (e.g., toggle equipped)
router.put('/:id', authMiddleware, ProtectionController.update);

// create protection
router.post('/', authMiddleware, ProtectionController.create);

module.exports = router;
