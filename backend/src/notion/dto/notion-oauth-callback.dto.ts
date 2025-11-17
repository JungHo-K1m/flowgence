import { IsString, IsOptional } from 'class-validator';

export class NotionOAuthCallbackDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}

