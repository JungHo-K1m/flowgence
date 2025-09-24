import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateChatMessageDto {
  @IsString()
  projectId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsArray()
  history?: any[];
}
