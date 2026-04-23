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
  ,

  update: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    const data = req.body || {};
    RitualModel.update(id, data, (err, result) => {
      if (err) return res.status(500).json(err);
      RitualModel.findById(id, (err2, updated) => {
        if (err2) return res.status(500).json(err2);
        res.json({ ritual: updated });
      });
    });
  },

  remove: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    RitualModel.remove(id, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Ritual removido' });
    });
  }
};

module.exports = RitualController;
