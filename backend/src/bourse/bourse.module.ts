import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BourseService } from './bourse.service';
import { BourseController } from './bourse.controller';

@Module({
  imports: [HttpModule.register({ timeout: 10000 })],
  controllers: [BourseController],
  providers: [BourseService],
})
export class BourseModule {}
