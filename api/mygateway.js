// api/mygateway.js
export default function handler(req, res) {
  console.log('--- MYGATEWAY INVOCATION ---');
  console.log('Full Request URL from Vercel:', req.url);
  res.status(200).json({
    message: 'MyGateway function received request.',
    requestUrl: req.url
  });
}