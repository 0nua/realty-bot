import Settings from './settings';
import Queue from './queue';
import DynamoDB from './dynamodb';

export default class Move {
    settings: Settings;
    queue: Queue;
    dynamoDb: DynamoDB;

    constructor() {
        this.settings = new Settings();
        this.queue = new Queue();
        this.dynamoDb = new DynamoDB();
    }

    async toDynamoDb(): Promise<number> {
        let settings = await this.settings.get();
        let queue = await this.queue.getQueue();

        for (let chatId in settings) {
            let item = settings[chatId];

            let insert = {
                chatId: Number.parseInt(chatId),
                filters: item.filters,
                lastUsage: queue[chatId] || (new Date()).getTime()
            };

            await this.dynamoDb.put('settings', insert);
        }

        return Object.keys(settings).length;
    }

}