import { IsString, IsOptional } from 'class-validator';

export class UpdateDatabaseIdDto {
  @IsOptional()
  @IsString()
  databaseId?: string;
}

