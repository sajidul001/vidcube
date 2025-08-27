import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Example API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend build
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
