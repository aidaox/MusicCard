"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// 模板列表
const templates = [
  {
    id: "poster",
    name: "Poster",
    description: "音乐海报",
    image: "/poster.png",
  },
  {
    id: "phone",
    name: "Phone",
    description: "音乐小卡",
    image: "/phone.png",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("poster");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [fallbackImages, setFallbackImages] = useState(false);

  // 检测图片加载失败，使用备用方案
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!imagesLoaded) {
        setFallbackImages(true);
      }
    }, 3000); // 3秒后如果图片还未加载，使用备用方案

    return () => clearTimeout(timer);
  }, [imagesLoaded]);

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Card.Catpng.net
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            选择一个模板，输入网易云音乐链接，自动生成音乐卡片
          </p>

          {/* 音乐链接输入 */}
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6 mb-12">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  输入音乐链接
                </label>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="请输入网易云音乐链接"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择模板
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <Link
                href={`/${selectedTemplate}?url=${encodeURIComponent(url)}`}
                className={`w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !url.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={(e) => {
                  if (!url.trim()) {
                    e.preventDefault();
                  }
                }}
              >
                开始创建
              </Link>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p>支持的音乐平台：</p>
              <ul className="list-disc list-inside mt-2">
                <li>网易云音乐 (music.163.com)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {templates.map((template) => (
            <div key={template.id} className="block group">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-200 hover:scale-105">
                <div className="relative h-[600px]">
                  {fallbackImages ? (
                    // 备用方案：使用普通img标签
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-contain"
                      onLoad={() => setImagesLoaded(true)}
                    />
                  ) : (
                    // 主要方案：使用picture元素和多个源
                    <picture>
                      <source srcSet={template.image} type="image/webp" />
                      <source srcSet={template.image} type="image/png" />
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-full object-contain"
                        onLoad={() => setImagesLoaded(true)}
                        loading="eager"
                      />
                    </picture>
                  )}
                </div>
                <div className="p-6 relative bg-white">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {template.name}
                  </h2>
                  <p className="text-gray-600">{template.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <div className="space-y-2">
            <p>
              © 2024{" "}
              <a
                href="https://card.catpng.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Card.Catpng.net
              </a>
              . All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
