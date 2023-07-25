import YaDisk from "../service/yaDisk";
import DynamoDB from "../service/dynamodb";
import Filters from '../dto/filters';

export interface FiltersInterface {
    location?: string,
    flat: string[],
    house: string[],
}

export interface SettingsInterface {
    [id: number]: {
        filters: Filters
    }
}

export interface SettingsServiceInterface {
    yaDisk?: YaDisk;
    dynamoDb?: DynamoDB;
    get(chatId?: number): Promise<SettingsInterface>;
    getFilters(chatId: number): Promise<Filters>
    update(settings: SettingsInterface, chatId: number): Promise<boolean>;
    processFilter(chatId: number, type: string, name: string): Promise<SettingsInterface>;
}