// Poster模板相关的类型定义

// 主题配置
export interface PosterTheme {
  name: string;
  background: string; // 背景颜色或图片路径
  backgroundType: "color" | "image"; // 背景类型
  text: string; // 主要文字颜色
  secondary: string; // 次要文字颜色
}

// 字体配置
export interface PosterFont {
  title: string; // 标题字体
  artist: string; // 艺术家字体
  album: string; // 专辑字体
  lyrics: string; // 歌词字体
}

// Poster样式配置
export interface PosterStyle {
  coverSize: number; // 封面尺寸
  padding: number; // 内边距
  bottomSpace: number; // 底部空间
  posterBorder: number; // Poster边框宽度
  posterTop: number; // Poster顶部位置
  titleSpacing: number; // 标题与封面的间距
  artistSpacing: number; // 艺术家与标题的间距
  lyricsSpacing: number; // 歌词与艺术家的间距
  font: PosterFont; // 字体配置
}

// 默认主题
export const defaultTheme: PosterTheme = {
  name: "默认主题",
  background: "#191724",
  backgroundType: "color",
  text: "#ffffff",
  secondary: "#a6a6a6",
};

// 默认样式
export const defaultStyle: PosterStyle = {
  coverSize: 700, // 更大的封面尺寸
  padding: 80, // 更宽的内边距
  bottomSpace: 300, // 更大的底部空间
  posterBorder: 60, // Poster边框宽度
  posterTop: 200, // Poster顶部位置
  titleSpacing: 120, // 标题与封面的间距
  artistSpacing: 50, // 艺术家与标题的间距
  lyricsSpacing: 80, // 歌词与艺术家的间距
  font: {
    title: "bold 56px 'Helvetica Neue', sans-serif", // 更大的标题字号
    artist: "40px 'Helvetica Neue', sans-serif", // 更大的艺术家字号
    album: "32px 'Helvetica Neue', sans-serif", // 更大的专辑字号
    lyrics: "28px 'Helvetica Neue', sans-serif", // 歌词字号
  },
};
