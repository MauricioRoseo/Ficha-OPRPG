const express = require('express');
const cors = require('cors');

require('./config/database');

const app = express();
const characterRoutes = require('./routes/characterRoutes');

app.use(cors());
app.use(express.json());
app.use('/characters', characterRoutes);
app.get('/', (req, res) => {
  res.send('API Ficha OPRPG funcionando 🚀');
});

module.exports = app;