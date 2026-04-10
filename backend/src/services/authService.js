const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AuthService = {

  register: async (data, callback) => {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      UserModel.create({
        name: data.name,
        email: data.email,
        password: hashedPassword
      }, callback);

    } catch (err) {
      callback(err);
    }
  },

  login: (data, callback) => {
    UserModel.findByEmail(data.email, async (err, results) => {
      if (err) return callback(err);

      if (results.length === 0) {
        return callback({ message: 'Usuário não encontrado' });
      }

      const user = results[0];

      const validPassword = await bcrypt.compare(data.password, user.password);

      if (!validPassword) {
        return callback({ message: 'Senha inválida' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      callback(null, { token });
    });
  }

};

module.exports = AuthService;