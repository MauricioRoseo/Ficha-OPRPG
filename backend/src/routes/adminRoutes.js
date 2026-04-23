const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/export', authMiddleware, AdminController.export);
router.post('/import', authMiddleware, AdminController.import);

module.exports = router;
