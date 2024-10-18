import { Module } from '@nestjs/common';
import { DataConsumerService } from './data-consumer.service';
import { DataConsumerController } from './data-consumer.controller';

@Module({
  providers: [DataConsumerService],
  controllers: [DataConsumerController]
})
export class DataConsumerModule {}
