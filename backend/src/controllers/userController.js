const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

const UserController = {

  list: (req, res) => {
    // only master/admin
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    UserModel.findAll((err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  },

  create: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    const { name, email, password, role: newRole } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email e password são obrigatórios' });

    // hash password
    const hashed = bcrypt.hashSync(String(password), 10);
    const user = { name, email, password: hashed, role: newRole || 'player' };

    UserModel.create(user, (err, result) => {
      if (err) return res.status(500).json(err);
      UserModel.findById(result.insertId, (err2, created) => {
        if (err2) return res.status(500).json(err2);
        res.status(201).json({ user: created });
      });
    });
  },

  update: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    const { id } = req.params;
    const payload = req.body || {};

    // don't allow password here
    delete payload.password;

    UserModel.update(id, payload, (err, result) => {
      if (err) return res.status(500).json(err);
      UserModel.findById(id, (err2, user) => {
        if (err2) return res.status(500).json(err2);
        res.json({ user });
      });
    });
  },

  resetPassword: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    const { id } = req.params;
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ message: 'password obrigatório' });

    const hashed = bcrypt.hashSync(String(password), 10);
    UserModel.updatePassword(id, hashed, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Senha atualizada' });
    });
  },

  remove: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    const { id } = req.params;
    UserModel.remove(id, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Usuário removido' });
    });
  }

};

module.exports = UserController;
