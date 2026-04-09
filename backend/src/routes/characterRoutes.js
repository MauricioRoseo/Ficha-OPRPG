const express = require('express');
const router = express.Router();

const CharacterController = require('../controllers/characterController');

router.post('/', CharacterController.create);
router.get('/', CharacterController.findAll);

module.exports = router;