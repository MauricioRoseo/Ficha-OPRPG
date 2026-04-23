const express = require('express');
const router = express.Router();

const RitualController = require('../controllers/ritualController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, RitualController.create);
router.get('/', authMiddleware, RitualController.findAll);
router.get('/search', authMiddleware, RitualController.search);
router.get('/:id', authMiddleware, RitualController.getById);
// admin update/delete
router.put('/:id', authMiddleware, RitualController.update);
router.delete('/:id', authMiddleware, RitualController.remove);

module.exports = router;
