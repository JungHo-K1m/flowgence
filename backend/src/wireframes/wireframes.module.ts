import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WireframesController } from './wireframes.controller';
import { WireframesService } from './wireframes.service';

@Module({
  imports: [ConfigModule],
  controllers: [WireframesController],
  providers: [WireframesService],
  exports: [WireframesService],
})
export class WireframesModule {}

