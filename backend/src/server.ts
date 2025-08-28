import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Serve frontend build (public)
// ❌ old: app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(process.cwd(), 'public')));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Fallback to index.html
// ❌ old: res.sendFile(path.join(__dirname, 'public', 'index.html'));
app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

