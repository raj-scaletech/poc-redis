import { Body, Controller, Get, Post } from '@nestjs/common';
import { DataProducerService } from './data-producer.service';

@Controller('data-producer')
export class DataProducerController {
  constructor(private readonly dataProducerService: DataProducerService) { }

  // @Post('send')
  // sendData(@Body() data: any) {
  //     return this.dataProducerService.sendDataToRedis(data)
  // }

  @Get('sync-excel')
  async syncExcelToRedis() {
    await this.dataProducerService.syncExcelToRedis();
    return { message: 'Excel data synced to Redis successfully' };
  }
}
