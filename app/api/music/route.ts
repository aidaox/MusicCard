import { retry } from "@/utils/retry";
import { NextResponse } from "next/server";
import { MusicPlatform } from "@/types/music";
import axios from "axios";

// 定义歌手类型
interface Artist {
  name: string;
}

// 网易云音乐API请求头
const NETEASE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "http://music.163.com",
  Host: "music.163.com",
};

// 缓存音乐信息，减少重复请求
const MUSIC_CACHE = new Map();
// 缓存过期时间（24小时）
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    // 从URL中获取参数
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const musicId = searchParams.get("id");

    console.log("收到请求:", { platform, musicId });

    if (!platform || !musicId) {
      console.error("缺少必要参数:", { platform, musicId });
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 生成缓存key
    const cacheKey = `${platform}:${musicId}`;

    // 检查缓存
    if (MUSIC_CACHE.has(cacheKey)) {
      const { data, timestamp } = MUSIC_CACHE.get(cacheKey);
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log("从缓存返回结果:", cacheKey);
        return NextResponse.json(data, {
          headers: {
            "Cache-Control": "public, max-age=3600",
          },
        });
      } else {
        // 删除过期缓存
        MUSIC_CACHE.delete(cacheKey);
      }
    }

    // 根据平台获取音乐信息
    switch (platform) {
      case MusicPlatform.NETEASE: {
        console.log("开始获取网易云音乐信息:", musicId);

        try {
          // 创建取消标记，设置超时
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          // 并行请求歌曲详情和歌词，优化加载速度
          const [songDetailResponse, lyricsResponse] = await Promise.all([
            // 获取歌曲详情
            retry(
              async () => {
                const response = await axios.get(
                  `http://music.163.com/api/song/detail/?id=${musicId}&ids=[${musicId}]`,
                  {
                    headers: NETEASE_HEADERS,
                    timeout: 5000,
                    signal: controller.signal,
                  }
                );
                if (!response.data?.songs?.[0]) {
                  throw new Error("未找到歌曲信息");
                }
                return response.data;
              },
              {
                maxAttempts: 2,
                initialDelay: 500,
                maxDelay: 2000,
              }
            ),
            // 获取歌词
            retry(
              async () => {
                const response = await axios.get(
                  `http://music.163.com/api/song/lyric?id=${musicId}&lv=1&kv=1&tv=-1`,
                  {
                    headers: NETEASE_HEADERS,
                    timeout: 5000,
                    signal: controller.signal,
                  }
                );
                return response.data;
              },
              {
                maxAttempts: 2,
                initialDelay: 500,
                maxDelay: 2000,
              }
            ),
          ]);

          // 清除超时
          clearTimeout(timeoutId);

          console.log("歌曲详情和歌词获取完成");
          const song = songDetailResponse.songs[0];

          // 解析歌词
          const lyrics = lyricsResponse.lrc?.lyric || "";
          const lyricsArray = lyrics
            .split("\n")
            .map((line: string) =>
              line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim()
            )
            .filter((line: string) => line);

          const result = {
            title: song.name,
            artist: song.artists.map((a: Artist) => a.name).join(", "),
            coverUrl: song.album.picUrl,
            lyrics: lyricsArray.join("\n"),
            duration: Math.floor(song.duration / 1000),
          };

          // 缓存结果
          MUSIC_CACHE.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });

          console.log("处理完成，返回结果:", result);
          return NextResponse.json(result, {
            headers: {
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (error) {
          console.error("网易云音乐API调用失败:", error);
          if (axios.isAxiosError(error)) {
            console.error("API错误详情:", {
              status: error.response?.status,
              data: error.response?.data,
              headers: error.response?.headers,
            });

            // 处理特定错误
            if (error.code === "ECONNABORTED") {
              return NextResponse.json(
                { error: "网易云音乐API请求超时，请稍后重试" },
                { status: 504 }
              );
            }
          }
          throw error;
        }
      }

      default:
        console.error("不支持的音乐平台:", platform);
        return NextResponse.json(
          { error: "不支持的音乐平台" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("获取音乐信息失败:", error);
    if (axios.isAxiosError(error)) {
      console.error("错误详情:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    return NextResponse.json(
      {
        error: "获取音乐信息失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
