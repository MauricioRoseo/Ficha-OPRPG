const CharacterRitualModel = require('../models/characterRitualModel');

const CharacterRitualController = {
  getByCharacter: (req, res) => {
    const { characterId } = req.params;
    CharacterRitualModel.getByCharacter(characterId, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
  },

  addFromCatalog: (req, res) => {
    const { characterId, ritualId } = req.params;
    const data = req.body || {};
    CharacterRitualModel.addFromCatalog(characterId, ritualId, data, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Ritual adicionado ao personagem', id: result.insertId });
    });
  },

  createCustom: (req, res) => {
    const { characterId } = req.params;
    const data = req.body || {};
    CharacterRitualModel.createCustom(characterId, data, (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({ message: 'Ritual criado e adicionado', id: result.insertId });
    });
  },

  removeFromCharacter: (req, res) => {
    const { characterId, id } = req.params;
    CharacterRitualModel.remove(id, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Ritual removido' });
    });
  }
  ,
  update: (req, res) => {
    const { characterId, id } = req.params;
    const data = req.body || {};
    CharacterRitualModel.update(characterId, id, data, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Ritual atualizado' });
    });
  }
};

module.exports = CharacterRitualController;
