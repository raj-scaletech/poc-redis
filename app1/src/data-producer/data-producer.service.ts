import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class DataProducerService {
    private redisClient: Redis;
    constructor() {
        this.redisClient = new Redis({
            host: 'localhost',
            port: 6379,
        });
    }

    async sendDataToRedis(data: any[], channel: string, listName: string) {
        console.log(`Sending data to ${channel} and storing in ${listName}`);
        for (const row of data) {
            const jsonData = JSON.stringify(row);
            await this.redisClient.lpush(listName, jsonData);
        }
        const isTTLSet = await this.redisClient.expire(listName, 20);
        if (isTTLSet) {
            console.log(`TTL successfully set to 10 seconds for the Redis list: ${listName}`);
        } else {
            console.error(`Failed to set TTL for the Redis list: ${listName}`);
        }
        const message = `${data.length} entries added to ${listName}`;
        await this.redisClient.publish(channel, message);
        console.log(`Published message on ${channel}: ${message}`);
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
        console.log('Excel data read: ', filePath);

        const sheets = ['ANIME', 'MOVIE', 'SERIES'];
        const channels = ['anime_data', 'movie_data', 'series_data'];
        const listNames = [
            'anime_data_list',
            'movie_data_list',
            'series_data_list',
        ];

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
