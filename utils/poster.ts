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
  // 如果是本地图片或data URL，直接返回
  if (url.startsWith("/") || url.startsWith("data:")) {
    return url;
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
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = getProxiedImageUrl(url);
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

// 优化的颜色提取函数
const optimizedExtractColors = async (url: string): Promise<RGB[]> => {
  const cacheKey = `colors_${url}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const colors = await extractColors(url);
  sessionStorage.setItem(cacheKey, JSON.stringify(colors));
  return colors;
};

// 优化的Canvas绘制函数
export const generatePosterImage = async (
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
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  try {
    // 使用普通Canvas作为缓冲区
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;
    const bufferCtx = bufferCanvas.getContext("2d", { alpha: false });
    if (!bufferCtx) return;

    // 清空画布
    bufferCtx.clearRect(0, 0, canvas.width, canvas.height);

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
      bufferCtx.fillStyle = theme.background;
      bufferCtx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const bgImage = loadedImages[imageIndex++];
      bufferCtx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    // 绘制封面图片
    if (config.cover.visible && musicInfo.coverUrl) {
      const coverImage = loadedImages[imageIndex++];
      const x = config.cover.x * canvas.width;
      const y = config.cover.y * canvas.height;
      const size = config.cover.size;
      const radius = Math.min(size * 0.1, 60);

      // 使用路径裁剪来优化圆角绘制
      bufferCtx.save();
      roundedRect(bufferCtx, x, y, size, size, radius);
      bufferCtx.clip();
      bufferCtx.drawImage(coverImage, x, y, size, size);
      bufferCtx.restore();

      // 提取颜色（使用缓存版本）
      try {
        const colors = await optimizedExtractColors(
          getProxiedImageUrl(musicInfo.coverUrl)
        );

        // 绘制颜色块
        const paletteStartX = 60;
        const paletteY = 1120;
        const boxWidth = (canvas.width - 120) / 6;
        const boxHeight = 44;

        colors.forEach((color, index) => {
          const x = paletteStartX + boxWidth * index;
          bufferCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          bufferCtx.fillRect(x, paletteY, boxWidth, boxHeight);
        });
      } catch (error) {
        console.error("提取颜色失败:", error);
      }
    }

    // 设置文本渲染优化
    bufferCtx.imageSmoothingEnabled = true;
    bufferCtx.imageSmoothingQuality = "high";

    // 设置文本样式
    bufferCtx.fillStyle = theme.text;
    bufferCtx.textBaseline = "top";

    // 绘制标题（限制15个汉字）
    if (config.title.visible && musicInfo.title) {
      bufferCtx.textBaseline = "bottom";
      bufferCtx.font = `bold ${config.title.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const truncatedTitle = truncateText(musicInfo.title, 15);
      bufferCtx.fillText(
        truncatedTitle,
        config.title.x * canvas.width,
        config.title.y * canvas.height
      );
    }

    // 绘制艺术家（限制15个汉字）
    if (config.artist.visible && musicInfo.artist) {
      bufferCtx.textBaseline = "top";
      bufferCtx.font = `${config.artist.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const truncatedArtist = truncateText(musicInfo.artist, 20);
      bufferCtx.fillText(
        truncatedArtist,
        config.artist.x * canvas.width,
        config.artist.y * canvas.height
      );
    }

    // 绘制歌词（限制宽度，距离右边缘60px）
    if (config.lyrics.visible && musicInfo.lyrics) {
      console.log("绘制歌词时的原始数据:", musicInfo.lyrics);
      bufferCtx.textBaseline = "top";
      bufferCtx.font = `${config.lyrics.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const maxWidth = canvas.width - config.lyrics.x * canvas.width - 60;

      // 按原有段落分割歌词
      const paragraphs = musicInfo.lyrics.split("\n");
      console.log("分割后的歌词段落:", paragraphs);

      // 对每个段落进行宽度限制处理
      const lines: string[] = [];
      paragraphs.forEach((paragraph) => {
        const truncatedLine = truncateTextByWidth(
          bufferCtx,
          paragraph,
          maxWidth
        );
        lines.push(truncatedLine);
      });
      console.log("处理后的歌词行:", lines);

      // 设置行高为字体大小的1.2倍
      const lineHeight = config.lyrics.size * 1.2;

      // 逐行绘制歌词文本
      lines.forEach((line, index) => {
        bufferCtx.fillText(
          line,
          config.lyrics.x * canvas.width,
          config.lyrics.y * canvas.height + index * lineHeight
        );
      });
    }

    // 绘制时长
    if (config.duration.visible && musicInfo.duration) {
      bufferCtx.textBaseline = "bottom";
      bufferCtx.font = `${config.duration.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const minutes = Math.floor(musicInfo.duration / 60);
      const seconds = musicInfo.duration % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      const x = config.duration.x * canvas.width;
      const y = config.duration.y * canvas.height;

      // 计算文本宽度以实现右对齐
      const textWidth = bufferCtx.measureText(timeStr).width;
      bufferCtx.fillText(timeStr, x - textWidth, y);
    }

    // 将缓冲区Canvas内容复制到主Canvas
    ctx.drawImage(bufferCanvas, 0, 0);
  } catch (error) {
    console.error("生成海报失败:", error);
    throw error;
  }
};
