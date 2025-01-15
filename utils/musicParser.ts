import { MusicInfo, MusicPlatform } from "@/types/music";

// 音乐相关的优美句子（当没有歌词时使用）
const MUSIC_QUOTES = [
  "音乐是流动的建筑，是时光的低语",
  "旋律是心灵的共鸣，节奏是生命的脉动",
  "在音符的海洋里，找寻内心的平静",
  "让音乐带我们去往心灵的远方",
];

// 从文本中提取URL的函数
function extractUrl(text: string): string | null {
  // 匹配http或https开头的URL
  const urlMatch = text.match(/https?:\/\/[^\s)]+/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * 解析音乐链接
 * @param url 音乐链接
 * @returns 音乐ID
 */
export async function parseMusicUrl(url: string): Promise<{
  platform: MusicPlatform;
  id: string;
}> {
  // 从文本中提取URL
  const extractedUrl = extractUrl(url);
  if (!extractedUrl) {
    throw new Error("未找到有效的音乐链接");
  }
  url = extractedUrl;

  // 处理网易云音乐短链接
  if (url.includes("163cn.tv")) {
    try {
      // 使用我们的API来解析短链接
      const response = await fetch(
        `/api/resolve-url?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) {
        throw new Error("解析短链接失败");
      }
      const data = await response.json();
      url = data.url;
    } catch (error) {
      console.error("解析短链接失败:", error);
      throw new Error("无法解析分享链接，请使用完整链接");
    }
  }

  // 网易云音乐 - 完整链接
  const neteaseMusicMatch = url.match(/music\.163\.com.*[?&]id=(\d+)/);
  if (neteaseMusicMatch) {
    return {
      platform: MusicPlatform.NETEASE,
      id: neteaseMusicMatch[1],
    };
  }

  // 网易云音乐 - 移动端分享
  const neteaseMobileMatch = url.match(
    /^https?:\/\/y\.music\.163\.com\/m\/song\?id=(\d+)/
  );
  if (neteaseMobileMatch) {
    return {
      platform: MusicPlatform.NETEASE,
      id: neteaseMobileMatch[1],
    };
  }

  // 网易云音乐 - 移动端短链接重定向后的格式
  const neteaseMobileRedirectMatch = url.match(
    /^https?:\/\/music\.163\.com\/song\/mobile\/\?id=(\d+)/
  );
  if (neteaseMobileRedirectMatch) {
    return {
      platform: MusicPlatform.NETEASE,
      id: neteaseMobileRedirectMatch[1],
    };
  }

  throw new Error("不支持的音乐平台或链接格式不正确");
}

/**
 * 从API获取音乐信息
 * @param platform 音乐平台
 * @param id 音乐ID
 */
export const fetchMusicInfo = async (
  platform: MusicPlatform,
  id: string
): Promise<MusicInfo> => {
  switch (platform) {
    case MusicPlatform.NETEASE: {
      // 调用网易云音乐API
      const params = new URLSearchParams({
        platform: MusicPlatform.NETEASE,
        id: id,
      });
      const response = await fetch(`/api/music?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "获取音乐信息失败");
      }
      return response.json();
    }

    // 其他平台暂时返回测试数据
    default:
      return {
        title: "歌名",
        artist: "歌手",
        coverUrl: "/templates/demo-cover.jpg",
        lyrics: MUSIC_QUOTES.join("\n"),
        duration: 180,
      };
  }
};

/**
 * 处理歌词
 * @param lyrics 完整歌词
 * @param lineCount 需要返回的歌词行数，默认为5
 * @returns 处理后的歌词
 */
export const processLyrics = (
  lyrics: string | null,
  lineCount: number = 5
): string => {
  if (!lyrics) {
    // 如果没有歌词，返回音乐相关的优美句子
    return MUSIC_QUOTES.slice(0, lineCount).join("\n");
  }

  // 移除时间标记并过滤空行
  const lines = lyrics
    .split("\n")
    .map((line) => line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim())
    .filter((line) => line && !line.includes("作词") && !line.includes("作曲"));

  if (lines.length <= lineCount) {
    return lines.join("\n");
  }

  // 从歌词的1/3处开始选择指定行数，这通常是副歌部分
  const startIndex = Math.floor(lines.length / 3);
  return lines.slice(startIndex, startIndex + lineCount).join("\n");
};

/**
 * 获取音乐信息
 * @param url 音乐链接
 * @returns 音乐信息
 */
export const getMusicInfo = async (url: string): Promise<MusicInfo> => {
  try {
    // 解析链接
    const { platform, id } = await parseMusicUrl(url);

    // 获取音乐信息
    const musicInfo = await fetchMusicInfo(platform, id);

    // 处理歌词
    musicInfo.lyrics = processLyrics(musicInfo.lyrics);
    return musicInfo;
  } catch (error) {
    console.error("获取音乐信息失败:", error);
    throw error;
  }
};
