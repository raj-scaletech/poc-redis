import { Controller, Get } from '@nestjs/common';
import { DataConsumerService } from './data-consumer.service';
@Controller('data-consumer')
export class DataConsumerController {
  constructor(private readonly dataConsumerService: DataConsumerService) {}
  @Get('messages')
  async getMessages() {
    return await this.dataConsumerService.getAllMessages();
  }
}
