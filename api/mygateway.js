// 项目根目录下的 api/mygateway.js

export default function handler(req, res) {
  // 移除所有其他 console.log，只保留这个，或者完全不加日志，专注于响应
  // console.log('MyGateway function invoked. Request URL:', req.url);

  res.status(200).json({
    message: 'MyGateway function received request successfully!',
    requestedUrl: req.url, // 将收到的 URL 返回给客户端，方便调试
    timestamp: new Date().toISOString()
  });
}