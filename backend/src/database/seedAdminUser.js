require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// tiny promise wrapper for db.query
const query = (sql, values = []) => new Promise((resolve, reject) => {
  db.query(sql, values, (err, results) => err ? reject(err) : resolve(results));
});

const ensureRoleColumn = async () => {
  const exists = await query(`SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`);
  if (exists && exists[0] && exists[0].c === 0) {
    await query("ALTER TABLE users ADD COLUMN role ENUM('player','master','admin') DEFAULT 'player'");
    console.log('✔ Coluna role adicionada em users');
  }
};

const run = async () => {
  try {
    console.log('🌱 Seed: criando usuário administrador (testeadmin@gmail)');

    await ensureRoleColumn();

    const email = 'testeadmin@gmail';
    const plain = '1234';

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      console.log('ℹ Usuário já existe:', email, 'id=', existing[0].id);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(plain, 10);
    const res = await query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Mestre Administrador', email, hashed, 'admin']);
    console.log('✔ Usuário administrador criado com id=', res.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar usuário admin:', err && err.message ? err.message : err);
    process.exit(1);
  }
};

run();
