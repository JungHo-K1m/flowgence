/**
 * 파일 처리 유틸리티
 * PDF 텍스트 추출 및 이미지 처리 기능
 * 
 * 주의: 이 파일의 함수들은 클라이언트 사이드에서만 실행됩니다.
 */

export interface ExtractedFileContent {
  text: string;
  fileName: string;
  fileType: string;
  size: number;
}

/**
 * PDF 파일의 텍스트 내용 추출 (브라우저 기반)
 * pdfjs-dist를 동적으로 로드하여 사용
 */
// pdf.js를 동적으로 로드하기 위한 캐시
let pdfjsCache: any = null;
let pdfjsLoading: Promise<any> | null = null;

async function loadPdfjs(): Promise<any> {
  // 서버 사이드에서는 실행하지 않음
  if (typeof window === "undefined") {
    throw new Error("PDF 처리는 브라우저에서만 가능합니다");
  }
  
  // 이미 로드되어 있으면 캐시 반환
  if (pdfjsCache) {
    return pdfjsCache;
  }
  
  // 로딩 중이면 기다림
  if (pdfjsLoading) {
    return pdfjsLoading;
  }
  
  // 새로운 로딩 시작
  pdfjsLoading = (async () => {
    try {
      // pdfjs-dist를 동적으로 import (클라이언트 사이드에서만)
      // webpack 버전 사용 (브라우저용)
      const pdfjsModule = await import(
        /* webpackChunkName: "pdfjs" */ "pdfjs-dist/webpack"
      );
      
      // default export 또는 named export 확인
      const pdfjs = pdfjsModule.default || pdfjsModule;
      
      // worker 설정 (CDN 사용)
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      }
      
      // 캐시에 저장
      pdfjsCache = pdfjs;
      return pdfjs;
    } catch (error) {
      pdfjsLoading = null; // 실패 시 다시 시도 가능하도록
      throw error;
    }
  })();
  
  return pdfjsLoading;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  // 서버 사이드에서는 실행하지 않음
  if (typeof window === "undefined") {
    throw new Error("PDF 처리는 브라우저에서만 가능합니다");
  }
  
  try {
    // pdf.js 로드
    const pdfjs = await loadPdfjs();
    
    if (!pdfjs || !pdfjs.getDocument) {
      throw new Error("PDF.js 라이브러리가 제대로 로드되지 않았습니다");
    }

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    
    // PDF 문서 로드
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    // 모든 페이지의 텍스트 추출
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 텍스트 조각들을 하나의 문자열로 결합
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      fullText += pageText + "\n\n";
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("PDF 텍스트 추출 실패:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : String(error);
    throw new Error(`PDF 처리가 실패했습니다: ${errorMessage}`);
  }
}

/**
 * 이미지 파일 설명 추출 (AI 기반 처리 필요 시 사용)
 * 현재는 기본 메시지만 반환
 */
export async function extractImageDescription(
  file: File
): Promise<string> {
  // TODO: 향후 이미지 분석 AI API 연동 가능
  // 예: Google Vision API, AWS Rekognition 등
  return `이미지 파일: ${file.name}`;
}

/**
 * 파일 타입에 따라 적절한 텍스트 추출 함수 선택
 */
export async function extractContentFromFile(
  file: File
): Promise<string> {
  const fileType = file.type;
  
  // PDF 파일 처리
  if (fileType === "application/pdf") {
    return await extractTextFromPDF(file);
  }
  
  // 이미지 파일 처리
  if (fileType.startsWith("image/")) {
    return await extractImageDescription(file);
  }
  
  // 텍스트 파일 처리 (직접 읽기)
  if (fileType.startsWith("text/")) {
    return await file.text();
  }
  
  // Word 문서, Excel 등은 현재 미지원
  throw new Error(`${fileType} 형식은 현재 지원되지 않습니다.`);
}

/**
 * 여러 파일의 내용을 추출하여 통합된 텍스트 반환
 */
export async function extractContentFromFiles(
  files: File[]
): Promise<string> {
  const extractedContents = await Promise.all(
    files.map(async (file) => {
      try {
        const text = await extractContentFromFile(file);
        return `\n[파일: ${file.name}]\n${text}\n`;
      } catch (error) {
        console.error(`파일 ${file.name} 처리 실패:`, error);
        return `\n[파일: ${file.name} - 처리 실패]\n`;
      }
    })
  );
  
  return extractedContents.join("\n---\n");
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 파일 타입 검증
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      // 와일드카드 패턴 (예: "image/*")
      const baseType = type.slice(0, -2);
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });
}

/**
 * 지원되는 파일 형식 목록
 */
export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "text/plain",
  "text/markdown",
  "text/csv",
];

/**
 * 파일 업로드 최대 크기 (MB)
 */
export const MAX_FILE_SIZE_MB = 10;

