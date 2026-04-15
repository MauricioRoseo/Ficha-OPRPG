const ResistanceModel = require('../models/resistanceModel');
const CharacterModel = require('../models/characterModel');

const ResistanceController = {
  update: (req, res) => {
    const { characterId } = req.params;
    const payload = req.body || {};

    CharacterModel.findById(characterId, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

      ResistanceModel.updateByCharacterId(characterId, payload, (err2, updated) => {
        if (err2) return res.status(500).json(err2);
        return res.json({ message: 'Resistências atualizadas', resistances: updated });
      });
    });
  }
};

module.exports = ResistanceController;
