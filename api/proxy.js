// api/proxy.js (Simplified for testing)
export default async function handler(req, res) {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL;
  console.log('[PROXY LOG] Function invoked. Request URL:', req.url); // 新增日志

  if (!backendApiBaseUrl) {
    console.error('[PROXY ERROR] BACKEND_API_BASE_URL environment variable is not set.');
    return res.status(500).json({ error: 'Internal server error: API configuration missing.' });
  }

  const originalPathAndQuery = req.url.replace(/^\/api\/proxy/, '');
  const targetUrl = `${backendApiBaseUrl}/api${originalPathAndQuery}`;
  console.log(`[PROXY LOG] Proxying request from ${req.url} to ${targetUrl}`);

  try {
    const options = {
      method: req.method,
      headers: { ...req.headers, host: new URL(targetUrl).host },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      if (typeof req.body === 'object' && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        options.body = JSON.stringify(req.body);
      } else {
        options.body = req.body;
      }
    }

    const backendResponse = await fetch(targetUrl, options);
    const responseData = await backendResponse.text(); // 或者 .json() 如果确定是 JSON

    console.log(`[PROXY LOG] Backend status: ${backendResponse.status}`);

    // Copy headers from backendResponse to res
    res.statusCode = backendResponse.status;
    backendResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'content-encoding' && name.toLowerCase() !== 'transfer-encoding' && name.toLowerCase() !== 'connection') {
         try { res.setHeader(name, value); } catch(e) { console.warn(`Could not set header ${name}`); }
      }
    });

    res.send(responseData);

  } catch (error) {
    console.error(`[PROXY ERROR] Error proxying to ${targetUrl}:`, error);
    res.status(502).json({ error: 'Bad Gateway', details: error.message });
  }
}