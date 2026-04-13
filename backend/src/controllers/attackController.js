const AttackModel = require('../models/attackModel');

const AttackController = {
  listByCharacter: (req, res) => {
    const { characterId } = req.params;
    AttackModel.findByCharacterId(characterId, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  },

  createForCharacter: (req, res) => {
    const { characterId } = req.params;
    const data = req.body;
    AttackModel.create(characterId, data, (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({ id: result.insertId });
    });
  },

  update: (req, res) => {
    const { id } = req.params;
    const data = req.body;
    AttackModel.update(id, data, (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Attack updated' });
    });
  },

  remove: (req, res) => {
    const { id } = req.params;
    AttackModel.remove(id, (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Attack removed' });
    });
  }
};

module.exports = AttackController;
