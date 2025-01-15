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

// 背景设置接口
interface BackgroundConfig {
  imageUrl?: string; // 自定义背景图片URL
  blur?: number; // 模糊程度 (0-20)
  opacity?: number; // 不透明度 (0-1)
  gradient?: {
    angle: number; // 渐变角度 (0-360)
    colors: string[]; // 渐变颜色数组
    stops: number[]; // 渐变位置数组 (0-1)
  };
}

// 处理图片URL，添加代理
const getProxiedImageUrl = (url: string) => {
  // 如果是本地图片或data:URL，直接返回
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

// 创建渐变色
const createGradient = (
  ctx: CanvasRenderingContext2D,
  colors: RGB[],
  width: number,
  height: number
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  colors.forEach((color, index) => {
    gradient.addColorStop(
      index / (colors.length - 1),
      `rgb(${color.r}, ${color.g}, ${color.b})`
    );
  });
  return gradient;
};

// 调整颜色亮度
const adjustBrightness = (color: RGB, factor: number): RGB => {
  return {
    r: Math.min(255, Math.max(0, Math.round(color.r * factor))),
    g: Math.min(255, Math.max(0, Math.round(color.g * factor))),
    b: Math.min(255, Math.max(0, Math.round(color.b * factor))),
  };
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

// 确保颜色足够暗
const ensureDarkColor = (color: RGB): RGB => {
  // 计算颜色的亮度 (0-255)
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;

  // 如果亮度超过阈值（128），将颜色调暗
  if (brightness > 128) {
    const darkFactor = 128 / brightness; // 使亮度降至128
    return {
      r: Math.round(color.r * darkFactor),
      g: Math.round(color.g * darkFactor),
      b: Math.round(color.b * darkFactor),
    };
  }
  return color;
};

// 创建更暗的渐变色
const createDarkGradient = (color: RGB): RGB => {
  // 将颜色调整到更暗的版本（原始亮度的10%）
  return {
    r: Math.round(color.r * 0.1),
    g: Math.round(color.g * 0.1),
    b: Math.round(color.b * 0.1),
  };
};

// 应用背景模糊效果
const applyBackgroundBlur = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  blur: number
) => {
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(ctx.canvas, x, y, width, height);
  ctx.filter = "none";
};

// 创建背景渐变
const createBackgroundGradient = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angle: number,
  colors: string[],
  stops: number[]
) => {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  const gradient = ctx.createLinearGradient(
    width / 2 - x * width,
    height / 2 - y * height,
    width / 2 + x * width,
    height / 2 + y * height
  );

  colors.forEach((color, index) => {
    gradient.addColorStop(stops[index], color);
  });

  return gradient;
};

export const generatePhonePoster = async (
  canvas: HTMLCanvasElement,
  musicInfo: MusicInfo,
  theme: Theme,
  config: {
    cover: ElementConfig;
    title: ElementConfig;
    artist: ElementConfig;
    lyrics: ElementConfig;
    duration: ElementConfig;
  },
  useGradient: boolean = false,
  backgroundConfig?: BackgroundConfig
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  try {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 预加载所有需要的图片
    const imagePromises: Promise<HTMLImageElement>[] = [];
    const images: { [key: string]: HTMLImageElement } = {};

    // 加载透明背景图
    imagePromises.push(
      loadImage("/templates/phone.png").then((img) => {
        images.template = img;
        return img;
      })
    );

    // 加载封面图片
    if (config.cover.visible && musicInfo.coverUrl) {
      imagePromises.push(
        loadImage(musicInfo.coverUrl).then((img) => {
          images.cover = img;
          return img;
        })
      );
    }

    // 加载自定义背景图片
    if (backgroundConfig?.imageUrl) {
      imagePromises.push(
        loadImage(backgroundConfig.imageUrl).then((img) => {
          images.background = img;
          return img;
        })
      );
    }

    // 等待所有图片加载完成
    await Promise.all(imagePromises);

    // 1. 首先绘制背景
    if (backgroundConfig?.imageUrl && images.background) {
      // 创建临时画布用于背景处理
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");

      if (tempCtx) {
        // 绘制背景图片并填充整个画布
        const scale = Math.max(
          canvas.width / images.background.width,
          canvas.height / images.background.height
        );
        const scaledWidth = images.background.width * scale;
        const scaledHeight = images.background.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        tempCtx.drawImage(images.background, x, y, scaledWidth, scaledHeight);

        // 应用模糊效果
        if (backgroundConfig.blur) {
          applyBackgroundBlur(
            tempCtx,
            0,
            0,
            canvas.width,
            canvas.height,
            backgroundConfig.blur
          );
        }

        // 设置背景不透明度
        ctx.globalAlpha = backgroundConfig.opacity ?? 1;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalAlpha = 1;

        // 应用渐变叠加(仅当useGradient为true时)
        if (useGradient && backgroundConfig.gradient) {
          const gradient = createBackgroundGradient(
            ctx,
            canvas.width,
            canvas.height,
            backgroundConfig.gradient.angle,
            backgroundConfig.gradient.colors,
            backgroundConfig.gradient.stops
          );
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    } else {
      // 使用默认背景色
      let backgroundColor: string | CanvasGradient = "rgb(20, 20, 20)";
      if (config.cover.visible && musicInfo.coverUrl) {
        try {
          const colors = await extractColors(
            getProxiedImageUrl(musicInfo.coverUrl)
          );
          if (colors.length > 0) {
            const mainColor = ensureDarkColor(colors[0]);

            if (useGradient) {
              const darkColor = createDarkGradient(mainColor);
              backgroundColor = createGradient(
                ctx,
                [darkColor, mainColor],
                canvas.width,
                canvas.height
              );
            } else {
              backgroundColor = `rgb(${mainColor.r}, ${mainColor.g}, ${mainColor.b})`;
            }
          }
        } catch (error) {
          console.error("提取颜色失败:", error);
        }
      }
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. 绘制封面图片
    if (config.cover.visible && musicInfo.coverUrl && images.cover) {
      const x = config.cover.x * canvas.width;
      const y = config.cover.y * canvas.height;
      const size = config.cover.size;
      const radius = 40; // 圆角半径

      // 保存当前状态
      ctx.save();

      // 创建圆角矩形路径
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + size - radius, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
      ctx.lineTo(x + size, y + size - radius);
      ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
      ctx.lineTo(x + radius, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      // 裁剪
      ctx.clip();

      // 绘制图片
      ctx.drawImage(images.cover, x, y, size, size);

      // 恢复状态
      ctx.restore();
    }

    // 3. 最后绘制手机模板
    if (images.template) {
      ctx.drawImage(images.template, 0, 0, canvas.width, canvas.height);
    }

    // 设置文本颜色为#ededed
    ctx.fillStyle = "#ededed";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";

    // 绘制作者和歌曲名
    if (config.title.visible && (musicInfo.title || musicInfo.artist)) {
      ctx.font = `${config.title.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const text = `${musicInfo.artist}/${musicInfo.title}`;
      ctx.fillText(
        truncateTextByWidth(ctx, text, canvas.width * 0.8),
        config.title.x * canvas.width,
        config.title.y * canvas.height
      );
    }

    // 绘制歌词
    if (config.lyrics.visible && musicInfo.lyrics) {
      ctx.font = `bold ${config.lyrics.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "#ffffff"; // 歌词使用白色
      ctx.fillText(
        truncateTextByWidth(ctx, musicInfo.lyrics, canvas.width * 0.8),
        config.lyrics.x * canvas.width,
        config.lyrics.y * canvas.height
      );
    }

    // 绘制实际时长
    if (config.duration.visible && musicInfo.duration) {
      ctx.font = `${config.duration.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "#ededed"; // 时长使用浅灰色
      ctx.textAlign = "right"; // 时长靠右对齐

      // 转换时长为mm:ss格式
      const minutes = Math.floor(musicInfo.duration / 60);
      const seconds = Math.floor(musicInfo.duration % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      ctx.fillText(
        timeText,
        config.duration.x * canvas.width,
        config.duration.y * canvas.height
      );

      // 绘制播放时长（左对齐，默认为实际时长的三分之一）
      ctx.textAlign = "left";
      const playDuration =
        musicInfo.playDuration || Math.floor(musicInfo.duration / 3);
      const playMinutes = Math.floor(playDuration / 60);
      const playSeconds = Math.floor(playDuration % 60);
      const playTimeText = `${playMinutes}:${playSeconds
        .toString()
        .padStart(2, "0")}`;

      ctx.fillText(
        playTimeText,
        0.1 * canvas.width, // 左边距10%
        config.duration.y * canvas.height
      );
    }
  } catch (error) {
    console.error("生成海报失败:", error);
  }
};
