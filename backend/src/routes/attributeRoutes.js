const express = require('express');
const router = express.Router();

const AttributeController = require('../controllers/attributeController');

router.get('/:id', AttributeController.getByCharacter);
router.put('/:id', AttributeController.update);

module.exports = router;