const AttributeModel = require('../models/attributeModel');

const AttributeController = {
  getByCharacter: (req, res) => {
    const { id } = req.params;

    AttributeModel.findByCharacterId(id, (err, results) => {
      if (err) return res.status(500).json(err);

      res.json(results[0]);
    });
  },

  update: (req, res) => {
    const { id } = req.params;
    const data = req.body;

    AttributeModel.update(id, data, (err) => {
      if (err) return res.status(500).json(err);

      res.json({ message: 'Atributos atualizados!' });
    });
  }
};

module.exports = AttributeController;