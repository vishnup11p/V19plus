import { Module } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    JwtModule,
  ],
  controllers: [StreamingController],
  providers: [StreamingService],
  exports: [StreamingService],
})
export class StreamingModule {}
