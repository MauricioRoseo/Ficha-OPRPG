const express = require('express');
const router = express.Router();

const RitualController = require('../controllers/ritualController');

router.post('/', RitualController.create);
router.get('/', RitualController.findAll);
router.get('/search', RitualController.search);
router.get('/:id', RitualController.getById);

module.exports = router;
