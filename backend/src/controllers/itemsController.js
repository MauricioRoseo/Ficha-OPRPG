const ItemsModel = require('../models/itemsModel');

const ItemsController = {
  search: (req, res) => {
    const q = req.query.search || '';
    ItemsModel.search(q, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  }
};

module.exports = ItemsController;
