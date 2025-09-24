import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

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
