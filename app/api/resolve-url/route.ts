import { retry } from "@/utils/retry";

// 从文本中提取URL的函数
function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get("url");

    if (!url) {
      return new Response("URL参数不能为空", { status: 400 });
    }

    // 从文本中提取URL
    const extractedUrl = extractUrl(url);
    if (!extractedUrl) {
      return new Response("无法从文本中提取URL", { status: 400 });
    }
    url = extractedUrl;

    // 使用重试函数发起请求
    const response = await retry(
      async () => {
        const res = await fetch(url!, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        return res;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    );

    // 获取最终URL
    const finalUrl = response.url;

    return new Response(JSON.stringify({ url: finalUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("解析URL失败:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "解析URL失败",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
