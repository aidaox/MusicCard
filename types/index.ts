// types/index.ts
// 此文件定义了项目中使用的所有类型接口和枚举
// 包括：音乐平台类型、音乐信息接口、海报模板接口、元素类型等
// 这些类型定义被其他文件引用，确保类型安全

// 音乐平台类型枚举
export enum MusicPlatform {
  NETEASE = "netease", // 网易云音乐
  QQ = "qq", // QQ音乐
  KUGOU = "kugou", // 酷狗音乐
  KUWO = "kuwo", // 酷我音乐
  SPOTIFY = "spotify",
}

// 音乐信息接口
export interface MusicInfo {
  platform: MusicPlatform; // 音乐平台
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  lyrics?: string;
}

// 元素位置
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 字体配置
export interface FontConfig {
  title: string;
  artist: string;
  album: string;
}

// Polaroid 风格配置
export interface PolaroidStyle {
  type: "polaroid";
  coverSize: number;
  padding: number;
  bottomSpace: number;
  font: FontConfig;
}

// 海报模板接口
export interface PosterTemplate {
  id: string; // 模板ID
  name: string; // 模板名称
  background: string; // 背景（颜色或图片URL）
  width: number; // 宽度
  height: number; // 高度
  elements?: Record<string, ElementPosition>;
  style?: PolaroidStyle;
}

// 海报元素类型
export enum ElementType {
  IMAGE = "image",
  TEXT = "text",
  PROGRESS = "progress",
  CONTROLS = "controls",
  WAVEFORM = "waveform",
  LYRICS = "lyrics",
}

// 海报元素接口
export interface PosterElement {
  id: string; // 元素ID
  type: ElementType; // 元素类型
  x: number | string;
  y: number | string;
  width: number | string;
  height?: number | string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  borderRadius?: string;
  source?: string;
  text?: string;
  progress?: number;
  maxLines?: number;
  lineHeight?: number;
}

// 元素样式接口
export interface ElementStyle {
  x: number; // X坐标
  y: number; // Y坐标
  width?: number; // 宽度（可选）
  height?: number; // 高度（可选）
  fontSize?: number; // 字体大小（可选）
  fontFamily?: string; // 字体（可选）
  color?: string; // 颜色（可选）
  textAlign?: CanvasTextAlign; // 文本对齐方式（可选）
  opacity?: number; // 透明度（可选）
}

// 主题接口
export interface Theme {
  id: string;
  name: string;
  background: string; // 可以是颜色值或图片路径
  backgroundType: "color" | "image"; // 背景类型
  text: string;
  secondary?: string; // 次要文本颜色
}
