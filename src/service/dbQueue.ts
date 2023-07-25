import DynamoDB from "./dynamodb";
import {IQueue, QueueServiceInterface} from '../interfaces/queue';

export default class DbQueue implements QueueServiceInterface {

    dynamoDb: DynamoDB;

    constructor() {
        this.dynamoDb = new DynamoDB();
    }

    async process(): Promise<number> {
        let queue = await this.getQueue();

        let chatId = await this.getChatId(queue);

        await this.updateQueue(chatId);

        return chatId;
    }

    async updateQueue(chatId: number): Promise<boolean> {
        return this.dynamoDb.update(
            'settings',
            {chatId: chatId},
            {
                lastUsage: (new Date()).getTime()
            }
        );
    }

    async getQueue(): Promise<IQueue> {
        let queue = await this.dynamoDb.scan('settings', 'chatId, lastUsage');

        let converted = {};
        for (let index in queue.Items) {
            let item = queue.Items[index];
            converted[item.chatId] = item.lastUsage;
        }

        return converted;
    }

    getChatId(queue: object): number {
        let id: number = 0;
        let tempUsage: number = 0;
        for (let chatId in queue) {
            let lastUsage = queue[chatId];
            if (tempUsage === 0 || lastUsage <= tempUsage) {
                tempUsage = lastUsage;
                id = Number.parseInt(chatId);
            }
        }

        if (id === 0) {
            throw new Error('Chat id not found');
        }

        return id;
    }
}