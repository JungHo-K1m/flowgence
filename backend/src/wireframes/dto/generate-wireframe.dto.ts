import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateWireframeDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;
}

