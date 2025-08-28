import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Serve built frontend
app.use(express.static(path.join(process.cwd(), 'public')));

// SPA fallback
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
