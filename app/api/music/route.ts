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

    // 根据平台获取音乐信息
    switch (platform) {
      case MusicPlatform.NETEASE: {
        console.log("开始获取网易云音乐信息:", musicId);

        try {
          // 使用重试机制获取歌曲详情
          const songDetail = await retry(
            async () => {
              const response = await axios.get(
                `http://music.163.com/api/song/detail/?id=${musicId}&ids=[${musicId}]`,
                { headers: NETEASE_HEADERS }
              );
              if (!response.data?.songs?.[0]) {
                throw new Error("未找到歌曲信息");
              }
              return response.data;
            },
            {
              maxAttempts: 3,
              initialDelay: 1000,
              maxDelay: 5000,
            }
          );

          console.log("歌曲详情响应:", songDetail);
          const song = songDetail.songs[0];

          // 使用重试机制获取歌词
          const lyricsData = await retry(
            async () => {
              const response = await axios.get(
                `http://music.163.com/api/song/lyric?id=${musicId}&lv=1&kv=1&tv=-1`,
                { headers: NETEASE_HEADERS }
              );
              return response.data;
            },
            {
              maxAttempts: 3,
              initialDelay: 1000,
              maxDelay: 5000,
            }
          );

          console.log("歌词响应:", lyricsData);

          // 解析歌词
          const lyrics = lyricsData.lrc?.lyric || "";
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

          console.log("处理完成，返回结果:", result);
          return NextResponse.json(result);
        } catch (error) {
          console.error("网易云音乐API调用失败:", error);
          if (axios.isAxiosError(error)) {
            console.error("API错误详情:", {
              status: error.response?.status,
              data: error.response?.data,
              headers: error.response?.headers,
            });
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
