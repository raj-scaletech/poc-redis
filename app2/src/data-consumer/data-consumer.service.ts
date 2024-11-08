import { Injectable, OnModuleInit } from '@nestjs/common';
import { log } from 'console';
import { Redis } from 'ioredis';

@Injectable()
export class DataConsumerService implements OnModuleInit {
  private subscriberClient: Redis;
  private dataClient: Redis;

  constructor() {
    // Subscriber client for listening to messages
    this.subscriberClient = new Redis({
      host: 'localhost',
      port: 6379,
    });

    // Data client for storing and retrieving messages
    this.dataClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  onModuleInit() {
    const channels = ['anime_data', 'movie_data'];

    this.subscriberClient.subscribe(...channels, (err, count) => {
      if (err) {
        console.log('Error subscribing to channel:', err.message);
      } else {
        console.log(`successfully subscribed to channel : ${count}`);
      }
    });

    this.subscriberClient.on('message', async (channel) => {
      if (channel === 'anime_data') {
        console.log('Received new data for anime_data channel.');
        await this.processDataForBatch('anime_data_list', 10);
      } else if (channel === 'movie_data') {
        console.log('Received new data for movie_data channel.');
        await this.processDataForBatch('movie_data_list', 10);
      } else if (channel === 'series_data') {
        console.log('Received new data for series_data channel.');
        await this.processDataForBatch('series_data_list', 10);
      }
    });
  }

  async processDataForBatch(listKey: string, batchSIze: number) {
    let isDataLeft = true;
    while (isDataLeft) {
      const batchData = await this.dataClient.lrange(listKey, 0, batchSIze - 1);
      if (batchData.length === 0) {
        isDataLeft = false;
        console.log(
          `All data from  ${listKey} has been process and remove from the list`,
        );
        break;
      }
      console.log(`Processing batch of ${batchData.length} items:`, batchData);
      for (const data of batchData) {
        const parsedData = JSON.parse(data);
        console.log(`Process item from ${listKey}`, parsedData);
      }
      await this.dataClient.ltrim(listKey, batchSIze, -1);
      console.log(`Batch of ${batchData.length} items removed from the list.`);
    }
  }
  async getAllMessages() {
    const messages = await this.dataClient.lrange('message_queue', 0, -1);
    const parsedMessages = messages.map((message) => JSON.parse(message));
    console.log('All messages retrieved from Redis:', parsedMessages);
    return parsedMessages;
  }
}
