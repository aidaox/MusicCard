// app/api/proxy/image/route.ts
// 图片代理 API 路由,用于获取跨域图片

import { NextResponse } from "next/server";

// 处理 GET 请求
export async function GET(request: Request) {
  try {
    // 从 URL 参数中获取目标图片 URL
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 });
    }

    // 获取图片
    const response = await fetch(imageUrl, {
      // 添加超时设置，避免请求卡住
      signal: AbortSignal.timeout(5000),
      // 添加请求头，模拟浏览器行为，减少被拒绝的可能性
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "http://music.163.com",
      },
    });

    if (!response.ok) {
      console.error(
        `图片代理请求失败: ${imageUrl}, 状态码: ${response.status}`
      );
      return new NextResponse("Failed to fetch image", {
        status: response.status,
      });
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // 返回图片,设置正确的 content-type 和 CORS 头
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        // 增强缓存策略，设置更长的缓存时间和验证机制
        "Cache-Control":
          "public, max-age=31536000, stale-while-revalidate=86400",
        ETag: `"${Buffer.from(imageUrl).toString("base64").substring(0, 16)}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    // 如果是超时错误，返回特定的错误信息
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return new NextResponse("Image request timed out", { status: 504 });
    }
    return new NextResponse("Error proxying image", { status: 500 });
  }
}

// 处理预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
