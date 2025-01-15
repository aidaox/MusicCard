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
    const response = await fetch(imageUrl);

    if (!response.ok) {
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
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
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
