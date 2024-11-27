import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class DataConsumerService implements OnModuleInit {
  private subscriberClient: Redis;
  private dataClient: Redis;
  private logger: Logger = new Logger(DataConsumerService.name)
  constructor() {
    // Subscriber client for listening to messages
    this.subscriberClient = new Redis({
      host: 'localhost',
      port: 6379,
      name: 'raj'
    });

    // Data client for storing and retrieving messages
    this.dataClient = new Redis({
      host: 'localhost',
      port: 6379,
      name: 'raaj'
    });
  }

  onModuleInit() {
    const channels = ['anime_data'];
    this.logger.log(this.subscriberClient.options.name)
    this.logger.log(this.dataClient.options.name)

    this.subscriberClient.subscribe(...channels, (err, count) => {
      if (err) {
        this.logger.log('Error subscribing to channel:', err.message);
      } else {
        this.logger.debug(`successfully subscribed to channel : ${count}`);
      }
    });

    this.subscriberClient.on('message', async (channel, message) => {
      if (message.includes('Consumer')) return
      if (channel === 'anime_data') {
        this.logger.log('Received new data for anime_data channel.');
        await this.processDataForBatch('anime_data_list', 10);
      }
    });
  }

  async processDataForBatch(listKey: string, batchSIze: number) {
    let isDataLeft = true;
    while (isDataLeft) {
      const batchData = await this.dataClient.lrange(listKey, 0, batchSIze - 1);
      if (batchData.length === 0) {
        isDataLeft = false;
        this.logger.log(
          `All data from  ${listKey} has been process and remove from the list`,
        );
        const channels = ['anime_data'];

        await this.subscriberClient.unsubscribe(...channels)
        const message = 'this is dummy'
        console.log("🚀 ~ DataConsumerService ~ processDataForBatch ~ message:", message)
        await this.subscriberClient.publish('anime_data', `Consumer: ${message}`);
        this.logger.debug("all good");
        break;
      }
      this.logger.log(`Processing batch of ${batchData.length} items:`, batchData);
      for (const data of batchData) {
        const parsedData = JSON.parse(data);
      }
      await this.dataClient.ltrim(listKey, batchSIze, -1);
    }
  }
  async getAllMessages() {
    const messages = await this.dataClient.lrange('message_queue', 0, -1);
    const parsedMessages = messages.map((message) => JSON.parse(message));
    this.logger.log('All messages retrieved from Redis:', parsedMessages);
    return parsedMessages;
  }
}
