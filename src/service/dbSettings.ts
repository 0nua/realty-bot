import DynamoDB from "./dynamodb";
import {SettingsServiceInterface, SettingsInterface} from "../interfaces/settings";
import Filters from '../dto/filters';
import Location from "../enums/location";

export default class DbSettings implements SettingsServiceInterface {

    dynamoDb: DynamoDB;

    constructor() {
        this.dynamoDb = new DynamoDB();
    }

    async get(chatId: number): Promise<SettingsInterface> {
        if (chatId) {
            return this.getOne(chatId);
        }

        let settings = await this.dynamoDb.scan('settings', 'chatId, filters');

        let converted = {};
        for (let index in settings.Items) {
            let item = settings.Items[index];
            converted[item.chatId] = {filters: new Filters(item.filters)};
        }

        return converted;
    }

    async getFilters(chatId: number): Promise<Filters> {
        let settings = await this.getOne(chatId);

        return new Filters(settings[chatId]?.filters ?? {});
    }

    async update(settings: SettingsInterface, chatId: number = 0): Promise<boolean> {
        let data = settings[chatId] ?? null;
        if (data === null) {
            return this.dynamoDb.delete('settings', {chatId: chatId});
        }

        return this.dynamoDb.put('settings', {
                chatId: chatId,
                filters: Object.assign({}, data.filters),
                lastUsage: (new Date()).getTime()
            }
        );
    }

    async getOne(chatId: number): Promise<SettingsInterface> {
        let result = await this.dynamoDb.get('settings', {chatId: chatId}, 'filters');

        if (result.Item) {
            return {
                [chatId]: {
                    filters: new Filters(result.Item.filters)
                }
            };
        }

        return {};
    }

    async applyFilter(chatId: number, type: string, name: string): Promise<Filters> {
        let filters = await this.getFilters(chatId);
        if (type === 'location') {
            if (filters.location !== name) {
                filters.location = name;
                filters.house = [];
                filters.flat = [];
            }

            return filters;
        }

        let options = filters[type] || [];
        if (name.includes('-')) {
            let [alias, value] = name.split('-');
            options = options.filter((item: string) => !item.includes(alias) || item === name);
        }

        if (options.indexOf(name) === -1) {
            options.push(name);
        } else {
            options = options.filter((item: string) => item !== name);
        }

        filters[type] = options;

        return filters;
    }

    async processFilter(chatId: number, type: string, name: string): Promise<SettingsInterface> {
        let filters = await this.applyFilter(chatId, type, name);
        if (type !== 'location' && filters.isEmpty()) {
            return {};
        }

        return {
            [chatId]: {
                filters: filters
            }
        };
    }
}