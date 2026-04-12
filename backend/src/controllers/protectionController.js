const ProtectionModel = require('../models/protectionModel');

const ProtectionController = {
  // update partial fields (currently used to toggle equipped)
  update: (req, res) => {
    const { id } = req.params;
    const data = req.body;

    ProtectionModel.findById(id, (err, protection) => {
      if (err) return res.status(500).json(err);
      if (!protection) return res.status(404).json({ message: 'Proteção não encontrada' });
      // ownership check: ensure the protection belongs to a character owned by req.user
      const CharacterModel = require('../models/characterModel');
      CharacterModel.findById(protection.character_id, (err2, character) => {
        if (err2) return res.status(500).json(err2);
        if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
        if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

        ProtectionModel.update(id, data, (err3, result) => {
          if (err3) return res.status(500).json(err3);

          // recompute passive defense total for this character
          ProtectionModel.findByCharacterId(protection.character_id, (err4, protections) => {
            if (err4) return res.status(500).json(err4);
            const sum = (protections || []).filter(p=>p.equipped==1).reduce((acc, p) => acc + (p.passive_defense||0), 0);
            const CharacterModel = require('../models/characterModel');
            CharacterModel.setPassiveDefense(protection.character_id, sum, (err5) => {
              if (err5) return res.status(500).json(err5);
              res.json({ message: 'Proteção atualizada', defesa_passiva: sum });
            });
          });
        });
      });
    });
  }
  ,

  create: (req, res) => {
    const data = req.body;
    // data must include character_id and name at minimum
    if (!data.character_id || !data.name) return res.status(400).json({ message: 'character_id e name são obrigatórios' });

    // verify ownership
    const CharacterModel = require('../models/characterModel');
    CharacterModel.findById(data.character_id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

      // create protection
      ProtectionModel.create(data, (err2, result) => {
        if (err2) return res.status(500).json(err2);

        // fetch created row
        ProtectionModel.findById(result.insertId, (err3, created) => {
          if (err3) return res.status(500).json(err3);
          // recompute passive defense total and return it
          ProtectionModel.findByCharacterId(created.character_id, (err4, protections) => {
            if (err4) return res.status(500).json(err4);
            const sum = (protections || []).filter(p=>p.equipped==1).reduce((acc, p) => acc + (p.passive_defense||0), 0);
            const CharacterModel = require('../models/characterModel');
            CharacterModel.setPassiveDefense(created.character_id, sum, (err5) => {
              if (err5) return res.status(500).json(err5);
              res.status(201).json({ protection: created, defesa_passiva: sum });
            });
          });
        });
      });
    });
  }
};

module.exports = ProtectionController;
