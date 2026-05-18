import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  // Increased limit for potential base64 images, though client-side upload should be used mostly
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // BFF Proxy for Magnific AI
  app.all('/api/magnific/*', async (req, res) => {
    const userApiKey = req.headers['x-user-api-key'];

    if (!userApiKey) {
      return res.status(401).json({ error: "API Key diperlukan di dashboard" });
    }

    const endpointPath = req.url.replace('/api/magnific', '');
    const targetUrl = `https://api.magnific.com${endpointPath}`;

    try {
      const magnificResponse = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'x-magnific-api-key': userApiKey as string,
        },
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
      });

      const data = await magnificResponse.json().catch(() => null);
      
      if (!magnificResponse.ok) {
        return res.status(magnificResponse.status).json(data || { error: "Terjadi kesalahan pada Magnific API" });
      }

      return res.status(magnificResponse.status).json(data || {});
    } catch (error) {
      console.error("Proxy Error:", error);
      return res.status(500).json({ error: "Koneksi ke server Magnific gagal" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
