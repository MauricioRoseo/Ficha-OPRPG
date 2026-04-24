const express = require('express');
const router = express.Router();

const LayoutController = require('../controllers/layoutController');
const authMiddleware = require('../middlewares/authMiddleware');

// public view by slug
router.get('/public/:slug', LayoutController.getBySlug);

// authenticated fetch for editing/view (owner or master/admin)
router.get('/:id', authMiddleware, LayoutController.getById);

// authenticated routes for master/admin
router.post('/', authMiddleware, LayoutController.create);
router.get('/', authMiddleware, LayoutController.getByCreator);
router.put('/:id', authMiddleware, LayoutController.update);
router.delete('/:id', authMiddleware, LayoutController.delete);

router.post('/:id/characters', authMiddleware, LayoutController.addCharacter);
router.delete('/:id/characters/:charId', authMiddleware, LayoutController.removeCharacter);

module.exports = router;
