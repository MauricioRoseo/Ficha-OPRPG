const CharacterService = require('../services/characterService');

const CharacterController = {
  create: (req, res) => {
    const data = req.body;
    data.user_id = req.user.id;

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
    const userId = req.user.id;

    CharacterService.getCharactersByUser(userId, (err, results) => {
      if (err) return res.status(500).json(err);

      res.json(results);
    });
  },

  getFull: (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    CharacterService.getFullCharacter(id, userId, (err, result) => {
      if (err) {
        // 🔥 trata erro corretamente
        if (err.message === 'Acesso negado') {
          return res.status(403).json(err);
        }

        return res.status(500).json(err);
      }

      res.json(result);
    });
  }
,

  update: (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const data = req.body;

    CharacterService.updateCharacter(id, userId, data, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json(err);
        return res.status(500).json(err);
      }

      res.json(result);
    });
  }
};

module.exports = CharacterController;