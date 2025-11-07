import { IsOptional, IsNotEmpty } from 'class-validator';

export class VerifyRequirementsDto {
  @IsNotEmpty()
  requirements: any;

  @IsOptional()
  projectId?: string;
}

