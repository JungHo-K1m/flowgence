import { Global, Module } from '@nestjs/common';
import { ClaudeApiService } from './services/claude-api.service';
import { JsonParserService } from './services/json-parser.service';

@Global()
@Module({
  providers: [ClaudeApiService, JsonParserService],
  exports: [ClaudeApiService, JsonParserService],
})
export class CommonModule {}
