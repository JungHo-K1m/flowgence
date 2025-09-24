import { IsArray, IsString, IsObject } from 'class-validator';

export class UpdateRequirementsDto {
  @IsString()
  projectId: string;

  @IsObject()
  existingRequirements: any;

  @IsArray()
  history: any[];
}
