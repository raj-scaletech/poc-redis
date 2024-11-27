import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path'; @Injectable()
export class DataProducerService {
  private redisClient: Redis;
  private publisherClient: Redis;  // Separate Redis client for publishing
  private logger: Logger = new Logger(DataProducerService.name);

  constructor() {
    // Main Redis client for general operations like 'lpush'
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
      name: 'parth'
    });

    // Separate Redis client for publishing messages
    this.publisherClient = new Redis({
      host: 'localhost',
      port: 6379,
      name: 'patil'
    });
  }

  onModuleInit() {
    const channel = ['anime_data'];

    // Subscribe to the channel using the main Redis client
    this.publisherClient.subscribe(...channel, (err, count) => {
      if (err) {
        this.logger.warn('Error subscribing to channel:', err.message);
      } else {
        this.logger.debug(`Successfully subscribed to channel: ${count}`);
      }
    });
  }

  async sendDataToRedis(data: any[], channel: string, listName: string) {
    this.logger.log(`Sending data to ${channel} and storing in ${listName}`);

    // Use the main Redis client for pushing data to the list
    for (const row of data) {
      const jsonData = JSON.stringify(row);
      await this.redisClient.lpush(listName, jsonData);
    }

    await this.redisClient.expire(listName, 20);

    const message = `this is from DataProducerService ${data.length} entries added to ${listName}`;
    await this.redisClient.publish(channel, `Producer: ${message}`);
    this.logger.debug(`Published message on ${channel}: ${message}`);

    this.publisherClient.on('message', async (receivedChannel, message) => {
      if (message.includes('Producer')) return

      if (receivedChannel === channel) {
        console.log("🚀 ~ DataProducerService ~ this.publisherClient.on ~ channel:", channel, message, "=================")
        this.logger.warn("🚀 ~ DataProducerService ~ Received message:", message, '====');
        this.logger.debug('Received from data consumer => =  == += = .');
      }
    });
  }

  private readExcelData(filePath: string) {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    return workbook;
  }

  async syncExcelToRedis() {
    const filePath = path.resolve(__dirname, '../..', 'redis.xlsx');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const workbook = this.readExcelData(filePath);

    const sheets = ['ANIME'];
    const channels = ['anime_data'];
    const listNames = ['anime_data_list'];

    for (let i = 0; i < sheets.length; i++) {
      const sheetName = sheets[i];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      if (jsonData.length > 0) {
        await this.sendDataToRedis(jsonData, channels[i], listNames[i]);
      }
    }
  }
}
