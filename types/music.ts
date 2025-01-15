// types/music.ts
// 音乐相关的类型定义

// 音乐平台
export enum MusicPlatform {
  NETEASE = "netease",
  QQ = "qq",
  SPOTIFY = "spotify",
}

// 音乐信息
export interface MusicInfo {
  title: string; // 歌曲标题
  artist: string; // 艺术家
  coverUrl: string; // 封面图片URL
  lyrics: string; // 歌词
  duration: number; // 歌曲时长(秒)
  playDuration?: number; // 播放时长(秒)，默认为实际时长的三分之一
  isEditing?: boolean; // 是否处于编辑状态
}

// 音乐解析结果接口
export interface MusicParseResult {
  platform: MusicPlatform;
  id: string;
}
