import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class RequirementItemDto {
  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class ProjectDataDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  serviceType?: string;
}

export class RecommendationsDto {
  @IsString()
  categoryTitle: string;

  @IsArray()
  @IsOptional()
  existingRequirements?: RequirementItemDto[];

  @IsObject()
  @IsOptional()
  projectData?: ProjectDataDto;
}

