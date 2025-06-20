// api/hello.js
export default function handler(req, res) {
  console.log('[HELLO LOG] Hello function invoked! Request URL:', req.url);
  res.status(200).send('Hello from Vercel Serverless Function!');
}