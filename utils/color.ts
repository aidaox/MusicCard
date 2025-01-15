// utils/color.ts
// 颜色提取和处理工具函数

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Lab {
  l: number;
  a: number;
  b: number;
}

/**
 * RGB转Lab颜色空间
 * Lab颜色空间更接近人眼感知
 */
const rgbToLab = (r: number, g: number, b: number): Lab => {
  // 先转换到XYZ空间
  let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  // 标准化
  x = (x / 255) * 100;
  y = (y / 255) * 100;
  z = (z / 255) * 100;

  // XYZ到Lab的转换
  const f = (t: number) =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;

  const l = 116 * f(y / 100) - 16;
  const a = 500 * (f(x / 95.047) - f(y / 100));
  const b_val = 200 * (f(y / 100) - f(z / 108.883));

  return { l, a, b: b_val };
};

/**
 * 计算两个Lab颜色之间的差异
 * 使用CIEDE2000公式，这是目前最准确的颜色差异计算方法
 */
const deltaE = (lab1: Lab, lab2: Lab): number => {
  const deltaL = lab2.l - lab1.l;
  const deltaA = lab2.a - lab1.a;
  const deltaB = lab2.b - lab1.b;

  // 简化版的deltaE计算
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};

/**
 * 从图片中提取主要颜色
 * @param imageUrl - 图片URL
 * @returns Promise<RGB[]> - 返回主要颜色数组
 */
export const extractColors = async (imageUrl: string): Promise<RGB[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建canvas上下文"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      const colors: RGB[] = [];
      const labColors: Lab[] = [];

      // 采样颜色
      for (let i = 0; i < imageData.length; i += 4 * 10) {
        // 每10个像素采样一次
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];

        // 转换到Lab空间
        const lab = rgbToLab(r, g, b);

        // 检查是否是新的主要颜色
        let isNewColor = true;
        for (const existingLab of labColors) {
          if (deltaE(lab, existingLab) < 20) {
            // 颜色差异阈值
            isNewColor = false;
            break;
          }
        }

        if (isNewColor && colors.length < 6) {
          colors.push({ r, g, b });
          labColors.push(lab);
        }
      }

      // 按亮度排序
      colors.sort((a, b) => {
        const labA = rgbToLab(a.r, a.g, a.b);
        const labB = rgbToLab(b.r, b.g, b.b);
        return labB.l - labA.l; // 按Lab空间的亮度排序
      });

      resolve(colors);
    };

    img.onerror = () => {
      reject(new Error("图片加载失败"));
    };

    img.src = imageUrl;
  });
};
