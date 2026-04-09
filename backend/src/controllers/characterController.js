const CharacterService = require('../services/characterService');

const CharacterController = {
  create: (req, res) => {
    const data = req.body;

    CharacterService.createCharacter(data, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err });
      }

      res.status(201).json({
        message: 'Personagem criado com sucesso!',
        id: result.insertId
      });
    });
  },

  findAll: (req, res) => {
    CharacterService.getAllCharacters((err, results) => {
      if (err) {
        return res.status(500).json({ error: err });
      }

      res.json(results);
    });
  }
};

module.exports = CharacterController;