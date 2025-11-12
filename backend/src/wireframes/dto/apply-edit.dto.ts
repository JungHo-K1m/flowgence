import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyEditDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}

