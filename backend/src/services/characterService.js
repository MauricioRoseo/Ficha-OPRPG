const CharacterModel = require('../models/characterModel');
const AttributeModel = require('../models/attributeModel');
const FeatureService = require('./featureService');

const CharacterService = {
  createCharacter: (data, callback) => {
    if (data.level_mode === 'auto') {
      data.nivel = Math.floor(data.nex / 5);
    }

    CharacterModel.create(data, (err, result) => {
      if (err) return callback(err);

      const characterId = result.insertId;

      // 🔥 cria atributos automaticamente
      AttributeModel.create(characterId, (err2) => {
        if (err2) return callback(err2);

        callback(null, result);
      });
    });
  },

  getAllCharacters: (callback) => {
    CharacterModel.findAll(callback);
  },

  getCharactersByUser: (userId, callback) => {
    CharacterModel.findByUserId(userId, callback);
  },

  getFullCharacter: (characterId, userId, callback) => {
    const CharacterModel = require('../models/characterModel');
    const AttributeModel = require('../models/attributeModel');
    const FeatureService = require('./featureService');

    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);

      if (!character) {
        return callback({ message: 'Personagem não encontrado' });
      }

      // 🔒 validação de dono
      if (character.user_id !== userId) {
        return callback({ message: 'Acesso negado' });
      }

      // 🔥 atributos
      AttributeModel.findByCharacterId(characterId, (err2, attributes) => {
        if (err2) return callback(err2);

        // 🔥 features
        FeatureService.getCharacterFeaturesGrouped(characterId, (err3, features) => {
          if (err3) return callback(err3);

          callback(null, {
            character,
            attributes: attributes[0] || {},
            features
          });
        });
      });
    });
  }
};

module.exports = CharacterService;