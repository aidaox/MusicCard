// types.ts
// 此文件定义了项目中使用的类型
// 包括：
// 1. 音乐信息类型
// 2. 海报模板类型
// 3. 海报元素类型
// 4. 音乐平台类型

// 元素类型枚举
export enum ElementType {
  IMAGE = "image",
  TEXT = "text",
  PROGRESS = "progress",
  CONTROLS = "controls",
  WAVEFORM = "waveform",
  LYRICS = "lyrics",
}

// 音乐平台枚举
export enum MusicPlatform {
  NETEASE = "netease",
  QQ = "qq",
  SPOTIFY = "spotify",
  KUGOU = "kugou",
  KUWO = "kuwo",
}

// 音乐信息类型
export interface MusicInfo {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  lyrics?: string[];
  platform?: MusicPlatform;
}

// 海报元素类型
export interface PosterElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height?: number;
  color?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: number;
  maxLines?: number;
  progress?: number;
  source?: string;
}

// 海报模板类型
export interface PosterTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  elements: PosterElement[];
}
