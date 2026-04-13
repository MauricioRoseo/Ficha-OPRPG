const express = require('express');
const router = express.Router();

const ProtectionController = require('../controllers/protectionController');
const authMiddleware = require('../middlewares/authMiddleware');
const ProtectionTemplateController = require('../controllers/protectionTemplateController');

// list templates
router.get('/templates', authMiddleware, ProtectionTemplateController.list);
// create template
router.post('/templates', authMiddleware, ProtectionTemplateController.create);

// create per-character protection from template
router.post('/from-template', authMiddleware, ProtectionController.createFromTemplate);

// update partial protection (e.g., toggle equipped)
router.put('/:id', authMiddleware, ProtectionController.update);

// delete protection
router.delete('/:id', authMiddleware, ProtectionController.remove);

// create protection
router.post('/', authMiddleware, ProtectionController.create);

module.exports = router;
