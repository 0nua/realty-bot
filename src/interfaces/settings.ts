import YaDisk from "../service/yaDisk";
import DynamoDB from "../service/dynamodb";

export interface Filters {
    location?: string,
    flat: string[],
    house: string[],
}

export interface SettingsInterface {
    [id: number]: {
        filters: Filters,
        lastDate?: number
    }
}

export interface SettingsServiceInterface {
    yaDisk?: YaDisk;
    dynamoDb?: DynamoDB;
    get(chatId?: number): Promise<SettingsInterface>;
    update(settings: SettingsInterface, chatId: number): Promise<boolean>;
    processFilter(chatId: number, type: string, name: string): Promise<SettingsInterface>;
}