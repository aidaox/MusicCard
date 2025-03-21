// 将文件重命名为poster.ts
// 修改类型名称,保持内容不变
export interface PosterConfig {
  name: string;
  background: string; // 背景颜色或图片路径
  backgroundType: "color" | "image"; // 背景类型
  text: string; // 主要文字颜色
  secondary: string; // 次要文字颜色
}

// 字体配置
export interface SpotifyFont {
  title: string; // 标题字体
  artist: string; // 艺术家字体
  album: string; // 专辑字体
  lyrics: string; // 歌词字体
}

// Polaroid 样式配置
export interface SpotifyStyle {
  coverSize: number; // 封面尺寸
  padding: number; // 内边距
  bottomSpace: number; // 底部空间
  polaroidBorder: number; // Polaroid 边框宽度
  polaroidTop: number; // Polaroid 顶部位置
  titleSpacing: number; // 标题与封面的间距
  artistSpacing: number; // 艺术家与标题的间距
  lyricsSpacing: number; // 歌词与艺术家的间距
  font: SpotifyFont; // 字体配置
}

// 默认主题
export const defaultTheme: PosterConfig = {
  name: "默认主题",
  background: "#191724",
  backgroundType: "color",
  text: "#ffffff",
  secondary: "#a6a6a6",
};

// 默认样式
export const defaultStyle: SpotifyStyle = {
  coverSize: 700, // 更大的封面尺寸
  padding: 80, // 更宽的内边距
  bottomSpace: 300, // 更大的底部空间
  polaroidBorder: 60, // Polaroid 边框宽度
  polaroidTop: 200, // Polaroid 顶部位置
  titleSpacing: 120, // 标题与封面的间距
  artistSpacing: 30, // 减小艺术家与标题的间距
  lyricsSpacing: 40, // 减小歌词与艺术家的间距
  font: {
    title: "bold 56px 'Helvetica Neue', sans-serif", // 更大的标题字号
    artist: "48px 'Helvetica Neue', sans-serif", // 调整艺术家字号为48px
    album: "32px 'Helvetica Neue', sans-serif", // 更大的专辑字号
    lyrics: "50px 'Helvetica Neue', sans-serif", // 调整歌词字号为50px
  },
};
