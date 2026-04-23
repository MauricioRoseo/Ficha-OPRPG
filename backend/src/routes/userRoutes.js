const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, UserController.list);
router.post('/', authMiddleware, UserController.create);
router.put('/:id', authMiddleware, UserController.update);
router.put('/:id/password', authMiddleware, UserController.resetPassword);
router.delete('/:id', authMiddleware, UserController.remove);

module.exports = router;
