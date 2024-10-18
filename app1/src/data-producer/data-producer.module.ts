import { Module } from '@nestjs/common';
import { DataProducerService } from './data-producer.service';
import { DataProducerController } from './data-producer.controller';

@Module({
  providers: [DataProducerService],
  controllers: [DataProducerController]
})
export class DataProducerModule {}
