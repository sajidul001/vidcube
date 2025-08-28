import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Serve built frontend
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/_ls', (_req: Request, res: Response) => {
  const pub = path.join(process.cwd(), 'public');
  const files = fs.existsSync(pub) ? fs.readdirSync(pub) : [];
  res.json({ publicDir: pub, files });
});

// SPA fallback
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
