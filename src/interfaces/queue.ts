import DynamoDB from "../service/dynamodb";
import YaDisk from "../service/yaDisk";

export interface IQueue {
    [chatId: string]: number
}

export interface QueueServiceInterface {
    yaDisk?: YaDisk;
    dynamoDb?: DynamoDB;
    process(subscribers?: string[]): Promise<number>;
    getQueue(): Promise<IQueue>
    updateQueue(chatId: number, queue: IQueue): Promise<boolean>;
    getActualQueue?(subscribers: string[]): Promise<IQueue>;
    getChatId(queue: object): number;
}