const ProtectionTemplateModel = require('../models/protectionTemplateModel');

const ProtectionTemplateController = {
  list: (req, res) => {
    ProtectionTemplateModel.findAll((err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ templates: results });
    });
  },

  create: (req, res) => {
    const data = req.body;
    if (!data.name) return res.status(400).json({ message: 'Nome é obrigatório' });
    // attach created_by if available
    if (req.user && req.user.id) data.created_by = req.user.id;

    ProtectionTemplateModel.create(data, (err, result) => {
      if (err) return res.status(500).json(err);
      ProtectionTemplateModel.findById(result.insertId, (err2, created) => {
        if (err2) return res.status(500).json(err2);
        res.status(201).json({ template: created });
      });
    });
  }
};

module.exports = ProtectionTemplateController;
