// types/theme.ts
// 主题相关的类型定义

// 背景类型
export type BackgroundType = "color" | "image";

// 主题接口
export interface Theme {
  id: string;
  name: string;
  background: string; // 颜色值或图片路径
  backgroundType: BackgroundType;
  text: string;
  secondary?: string; // 次要文本颜色
}

// 主题配置接口
export interface ThemeConfig {
  themes: Theme[];
  defaultTheme: Theme;
}
