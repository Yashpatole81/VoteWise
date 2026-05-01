require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRoute = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/chat', chatRoute);

// Fallback: serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ VoteWise server running at http://localhost:${PORT}`);
});
