const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// ✅ Setup CORS to allow only your frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 1000 }, // start everyone with 1000
  notifications: [
    {
      message: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});
const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb+srv://instapayuser:InstaPay2025@cluster0.nogfhoj.mongodb.net/instapay?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ✅ Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing credentials');

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).send('User already exists');

    const welcomeMsg = 'Welcome to Mini-InstaPay!';
    const user = new User({ username, password, notifications: [{ message: welcomeMsg }] });
    await user.save();

    // Send notification to notification-service (non-blocking)
    fetch('http://notification-service:3004/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: username,
        message: welcomeMsg
      })
    }).catch(err => {
      console.error('Notification service error:', err.message);
    });

    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});

// ✅ Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).send('Invalid credentials');
  res.send('Login successful');
});

// Get user balance
app.get('/balance/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).send('User not found');
  res.json({ balance: user.balance });
});

// Endpoint to get recent notifications for a user
app.get('/notifications/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).send('User not found');
  res.json(user.notifications.slice(-10).reverse()); // last 10, most recent first
});

// Endpoint to add a notification for a user
app.post('/notifications/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).send('User not found');
  const { message } = req.body;
  if (!message) return res.status(400).send('Message is required');
  user.notifications.push({ message });
  await user.save();
  res.status(201).send('Notification added');
});

// ✅ Start the server
app.listen(3001, () => console.log('User Service running on port 3001'));
