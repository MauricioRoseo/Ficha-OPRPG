const ItemsModel = require('../models/itemsModel');

const ItemsController = {
  search: (req, res) => {
    const q = req.query.search || '';
    ItemsModel.search(q, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  }
  ,

  getById: (req, res) => {
    const id = req.params.id;
    ItemsModel.findById(id, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result || null);
    });
  },

  create: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const data = req.body || {};
    ItemsModel.create(data, (err, result) => {
      if (err) return res.status(500).json(err);
      ItemsModel.findById(result.insertId, (err2, created) => {
        if (err2) return res.status(500).json(err2);
        res.status(201).json({ item: created });
      });
    });
  },

  update: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    const data = req.body || {};
    ItemsModel.update(id, data, (err, result) => {
      if (err) return res.status(500).json(err);
      ItemsModel.findById(id, (err2, updated) => {
        if (err2) return res.status(500).json(err2);
        res.json({ item: updated });
      });
    });
  },

  remove: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    ItemsModel.remove(id, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Item removido' });
    });
  }
};

module.exports = ItemsController;
