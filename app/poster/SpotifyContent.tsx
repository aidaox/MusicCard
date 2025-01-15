"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { themes } from "@/lib/themes";
import { generatePosterImage } from "@/utils/poster";
import { MusicInfo } from "@/types/music";
import { parseMusicUrl, processLyrics } from "@/utils/musicParser";
import Link from "next/link";

// 海报元素位置接口
interface PosterElement {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

// 海报配置接口
interface PosterConfig {
  cover: PosterElement;
  title: PosterElement;
  artist: PosterElement;
  lyrics: PosterElement;
  duration: PosterElement;
}

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
          href={`/phone${
            currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""
          }`}
          className="px-4 py-2 bg-white rounded-md shadow hover:shadow-md transition-shadow text-gray-600 hover:text-gray-900"
        >
          Phone
        </Link>
      </div>
    </div>
  );
}

export default function PosterContent() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [musicInfo, setMusicInfo] = useState<MusicInfo>({
    title: "",
    artist: "",
    coverUrl: "",
    lyrics: "",
    duration: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 海报元素配置
  const [posterConfig, setPosterConfig] = useState<PosterConfig>({
    cover: { x: 0.053, y: 0.034, scale: 1, visible: true },
    title: { x: 0.053, y: 0.73, scale: 1, visible: true },
    artist: { x: 0.053, y: 0.749, scale: 1, visible: true },
    lyrics: { x: 0.053, y: 0.801, scale: 1, visible: true },
    duration: { x: 0.947, y: 0.73, scale: 1, visible: true },
  });

  // 处理文本编辑
  const handleTextEdit = (field: keyof MusicInfo, value: string | number) => {
    console.log("文本编辑前的值:", field, musicInfo[field]);
    console.log("编辑后的新值:", value);
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
      // 创建临时 canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 1140;
      tempCanvas.height = 1740;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      // 重新生成海报内容到临时 canvas
      await generatePosterImage(tempCanvas, musicInfo, selectedTheme, {
        cover: {
          size: posterConfig.cover.scale * 1020,
          visible: posterConfig.cover.visible,
          x: posterConfig.cover.x,
          y: posterConfig.cover.y,
        },
        title: {
          size: posterConfig.title.scale * 64,
          visible: posterConfig.title.visible,
          x: posterConfig.title.x,
          y: posterConfig.title.y,
        },
        artist: {
          size: posterConfig.artist.scale * 48,
          visible: posterConfig.artist.visible,
          x: posterConfig.artist.x,
          y: posterConfig.artist.y,
        },
        lyrics: {
          size: posterConfig.lyrics.scale * 40,
          visible: posterConfig.lyrics.visible,
          x: posterConfig.lyrics.x,
          y: posterConfig.lyrics.y,
        },
        duration: {
          size: posterConfig.duration.scale * 36,
          visible: posterConfig.duration.visible,
          x: posterConfig.duration.x,
          y: posterConfig.duration.y,
        },
      });

      // 导出为图片
      const blob = await new Promise<Blob | null>((resolve) => {
        tempCanvas.toBlob(resolve, "image/png", 1.0);
      });

      if (!blob) throw new Error("Failed to create image blob");

      // 下载图片
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${musicInfo.title || "poster"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("保存海报失败:", error);
      alert("保存海报失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  // 更新元素配置
  const updateElementConfig = (
    element: keyof PosterConfig,
    field: keyof PosterElement,
    value: number | boolean
  ) => {
    setPosterConfig((prev) => ({
      ...prev,
      [element]: {
        ...prev[element],
        [field]: value,
      },
    }));
  };

  // 初始化主题
  useEffect(() => {
    const themeId = searchParams.get("theme") || themes[0].id;
    const theme = themes.find((t) => t.id === themeId) || themes[0];
    setSelectedTheme(theme);
  }, [searchParams]);

  // 绘制海报
  useEffect(() => {
    if (canvasRef.current && musicInfo && selectedTheme) {
      console.log("绘制海报时的音乐信息:", musicInfo);
      generatePosterImage(canvasRef.current, musicInfo, selectedTheme, {
        cover: {
          size: posterConfig.cover.scale * 1020,
          visible: posterConfig.cover.visible,
          x: posterConfig.cover.x,
          y: posterConfig.cover.y,
        },
        title: {
          size: posterConfig.title.scale * 64,
          visible: posterConfig.title.visible,
          x: posterConfig.title.x,
          y: posterConfig.title.y,
        },
        artist: {
          size: posterConfig.artist.scale * 48,
          visible: posterConfig.artist.visible,
          x: posterConfig.artist.x,
          y: posterConfig.artist.y,
        },
        lyrics: {
          size: posterConfig.lyrics.scale * 40,
          visible: posterConfig.lyrics.visible,
          x: posterConfig.lyrics.x,
          y: posterConfig.lyrics.y,
        },
        duration: {
          size: posterConfig.duration.scale * 36,
          visible: posterConfig.duration.visible,
          x: posterConfig.duration.x,
          y: posterConfig.duration.y,
        },
      });
    }
  }, [musicInfo, selectedTheme, posterConfig]);

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
          const processedLyrics = processLyrics(rawLyrics);
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
        data.lyrics = processLyrics(data.lyrics); // 只获取1行歌词
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
                  width={1140}
                  height={1740}
                  className="w-full h-auto"
                />
                {isEditing && (
                  <div className="edit-overlay">
                    <div className="edit-panel">
                      <h3 className="text-lg font-medium mb-4">编辑音乐信息</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={musicInfo.title}
                          onChange={(e) =>
                            handleTextEdit("title", e.target.value)
                          }
                          className="input-field"
                          placeholder="歌曲"
                        />
                        <input
                          type="text"
                          value={musicInfo.artist}
                          onChange={(e) =>
                            handleTextEdit("artist", e.target.value)
                          }
                          className="input-field"
                          placeholder="歌手"
                        />
                        <textarea
                          value={musicInfo.lyrics}
                          onChange={(e) =>
                            handleTextEdit("lyrics", e.target.value)
                          }
                          className="input-field"
                          rows={4}
                          placeholder="歌词"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            时长（秒）
                          </label>
                          <input
                            type="number"
                            value={musicInfo.duration}
                            onChange={(e) =>
                              handleTextEdit("duration", Number(e.target.value))
                            }
                            className="input-field"
                            placeholder="歌曲时长（秒）"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            更换封面
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="file-input"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="btn btn-secondary"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="btn btn-primary"
                          >
                            确定
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  编辑内容
                </button>
                <button
                  onClick={handleSavePoster}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "下载"}
                </button>
              </div>
            </div>

            {/* 右侧控制面板 */}
            <div className="space-y-6">
              {/* 主题选择 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">选择主题</h2>
                <div className="grid grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`relative aspect-square rounded-lg border-2 p-2 hover:border-indigo-500 ${
                        selectedTheme.id === theme.id
                          ? "border-indigo-500"
                          : "border-gray-200"
                      }`}
                      style={{
                        background:
                          theme.backgroundType === "image"
                            ? `url(${theme.background}) center/cover`
                            : theme.background,
                      }}
                    >
                      <span
                        className="block text-sm font-medium text-center"
                        style={{ color: theme.text }}
                      >
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 元素编辑 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">元素编辑</h2>
                <div className="space-y-4">
                  {Object.entries(posterConfig).map(([key, config]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key}
                        </label>
                        <input
                          type="checkbox"
                          checked={config.visible}
                          onChange={(e) =>
                            updateElementConfig(
                              key as keyof PosterConfig,
                              "visible",
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500">
                            位置 X
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.x * 100}
                            onChange={(e) =>
                              updateElementConfig(
                                key as keyof PosterConfig,
                                "x",
                                Number(e.target.value) / 100
                              )
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">
                            位置 Y
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.y * 100}
                            onChange={(e) =>
                              updateElementConfig(
                                key as keyof PosterConfig,
                                "y",
                                Number(e.target.value) / 100
                              )
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm text-gray-500">
                            缩放
                          </label>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={config.scale * 100}
                            onChange={(e) =>
                              updateElementConfig(
                                key as keyof PosterConfig,
                                "scale",
                                Number(e.target.value) / 100
                              )
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
