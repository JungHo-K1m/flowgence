export class ShareRequirementsDto {
  title: string;
  description?: string;
  projectType?: string;
  markdown: string;
  databaseId?: string; // 선택사항: 특정 데이터베이스에 저장
}

