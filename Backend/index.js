const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({ dialect: 'sqlite', storage: './db.sqlite' });
const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    // get better method to store address
    // maybe another table?
    type: DataTypes.JSON,
    allowNull: false,
  },
});

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('db synced');
  } catch (error) {
    console.error('db sync error:', error);
  }
};

sequelize.authenticate()
.then(() => console.log('db con established'))
.catch(e => console.error('db con failed:', e));

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

syncDB();

app.get('/profiles', async (req, res) => {
  try {
    const profiles = await Profile.findAll();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'failed to retrieve profiles' });
  }
});

app.get('/profile/:profileid', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.profileid);
    if (!profile) throw new Error('profile not found');
    res.status(200).json(profile);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/profile', async (req, res) => {
  try {
    const { name, phone, department, address } = req.body;
    const newProfile = await Profile.create({ name, phone, department, address });
    res.status(201).json({ message: 'profile created', profile: newProfile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/profile/:profileid', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.profileid);
    if (!profile) throw new Error('profile not found');
    const { name, phone, department, address } = req.body;
    await profile.update({ name, phone, department, address });
    res.status(200).json({ message: 'profile updated', profile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/profile/:profileid', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.profileid);
    if (!profile) throw new Error('profile not found');
    await profile.destroy();
    res.status(200).json({ message: 'profile deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Started on: http://localhost:${PORT}`));
