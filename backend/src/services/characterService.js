const CharacterModel = require('../models/characterModel');

const CharacterService = {
  createCharacter: (data, callback) => {
    // regra: calcular nível automaticamente se necessário
    if (data.level_mode === 'auto') {
      data.nivel = Math.floor(data.nex / 5);
    }

    CharacterModel.create(data, callback);
  },

  getAllCharacters: (callback) => {
    CharacterModel.findAll(callback);
  }
};

module.exports = CharacterService;