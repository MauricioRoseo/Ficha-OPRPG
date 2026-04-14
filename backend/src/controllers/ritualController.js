const RitualModel = require('../models/ritualModel');

const RitualController = {
  create: (req, res) => {
    RitualModel.create(req.body, (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({ id: result.insertId });
    });
  },

  findAll: (req, res) => {
    RitualModel.findAll((err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
  },

  search: (req, res) => {
    const q = req.query.q || '';
    RitualModel.search(q, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
  },

  getById: (req, res) => {
    const { id } = req.params;
    RitualModel.findById(id, (err, ritual) => {
      if (err) return res.status(500).json(err);
      if (!ritual) return res.status(404).json({ message: 'Ritual não encontrado' });
      res.json(ritual);
    });
  }
};

module.exports = RitualController;
