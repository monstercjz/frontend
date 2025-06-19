// middleware.ts (推荐使用 TypeScript 以获得更好的类型提示，如果用 JS 就去掉类型)
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req) {
  const { pathname, search, origin } = req.nextUrl;

  // 1. 检查请求路径是否以 /api/ 开头
  if (pathname.startsWith('/api/')) {
    // 2. 从环境变量中获取真实的后端 API 基础 URL
    // 这个环境变量需要在 Vercel 项目设置中配置，例如 PRIVATE_BACKEND_API_URL
    // 它的值应该是类似 https://dywsuaqtibhj.ap-southeast-1.clawcloudrun.com (不带 /api 后缀，也不带端口)
    const backendApiBaseUrl = process.env.PRIVATE_BACKEND_API_URL;

    if (!backendApiBaseUrl) {
      console.error('Error: PRIVATE_BACKEND_API_URL environment variable is not set.');
      // 返回一个错误响应给客户端
      return new Response('Backend API endpoint is not configured.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // 3. 构建目标 URL
    //    原始请求路径是 /api/some/path
    //    我们需要将请求转发到 backendApiBaseUrl + /api/some/path
    //    因为你的后端 Express 应用的路由本身就是以 /api/ 开头的
    const destinationUrl = `${backendApiBaseUrl}${pathname}${search}`;

    // 4. 使用 NextResponse.rewrite 将请求透明地重写到目标 URL
    //    用户的浏览器地址栏不会改变，仍然显示前端的 /api/... 路径
    try {
      console.log(`Rewriting ${pathname} to ${destinationUrl}`); // 添加日志以便调试
      const rewrittenUrl = new URL(destinationUrl); // 确保 URL 格式正确

      // 创建一个新的请求对象，只复制必要的头部，避免潜在问题
      // 并确保 Host 头部被设置为目标后端服务的 Host (或者让 Vercel/Next.js 自动处理)
      // 通常 NextResponse.rewrite 会处理好 Host 头的转发
      const requestHeaders = new Headers(req.headers);
      // 如果需要显式设置 Host 头为后端服务域名 (通常 Rewrite 会自动处理好)
      // requestHeaders.set('Host', new URL(backendApiBaseUrl).host);

      // 可以选择性地转发或添加自定义头部
      // requestHeaders.set('X-Forwarded-Host', req.headers.get('host'));
      // requestHeaders.set('X-Vercel-Forwarded-For', req.ip || '');


      return NextResponse.rewrite(rewrittenUrl, {
        // headers: requestHeaders, // 可以选择传递修改后的头部
        // request: req // 如果需要传递原始请求对象（通常不需要这么复杂）
      });

    } catch (error) {
      console.error(`Error rewriting URL: ${error.message}`);
      return new Response('Error processing API request.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  // 5. 对于非 /api/ 的请求，继续正常处理 (例如，由静态文件或 SPA 路由处理)
  return NextResponse.next();
}

// 6. 配置 middleware 匹配所有以 /api/ 开头的路径
export const config = {
  matcher: '/api/:path*',
};