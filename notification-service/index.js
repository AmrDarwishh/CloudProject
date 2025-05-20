import express from 'express';

const app = express();
const PORT = 3003;

app.use(express.json());

// POST /notify - send a notification
app.post('/notify', (req, res) => {
  const { user, message } = req.body;
  if (!user || !message) {
    return res.status(400).json({ error: 'user and message are required' });
  }
  // Simulate sending notification (e.g., email, SMS, push)
  console.log(`[Notification] To: ${user} | Message: ${message}`);
  res.json({ status: 'Notification sent' });
});

app.get('/', (req, res) => {
  res.send('Notification Service is running');
});

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
}); 