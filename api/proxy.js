// api/proxy.js
export default function handler(req, res) {
  console.log('--- NEW PROXY INVOCATION ---');
  console.log('Full Request URL from Vercel:', req.url); // 这个非常关键
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  res.status(200).json({
    message: 'Proxy function received request.',
    requestUrl: req.url,
    method: req.method,
    headers: req.headers
  });
}