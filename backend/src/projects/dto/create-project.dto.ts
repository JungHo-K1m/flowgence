import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  serviceType: string;

  @IsOptional()
  @IsObject()
  projectOverview?: any;

  @IsOptional()
  @IsObject()
  requirements?: any;

  @IsOptional()
  @IsObject()
  estimations?: any;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
