import { MusicInfo } from "@/types";

interface Theme {
  id: string;
  name: string;
  background: string;
  text: string;
}

export function generatePoster(
  canvas: HTMLCanvasElement,
  musicInfo: MusicInfo,
  theme: Theme
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 加载封面图片
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = musicInfo.coverUrl;

  img.onload = () => {
    // 计算 Polaroid 尺寸
    const polaroidWidth = canvas.width * 0.8;
    const polaroidHeight = polaroidWidth * 1.2;
    const polaroidX = (canvas.width - polaroidWidth) / 2;
    const polaroidY = (canvas.height - polaroidHeight) / 2;

    // 绘制 Polaroid 边框
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.fillRect(polaroidX, polaroidY, polaroidWidth, polaroidHeight);

    // 计算图片尺寸和位置
    const imageWidth = polaroidWidth * 0.9;
    const imageHeight = imageWidth;
    const imageX = polaroidX + (polaroidWidth - imageWidth) / 2;
    const imageY = polaroidY + (polaroidWidth - imageWidth) / 2;

    // 绘制图片
    ctx.shadowColor = "transparent";
    ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);

    // 绘制文本
    const textY = imageY + imageHeight + 40;
    ctx.fillStyle = theme.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // 绘制标题
    ctx.font = "bold 24px Arial";
    ctx.fillText(musicInfo.title, canvas.width / 2, textY);

    // 绘制艺术家
    ctx.font = "18px Arial";
    ctx.fillText(musicInfo.artist, canvas.width / 2, textY + 30);

    // 绘制专辑
    if (musicInfo.album) {
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillText(musicInfo.album, canvas.width / 2, textY + 60);
    }
  };

  img.onerror = () => {
    console.error("封面图片加载失败");
    // 绘制占位图
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(
      canvas.width * 0.2,
      canvas.height * 0.2,
      canvas.width * 0.6,
      canvas.width * 0.6
    );
  };
}
