// lib/themes.ts
// 此文件定义了所有主题的配置

interface Theme {
  id: string;
  name: string;
  background: string;
  backgroundType: "color" | "image";
  text: string;
  secondary?: string;
}

// 主题列表
export const themes: Theme[] = [
  {
    id: "light",
    name: "Light",
    background: "/templates/light.png",
    backgroundType: "image",
    text: "#000000",
    secondary: "#6a6a6a",
  },
  {
    id: "dark",
    name: "Dark",
    background: "/templates/dark.png",
    backgroundType: "image",
    text: "#ffffff",
    secondary: "#b3b3b3",
  },
  {
    id: "nord",
    name: "Nord",
    background: "/templates/nord.png",
    backgroundType: "image",
    text: "#eceff4",
    secondary: "#d8dee9",
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    background: "/templates/catppuccin.png",
    backgroundType: "image",
    text: "#cdd6f4",
    secondary: "#bac2de",
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    background: "/templates/gruvbox.png",
    backgroundType: "image",
    text: "#ebdbb2",
    secondary: "#a89984",
  },
  {
    id: "everforest",
    name: "Everforest",
    background: "/templates/everforest.png",
    backgroundType: "image",
    text: "#d3c6aa",
    secondary: "#9da9a0",
  },
  {
    id: "rosepine",
    name: "Rosé Pine",
    background: "/templates/rosepine.png",
    backgroundType: "image",
    text: "#e0def4",
    secondary: "#908caa",
  },
];

// 获取默认主题
export function getDefaultTheme(): Theme {
  return themes[0];
}

// 根据 ID 获取主题
export function getThemeById(id: string): Theme {
  return themes.find((theme) => theme.id === id) || getDefaultTheme();
}
