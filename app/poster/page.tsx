import { Suspense } from "react";
import SpotifyContent from "./SpotifyContent";

// 页面元数据
export const metadata = {
  title: "Poster模板 - Card.catpng.net",
  description: "使用Poster模板生成你的音乐海报",
};

export default function PosterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">加载中...</div>
        </div>
      }
    >
      <SpotifyContent />
    </Suspense>
  );
}
