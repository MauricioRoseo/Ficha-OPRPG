const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/classes', authMiddleware, TemplateController.getClasses);
router.get('/trails', authMiddleware, TemplateController.getTrailsByClass); // ?classId=
router.get('/trails/:classId', authMiddleware, TemplateController.getTrailsByClass);
router.get('/origins', authMiddleware, TemplateController.getOrigins);

module.exports = router;
