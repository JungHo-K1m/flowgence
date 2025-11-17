import { IsString, IsOptional } from 'class-validator';

export class ShareRequirementsDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsString()
  markdown: string;

  @IsOptional()
  @IsString()
  databaseId?: string; // 선택사항: 특정 데이터베이스에 저장
}

