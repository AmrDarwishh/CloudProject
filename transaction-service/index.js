const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// ✅ Allow frontend requests
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ✅ Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://instapayuser:InstaPay2025@cluster0.nogfhoj.mongodb.net/instapay?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB Atlas connected (Transaction Service)'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: Number,
});
const User = mongoose.model('User', userSchema);

// ✅ Define schema
const transactionSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.post('/send', async (req, res) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount) {
    return res.status(400).send('Missing fields');
  }

  try {
    // Fetch both users
    const sender = await User.findOne({ username: from });
    const receiver = await User.findOne({ username: to });

    if (!sender || !receiver) {
      return res.status(404).send('User not found');
    }

    if (sender.balance < amount) {
      return res.status(400).send('Insufficient balance');
    }

    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    // Save changes
    await sender.save();
    await receiver.save();

    // Save transaction (optional)
    const transaction = new Transaction({
      from,
      to,
      amount,
      timestamp: new Date()
    });
    await transaction.save();

    // Send notification to receiver (non-blocking)
    fetch('http://notification-service:3004/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: to,
        message: `You have received $${amount} from ${from}.`
      })
    }).catch(err => {
      console.error('Notification service error:', err.message);
    });

    // Also add notification to user-service (non-blocking)
    fetch(`http://user-service:3001/notifications/${to}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You have received $${amount} from ${from}.`
      })
    }).catch(err => {
      console.error('User service notification error:', err.message);
    });

    res.status(200).send('Transaction completed');
  } catch (err) {
    console.error(err);  // Important for debugging
    res.status(500).send('Internal server error');
  }
});



// ✅ Route to fetch user transactions
app.get('/history/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const transactions = await Transaction.find({
      $or: [{ from: username }, { to: username }]
    }).sort({ timestamp: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching transactions');
  }
});

// ✅ Start the service
app.listen(3002, () => console.log('Transaction Service running on port 3002'));
