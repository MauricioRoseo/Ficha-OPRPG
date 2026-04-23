const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/classes', authMiddleware, TemplateController.getClasses);
router.get('/trails', authMiddleware, TemplateController.getTrailsByClass); // ?classId=
router.get('/trails/:classId', authMiddleware, TemplateController.getTrailsByClass);
// admin CRUD for trails
router.post('/trails', authMiddleware, TemplateController.createTrail);
router.put('/trails/:id', authMiddleware, TemplateController.updateTrail);
router.delete('/trails/:id', authMiddleware, TemplateController.deleteTrail);
router.get('/origins', authMiddleware, TemplateController.getOrigins);
// admin CRUD for origins
router.post('/origins', authMiddleware, TemplateController.createOrigin);
router.put('/origins/:id', authMiddleware, TemplateController.updateOrigin);
router.delete('/origins/:id', authMiddleware, TemplateController.deleteOrigin);
// admin CRUD for classes
router.post('/classes', authMiddleware, TemplateController.createClass);
router.put('/classes/:id', authMiddleware, TemplateController.updateClass);
router.delete('/classes/:id', authMiddleware, TemplateController.deleteClass);

module.exports = router;
