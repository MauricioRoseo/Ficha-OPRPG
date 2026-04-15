const express = require('express');
const router = express.Router();

const ResistanceController = require('../controllers/resistanceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.put('/:characterId', authMiddleware, ResistanceController.update);

module.exports = router;
