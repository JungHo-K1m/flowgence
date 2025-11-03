import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // pdfjs-dist 관련 설정
    if (!isServer) {
      // 클라이언트 사이드: canvas를 false로 설정 (브라우저에서는 불필요)
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
      
      // pdfjs-dist의 Node.js 관련 모듈 무시
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      };
    } else {
      // 서버 사이드: pdfjs-dist를 완전히 제외
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist": false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
