const express = require('express');
const router = express.Router();
const TabController = require('../controllers/tabController');

// GET /characters/:characterId/tabs
router.get('/characters/:characterId/tabs', TabController.getByCharacter);

module.exports = router;
