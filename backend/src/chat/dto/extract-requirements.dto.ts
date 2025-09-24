import { IsArray, IsString } from 'class-validator';

export class ExtractRequirementsDto {
  @IsString()
  projectId: string;

  @IsArray()
  history: any[];
}
