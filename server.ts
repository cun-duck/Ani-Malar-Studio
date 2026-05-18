import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors()); // Izinkan CORS agar request dari frontend lancar
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // BFF Proxy for Magnific AI
  app.all('/api/magnific/*', async (req, res) => {
    const userApiKey = req.headers['x-user-api-key'];

    if (!userApiKey) {
      return res.status(401).json({ error: "API Key diperlukan di dashboard" });
    }

    // Ambil path setelah /api/magnific
    const endpointPath = req.path.replace('/api/magnific', '');
    const queryParams = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `https://api.magnific.com${endpointPath}${queryParams}`;

    console.log(`Proxying request to: ${targetUrl}`);

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
        console.error("Magnific API Error:", data);
        return res.status(magnificResponse.status).json(data || { error: "Terjadi kesalahan pada Magnific API" });
      }

      return res.status(magnificResponse.status).json(data || {});
    } catch (error) {
      console.error("Proxy Network Error:", error);
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
