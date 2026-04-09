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

};

module.exports = AuthController;