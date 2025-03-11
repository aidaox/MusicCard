import { MusicInfo } from "@/types/music";
import { Theme } from "@/types/theme";
import { extractColors } from "./color";

interface ElementConfig {
  size: number;
  visible: boolean;
  x: number;
  y: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// 处理图片URL，添加代理
const getProxiedImageUrl = (url: string) => {
  // 如果是本地图片，直接返回
  if (url.startsWith("/")) {
    return url;
  }
  // 对于网易云音乐图片，使用特定参数优化加载
  if (url.includes("music.126.net")) {
    // 添加参数param=140y140表示使用更小的尺寸
    const optimizedUrl = url.includes("?")
      ? `${url}&param=140y140`
      : `${url}?param=140y140`;
    return `/api/proxy/image?url=${encodeURIComponent(optimizedUrl)}`;
  }
  // 否则通过代理加载
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
};

// 加载图片的辅助函数
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error(`图片加载失败: ${url}`, e);
      reject(new Error(`Failed to load image: ${url}`));
    };

    // 设置超时，避免长时间等待
    const timeout = setTimeout(() => {
      reject(new Error(`Image loading timeout: ${url}`));
    }, 10000);

    img.src = getProxiedImageUrl(url);

    // 清除超时
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
  });
};

// 预加载图片缓存
const imageCache = new Map<string, HTMLImageElement>();

// 预加载图片
const preloadImage = async (url: string): Promise<HTMLImageElement> => {
  if (!url) return Promise.reject(new Error("No URL provided"));

  // 检查缓存
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  try {
    const img = await loadImage(url);
    imageCache.set(url, img);
    return img;
  } catch (error) {
    console.error("图片加载失败:", error);
    // 如果是第一次失败，重试一次
    if (!url.includes("_retry")) {
      console.log("重试加载图片:", url);
      try {
        const retryUrl = url + "_retry";
        const img = await loadImage(url);
        imageCache.set(url, img); // 使用原始URL缓存
        return img;
      } catch (retryError) {
        console.error("图片重试加载失败:", retryError);
        throw retryError;
      }
    }
    throw error;
  }
};

// 创建圆角矩形路径的辅助函数
const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
  ctx.lineTo(x + radius, y + height);
  ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + radius);
  ctx.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);
  ctx.closePath();
};

// 辅助函数：截断文本，不添加省略号
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}

// 辅助函数：根据最大宽度截断文本，不添加省略号
function truncateTextByWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;

  let left = 0;
  let right = text.length;
  let result = text;

  // 二分查找合适的长度
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const truncated = text.slice(0, mid);
    const width = ctx.measureText(truncated).width;

    if (width <= maxWidth) {
      result = truncated;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

export const generateSpotifyPoster = async (
  canvas: HTMLCanvasElement,
  musicInfo: MusicInfo,
  theme: Theme,
  config: {
    cover: ElementConfig;
    title: ElementConfig;
    artist: ElementConfig;
    lyrics: ElementConfig;
    duration: ElementConfig;
  }
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  try {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 预加载所有需要的图片
    const imagePromises: Promise<HTMLImageElement>[] = [];

    if (theme.backgroundType === "image") {
      imagePromises.push(preloadImage(theme.background));
    }

    if (config.cover.visible && musicInfo.coverUrl) {
      imagePromises.push(preloadImage(musicInfo.coverUrl));
    }

    // 等待所有图片加载完成
    const loadedImages = await Promise.all(imagePromises);
    let imageIndex = 0;

    // 绘制背景
    if (theme.backgroundType === "color") {
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const bgImage = loadedImages[imageIndex++];
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    // 绘制封面图片
    if (config.cover.visible && musicInfo.coverUrl) {
      const coverImage = loadedImages[imageIndex++];
      const x = config.cover.x * canvas.width;
      const y = config.cover.y * canvas.height;
      const size = config.cover.size;
      const radius = Math.min(size * 0.1, 60); // 圆角半径为图片尺寸的 10%，最大 60px

      // 保存当前状态
      ctx.save();

      // 创建圆角路径
      roundedRect(ctx, x, y, size, size, radius);

      // 裁剪
      ctx.clip();

      // 绘制图片
      ctx.drawImage(coverImage, x, y, size, size);

      // 恢复状态
      ctx.restore();

      // 绘制边框
      roundedRect(ctx, x, y, size, size, radius);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 提取颜色
      try {
        const colors = await extractColors(
          getProxiedImageUrl(musicInfo.coverUrl)
        );

        // 绘制颜色块
        const paletteStartX = 60;
        const paletteY = 1120;
        const boxWidth = (canvas.width - 120) / 6;
        const boxHeight = 44;

        colors.forEach((color, index) => {
          const x = paletteStartX + boxWidth * index;
          ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          ctx.fillRect(x, paletteY, boxWidth, boxHeight);
        });
      } catch (error) {
        console.error("提取颜色失败:", error);
      }
    }

    // 设置文本样式
    ctx.fillStyle = theme.text;

    // 绘制标题
    if (config.title.visible && musicInfo.title) {
      ctx.textBaseline = "bottom";
      ctx.font = `bold ${config.title.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const x = config.title.x * canvas.width;
      const y = config.title.y * canvas.height;
      const maxWidth = canvas.width - x - 60;
      const text = truncateTextByWidth(ctx, musicInfo.title, maxWidth);
      ctx.fillText(text, x, y);
    }

    // 绘制艺术家
    if (config.artist.visible && musicInfo.artist) {
      ctx.textBaseline = "top";
      ctx.font = `${config.artist.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const x = config.artist.x * canvas.width;
      const y = config.artist.y * canvas.height;
      const maxWidth = canvas.width - x - 60;
      const text = truncateTextByWidth(ctx, musicInfo.artist, maxWidth);
      ctx.fillText(text, x, y);
    }

    // 绘制歌词
    if (config.lyrics.visible && musicInfo.lyrics) {
      ctx.textBaseline = "top";
      ctx.font = `${config.lyrics.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const x = config.lyrics.x * canvas.width;
      const y = config.lyrics.y * canvas.height;
      const maxWidth = canvas.width - x - 60;

      // 按原有段落分割歌词
      const paragraphs = musicInfo.lyrics.split("\n");

      // 设置行高为字体大小的1.5倍
      const lineHeight = config.lyrics.size * 1.5;

      // 逐行绘制歌词文本
      paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim()) {
          // 只处理非空行
          const truncatedLine = truncateTextByWidth(ctx, paragraph, maxWidth);
          ctx.fillText(truncatedLine, x, y + index * lineHeight);
        }
      });
    }

    // 绘制时长
    if (config.duration.visible && musicInfo.duration) {
      ctx.textBaseline = "bottom";
      ctx.font = `${config.duration.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const x = config.duration.x * canvas.width;
      const y = config.duration.y * canvas.height;
      const minutes = Math.floor(musicInfo.duration / 60);
      const seconds = musicInfo.duration % 60;
      const text = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      const metrics = ctx.measureText(text);
      ctx.fillText(text, x - metrics.width, y);
    }
  } catch (error) {
    console.error("生成海报失败:", error);
    throw error;
  }
};
