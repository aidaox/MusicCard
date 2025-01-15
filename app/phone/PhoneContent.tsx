"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MusicInfo } from "@/types/music";
import { Theme } from "@/types/theme";
import { generatePhonePoster } from "@/utils/phone";
import { parseMusicUrl, processLyrics } from "@/utils/musicParser";
import Link from "next/link";

// 海报元素配置接口
interface PosterElement {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

interface PosterConfig {
  cover: PosterElement;
  title: PosterElement;
  artist: PosterElement;
  lyrics: PosterElement;
  duration: PosterElement;
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

// 默认主题
const phoneTheme: Theme = {
  id: "phone",
  name: "手机风格",
  background: "/templates/phone.png",
  backgroundType: "image",
  text: "#ffffff",
  secondary: "#cccccc",
};

// 海报元素配置
const posterConfig: PosterConfig = {
  cover: { x: 0.1, y: 0.04, scale: 1, visible: true },
  title: { x: 0.1, y: 0.693, scale: 1, visible: true },
  artist: { x: 0.1, y: 0.693, scale: 1, visible: true },
  lyrics: { x: 0.1, y: 0.64, scale: 1, visible: true },
  duration: { x: 0.9, y: 0.743, scale: 1, visible: true },
};

// 加载状态组件
function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}

// 导航栏组件
function NavigationBar({ currentUrl }: { currentUrl: string | null }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <Link
          href="/"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="material-symbols-outlined mr-1">home</span>
          返回首页
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-500">切换模板：</span>
        <Link
          href={`/poster${
            currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""
          }`}
          className="px-4 py-2 bg-white rounded-md shadow hover:shadow-md transition-shadow text-gray-600 hover:text-gray-900"
        >
          Poster
        </Link>
      </div>
    </div>
  );
}

export default function PhoneContent() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [musicInfo, setMusicInfo] = useState<MusicInfo>({
    title: "",
    artist: "",
    coverUrl: "",
    lyrics: "",
    duration: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [useGradient, setUseGradient] = useState(false);
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    blur: 0,
    opacity: 1,
    gradient: {
      angle: 180,
      colors: ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)"],
      stops: [0, 1],
    },
  });

  // 处理文本编辑
  const handleTextEdit = (field: keyof MusicInfo, value: string | number) => {
    setMusicInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 处理封面上传
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMusicInfo((prev) => ({
          ...prev,
          coverUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理海报保存
  const handleSavePoster = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Failed to create blob");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${musicInfo.title}-${musicInfo.artist}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("保存海报失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理时长编辑
  const handleDurationEdit = (value: string) => {
    // 解析mm:ss格式的时长
    const [minutes, seconds] = value.split(":").map(Number);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      const totalSeconds = minutes * 60 + seconds;
      handleTextEdit("duration", totalSeconds);
    }
  };

  // 格式化时长为mm:ss
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // 处理背景上传
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundConfig((prev) => ({
          ...prev,
          imageUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理背景设置更新
  const handleBackgroundConfigUpdate = (
    field: keyof BackgroundConfig,
    value: number
  ) => {
    setBackgroundConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 加载音乐信息
  useEffect(() => {
    const loadMusicInfo = async () => {
      // 处理URL参数传递的音乐信息
      const params = searchParams;
      if (params && params.get("title")) {
        setIsLoading(true);
        try {
          const rawLyrics = params.get("lyrics") || "";
          console.log("URL参数传递的原始歌词:", rawLyrics);
          const processedLyrics = processLyrics(rawLyrics, 1); // 只获取1行歌词
          console.log("URL参数歌词处理后:", processedLyrics);
          const info: MusicInfo = {
            title: params.get("title") || "",
            artist: params.get("artist") || "",
            coverUrl: params.get("cover") || "",
            lyrics: processedLyrics,
            duration: Number(params.get("duration")) || 0,
          };
          console.log("设置的音乐信息:", info);
          setMusicInfo(info);
        } catch (err) {
          setError(err instanceof Error ? err.message : "加载音乐信息失败");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 处理音乐链接获取信息
      const url = searchParams.get("url");
      if (!url) return;

      setIsLoading(true);
      setError(null);

      try {
        // 先解析URL获取平台和ID
        const { platform, id } = await parseMusicUrl(url);
        const params = new URLSearchParams({
          platform,
          id,
        });

        const response = await fetch(`/api/music?${params.toString()}`);
        if (!response.ok) {
          throw new Error("获取音乐信息失败");
        }
        const data = await response.json();
        console.log("API返回的原始数据:", data);
        data.lyrics = processLyrics(data.lyrics, 1); // 只获取1行歌词
        console.log("API数据歌词处理后:", data);
        setMusicInfo(data);
      } catch (error) {
        console.error("获取音乐信息失败:", error);
        setError(
          error instanceof Error
            ? error.message
            : "获取音乐信息失败，请检查链接是否正确"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMusicInfo();
  }, [searchParams]);

  // 绘制海报
  useEffect(() => {
    if (canvasRef.current && musicInfo && phoneTheme) {
      generatePhonePoster(
        canvasRef.current,
        musicInfo,
        phoneTheme,
        {
          cover: {
            size: 800,
            visible: true,
            x: posterConfig.cover.x,
            y: posterConfig.cover.y,
          },
          title: {
            size: 48,
            visible: true,
            x: posterConfig.title.x,
            y: posterConfig.title.y,
          },
          artist: {
            size: 48,
            visible: true,
            x: posterConfig.artist.x,
            y: posterConfig.artist.y,
          },
          lyrics: {
            size: 50,
            visible: true,
            x: posterConfig.lyrics.x,
            y: posterConfig.lyrics.y,
          },
          duration: {
            size: 28,
            visible: true,
            x: posterConfig.duration.x,
            y: posterConfig.duration.y,
          },
        },
        useGradient,
        backgroundConfig
      );
    }
  }, [musicInfo, useGradient, backgroundConfig]);

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      {/* 加载状态 */}
      {isLoading && <LoadingOverlay message="正在获取音乐信息..." />}
      {isSaving && <LoadingOverlay message="正在生成海报..." />}

      {error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">{error}</div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          {/* 添加导航栏 */}
          <NavigationBar currentUrl={searchParams.get("url")} />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center text-gray-900">
              Card.Catpng.net
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧预览 */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={1500}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* 右侧控制面板 */}
            <div className="space-y-6 bg-white rounded-lg shadow-lg p-6">
              {/* 基本信息编辑 */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">基本信息</h2>

                {/* 标题编辑 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    歌曲标题
                  </label>
                  <input
                    type="text"
                    value={musicInfo.title}
                    onChange={(e) => handleTextEdit("title", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 艺术家编辑 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    艺术家
                  </label>
                  <input
                    type="text"
                    value={musicInfo.artist}
                    onChange={(e) => handleTextEdit("artist", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 歌词编辑 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    歌词
                  </label>
                  <textarea
                    value={musicInfo.lyrics}
                    onChange={(e) => handleTextEdit("lyrics", e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 实际时长编辑 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    实际时长 (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={formatDuration(musicInfo.duration)}
                    onChange={(e) => handleDurationEdit(e.target.value)}
                    placeholder="0:00"
                    pattern="[0-9]+:[0-5][0-9]"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 播放时长编辑 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    播放时长 (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={formatDuration(
                      musicInfo.playDuration ||
                        Math.floor(musicInfo.duration / 3)
                    )}
                    onChange={(e) => {
                      const [minutes, seconds] = e.target.value
                        .split(":")
                        .map(Number);
                      if (!isNaN(minutes) && !isNaN(seconds)) {
                        handleTextEdit("playDuration", minutes * 60 + seconds);
                      }
                    }}
                    placeholder="0:00"
                    pattern="[0-9]+:[0-5][0-9]"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* 封面上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    封面图片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              {/* 背景设置 */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">背景设置</h2>

                {/* 背景图片上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    背景图片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                {/* 模糊程度设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    模糊程度
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={backgroundConfig.blur}
                    onChange={(e) =>
                      handleBackgroundConfigUpdate(
                        "blur",
                        Number(e.target.value)
                      )
                    }
                    className="mt-1 block w-full"
                  />
                  <div className="mt-1 text-sm text-gray-500 text-right">
                    {backgroundConfig.blur}px
                  </div>
                </div>

                {/* 不透明度设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    不透明度
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundConfig.opacity}
                    onChange={(e) =>
                      handleBackgroundConfigUpdate(
                        "opacity",
                        Number(e.target.value)
                      )
                    }
                    className="mt-1 block w-full"
                  />
                  <div className="mt-1 text-sm text-gray-500 text-right">
                    {Math.round((backgroundConfig.opacity ?? 1) * 100)}%
                  </div>
                </div>

                {/* 渐变背景开关 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    渐变背景
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useGradient}
                      onChange={(e) => setUseGradient(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* 保存按钮 */}
              <button
                onClick={handleSavePoster}
                disabled={isSaving}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isSaving ? "保存中..." : "保存海报"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 text-center text-sm text-gray-500">
        如果使用过程有错误，或者你对网站有其他建议，可以发送具体内容到我的邮箱：
        <a
          href="mailto:aidaoxx@gmail.com"
          className="text-indigo-600 hover:text-indigo-800"
        >
          aidaoxx@gmail.com
        </a>
        ，谢谢
      </div>
    </main>
  );
}
