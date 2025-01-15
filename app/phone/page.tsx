import { Metadata } from "next";
import { Suspense } from "react";
import PhoneContent from "./PhoneContent";

// 页面元数据
export const metadata: Metadata = {
  title: "Phone模板 - Card.catpng.net",
  description: "使用Phone模板生成你的音乐小卡",
};

// 手机模板页面组件
export default function PhonePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PhoneContent />
    </Suspense>
  );
}
