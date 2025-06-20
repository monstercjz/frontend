## 适配vercel
### 直接硬编码后端地址
1. 引入vercel.json文件
```json
{
  "rewrites": [
    
    {
      "source": "/api/:match*",
      "destination": "http://xxxxxxxx/api/:match*"
    }
    
  ],
  "cleanUrls": true,    
  "trailingSlash": false 
}
```
1. config.js中的地址维持不变
```javascript
export const backendUrl = '/api';
```
### 不暴露后端地址，将地址设置为vercel环境变量,采用 Serverless Function 代理方案
1. 引入vercel.json文件
```json
{
  "rewrites": [
    {
      "source": "/api/mygateway/:path*",
      "destination": "/api/mygateway"
    }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```
2. 引入路由处理mygateway.js文件
```javascript
// api/mygateway.js
export default async function handler(req, res) {
  // console.log('[MYGATEWAY PROXY] Function invoked. Request URL:', req.url);

  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL; // 现在需要这个了

  if (!backendApiBaseUrl) {
    console.error('[MYGATEWAY PROXY ERROR] BACKEND_API_BASE_URL environment variable is not set.');
    return res.status(500).json({ error: 'Internal server error: API configuration missing.' });
  }

  // 从 req.url 中提取原始路径，需要移除 /api/mygateway 前缀
  // 并且忽略 Vercel 可能附加的 ?match=... 查询参数 (如果它干扰路径解析)
  // 或者，更好的做法是解析出真正的 pathname
  const urlObject = new URL(req.url, `http://${req.headers.host}`); // 需要一个基础URL来正确解析
  const originalPathname = urlObject.pathname.replace(/^\/api\/mygateway/, '');
  const originalQuery = urlObject.search; // 获取原始查询字符串，如 ?param1=value1

  // 构建目标URL时只使用原始的 pathname 和 query，忽略 Vercel 的 'match'
  // 我们的后端期望的路径是 /api + originalPathname
  const targetPathAndQuery = `/api${originalPathname}${originalQuery}`;
  const targetUrl = `${backendApiBaseUrl}${targetPathAndQuery}`;

  console.log(`[MYGATEWAY PROXY] Proxying from ${req.url} to target: ${targetUrl}`);

  try {
    const options = {
      method: req.method,
      headers: {
        // 复制大部分原始请求头
        ...req.headers,
        // 覆盖或删除 host 头，让 fetch 根据 targetUrl 自动设置
        host: new URL(targetUrl).host,
        'x-vercel-deployment-url': undefined,
        'x-vercel-id': undefined,
        'x-forwarded-host': undefined,
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      // 假设Vercel已经处理了JSON body的解析
      if (typeof req.body === 'object' && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        options.body = JSON.stringify(req.body);
      } else {
        options.body = req.body; // Buffer or Stream
      }
    }

    const backendResponse = await fetch(targetUrl, options);
    const responseData = await backendResponse.text(); // 先用 .text() 确保能拿到任何类型的响应体

    // console.log(`[MYGATEWAY PROXY] Backend status: ${backendResponse.status}`);

    // 复制后端响应头
    res.statusCode = backendResponse.status;
    backendResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'content-encoding' && name.toLowerCase() !== 'transfer-encoding' && name.toLowerCase() !== 'connection') {
         try { res.setHeader(name, value); } catch(e) { console.warn(`Could not set header ${name}: ${value}`); }
      }
    });

    res.send(responseData);

  } catch (error) {
    console.error(`[MYGATEWAY PROXY ERROR] Error proxying to ${targetUrl}:`, error.message, error.stack);
    res.status(502).json({ error: 'Bad Gateway', details: error.message });
  }
}
```
3. 修改config.js文件
```javascript
// export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
export const backendUrl = '/api/mygateway';

```
