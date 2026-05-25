export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return res.status(500).json({ error: 'SUPABASE_URL not configured' });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api\/supabase/, '');
  const targetUrl = `${supabaseUrl}${path}${url.search}`;

  const headers = { ...req.headers };
  delete headers.host;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.status(response.status);
    if (contentType) {
      res.setHeader('content-type', contentType);
    }
    res.send(data);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
}
