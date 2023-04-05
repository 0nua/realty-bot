import DynamoDB from "./dynamodb";
import YaDisk from "./yaDisk";
import {IQueue, QueueServiceInterface} from '../interfaces/queue';

export default class Queue implements QueueServiceInterface {
    yaDisk: YaDisk;

    constructor() {
        this.yaDisk = new YaDisk();
    }

    async process(subscribers: string[]): Promise<number> {
        let queue = await this.getActualQueue(subscribers);

        let chatId = await this.getChatId(queue);

        await this.updateQueue(chatId, queue);

        return chatId;
    }

    getQueue(): Promise<IQueue> {
        return this.yaDisk.get('/realty-bot/queue.json');
    }

    updateQueue(chatId: number, queue: IQueue): Promise<boolean> {
        //Update usage
        queue[chatId] = (new Date()).getTime();

        return this.yaDisk.update('/realty-bot/queue.json', queue);
    }

    async getActualQueue(subscribers: string[]): Promise<IQueue> {
        let queue: IQueue = await this.getQueue();

        let toDelete = Object.keys(queue).filter((chatId) => !subscribers.includes(chatId));
        //Delete old chats
        for (let index in toDelete) {
            let chatId = toDelete[index];
            delete queue[chatId];
        }

        //Add new chats
        for (let index in subscribers) {
            let chatId = subscribers[index];
            if (queue.hasOwnProperty(chatId) === false) {
                queue[chatId] = (new Date()).getTime();
            }
        }

        return queue;
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