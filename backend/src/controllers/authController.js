const AuthService = require('../services/authService');

const AuthController = {

  register: (req, res) => {
    AuthService.register(req.body, (err, result) => {
      if (err) return res.status(500).json(err);

      res.status(201).json({ message: 'Usuário criado!' });
    });
  },

  login: (req, res) => {
    AuthService.login(req.body, (err, result) => {
      if (err) return res.status(400).json(err);

      res.json(result);
    });
  }

  , me: (req, res) => {
    const UserModel = require('../models/userModel');
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Não autenticado' });

    UserModel.findById(userId, (err, user) => {
      if (err) return res.status(500).json(err);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

      res.json({ id: user.id, name: user.name, email: user.email });
    });
  }

};

module.exports = AuthController;