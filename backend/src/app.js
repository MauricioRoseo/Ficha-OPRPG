const express = require('express');
const cors = require('cors');

require('./config/database');

const app = express();
const characterRoutes = require('./routes/characterRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const featureRoutes = require('./routes/featureRoutes');
const authRoutes = require('./routes/authRoutes');
const protectionRoutes = require('./routes/protectionRoutes');
const tabRoutes = require('./routes/tabRoutes');
const attackRoutes = require('./routes/attackRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const itemsRoutes = require('./routes/itemsRoutes');

app.use(cors());
app.use(express.json());
app.use('/characters', characterRoutes);
app.use('/attributes', attributeRoutes);
app.use('/features', featureRoutes);
app.use('/auth', authRoutes);
app.use('/protections', protectionRoutes);
app.use('/', tabRoutes);
app.use('/', attackRoutes);
app.use('/', inventoryRoutes);
app.use('/', itemsRoutes);

app.get('/', (req, res) => {
  res.send('API Ficha OPRPG funcionando 🚀');
});

module.exports = app;