import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataConsumerModule } from './data-consumer/data-consumer.module';

@Module({
  imports: [DataConsumerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
