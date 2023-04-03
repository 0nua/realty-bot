import DynamoDB from "./dynamodb";
import Queue from "./queue";
import {IQueue} from '../interfaces/queue';

export default class DbQueue extends Queue {

    dynamoDb: DynamoDB;

    constructor() {
        super();
        this.dynamoDb = new DynamoDB();
    }

    async updateQueue(chatId: number): Promise<boolean> {
        return this.dynamoDb.update(
            'settings',
            {chatId: chatId},
            `SET lastUsage = :lastUsage`,
            {':lastUsage': (new Date()).getTime()}
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

    async getActualQueue(): Promise<IQueue> {
        return this.getQueue();
    }
}