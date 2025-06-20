// api/proxy.js

// 注意：Vercel 的 Node.js 运行时默认支持 ES Modules (import/export)
// 对于较新的 Node.js 版本，fetch 是内置的。如果遇到 fetch is not defined,
// 你可能需要确保你的 Vercel 项目设置 Node.js 版本较高 (如 18.x 或更高)，
// 或者你可以安装 node-fetch: npm install node-fetch 并使用 import fetch from 'node-fetch';

export default async function handler(req, res) {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendApiBaseUrl) {
    console.error('BACKEND_API_BASE_URL environment variable is not set.');
    return res.status(500).json({ error: 'Internal server error: API configuration missing.' });
  }

  // 1. 获取原始请求的路径 (在 /api/proxy 之后的部分)
  // req.url 对于 /api/proxy/some/endpoint?query=true 会是 /api/proxy/some/endpoint?query=true
  // 我们需要移除函数路径本身。Vercel 会将函数文件名 (不含扩展名) 作为路径的一部分。
  // 所以，如果文件是 api/proxy.js，那么请求路径是 /api/proxy/...
  const originalPathAndQuery = req.url.replace(/^\/api\/proxy/, '');


  // 2. 构建目标后端的完整 URL
  // 假设你的真实后端 API 路径结构也是 /api/...
  // 例如，如果前端请求 /api/proxy/users, 且后端期望 /api/users
  // 那么 targetUrl 应该是 backendApiBaseUrl + /api + originalPathAndQuery
  // 如果后端期望的是 backendApiBaseUrl + originalPathAndQuery (即 /users), 则不需要加 /api
  // 根据你之前的信息，你的后端 URL 是 https://dywsuaqtibhj.ap-southeast-1.clawcloudrun.com/api
  // 而你的 BACKEND_API_BASE_URL 存储的是 https://dywsuaqtibhj.ap-southeast-1.clawcloudrun.com
  // 所以我们需要拼接上 /api
  const targetUrl = `${backendApiBaseUrl}/api${originalPathAndQuery}`;

  console.log(`Proxying request from ${req.url} to ${targetUrl}`);

  try {
    // 3. 准备转发请求的选项
    const options = {
      method: req.method,
      headers: {
        // 复制大部分原始请求头
        ...req.headers,
        // 覆盖或删除 host 头，让 fetch 根据 targetUrl 自动设置
        host: new URL(targetUrl).host,
        // 你可能需要删除一些 Vercel 特有的入站请求头，如果它们干扰后端
        'x-vercel-deployment-url': undefined,
        'x-vercel-id': undefined,
        'x-forwarded-host': undefined,
        // ... 其他可能需要清理的头
      },
    };

    // 如果是 POST, PUT, PATCH 等有请求体的方法，复制请求体
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      // req.body 在 Vercel 函数中默认可能是 stream 或者 buffer
      // 如果你的前端发送的是 JSON，Vercel 通常会帮你解析。
      // 如果是其他类型，你可能需要更复杂的处理。
      // 假设前端发送 JSON，且 Vercel 已经处理了 body parsing
      if (typeof req.body === 'object' && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        options.body = JSON.stringify(req.body);
      } else {
        options.body = req.body; // 直接传递 Buffer 或 Stream
      }
    }


    // 4. 向真实后端发起请求
    const backendResponse = await fetch(targetUrl, options);

    // 5. 将后端响应头复制回给前端
    // (除了 Vercel 不允许或会自动处理的头，如 'transfer-encoding', 'connection')
    res.statusCode = backendResponse.status; // 设置状态码
    backendResponse.headers.forEach((value, name) => {
      // 避免设置与内容编码冲突的头，fetch 会处理解压
      if (name.toLowerCase() !== 'content-encoding' && name.toLowerCase() !== 'transfer-encoding' && name.toLowerCase() !== 'connection') {
        try {
          res.setHeader(name, value);
        } catch (e) {
          console.warn(`Could not set header ${name}: ${value}`, e.message);
        }
      }
    });

    // 6. 将后端响应体流式传输回给前端
    // 这对于大文件或长时间运行的响应更高效
    const responseBody = backendResponse.body; // ReadableStream
    if (responseBody) {
      // Pipe the stream from the backend response to the Vercel function's response
      // For Node.js versions supporting pipeline from 'stream/promises'
      const { pipeline } = await import('stream/promises');
      await pipeline(responseBody, res);
    } else {
      res.end();
    }

  } catch (error) {
    console.error(`Error proxying to ${targetUrl}:`, error);
    res.status(502).json({ error: 'Bad Gateway', details: error.message });
  }
}