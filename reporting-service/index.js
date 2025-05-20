const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // allow only the frontend
  credentials: true               // if you use cookies/session (optional)
}));

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/instapay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected to reporting-service'))
.catch(err => console.error('MongoDB connection error:', err));

// Transaction schema (must match transaction-service)
const transactionSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  date: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Summary endpoint
app.get('/summary', async (req, res) => {
  try {
    const transactions = await Transaction.find();

    const summary = {};

    for (const t of transactions) {
      summary[t.from] = (summary[t.from] || 0) - t.amount;
      summary[t.to] = (summary[t.to] || 0) + t.amount;
    }

    res.json(summary);
  } catch (err) {
    res.status(500).send('Failed to generate summary');
  }
});

app.listen(3003, () => console.log('Reporting Service running on port 3003'));
