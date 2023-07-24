import DynamoDB from "./dynamodb";
import {SettingsServiceInterface, SettingsInterface} from "../interfaces/settings";
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
            converted[item.chatId] = {filters: item.filters};
        }

        return converted;
    }

    async update(settings: SettingsInterface, chatId: number = 0): Promise<boolean> {
        let data = settings[chatId] ?? null;
        if (data === null) {
            return this.dynamoDb.delete('settings', {chatId: chatId});
        }

        return this.dynamoDb.put('settings', {
                chatId: chatId,
                filters: data.filters,
                lastUsage: (new Date()).getTime()
            }
        );
    }

    async getOne(chatId: number): Promise<SettingsInterface> {
        let result = await this.dynamoDb.get('settings', {chatId: chatId}, 'filters');

        if (result.Item) {
            return {
                [chatId]: {
                    filters: result.Item.filters
                }
            };
        }

        return {};
    }

    async processFilter(chatId: number, type: string, name: string): Promise<SettingsInterface> {
        let settings = await this.getOne(chatId);

        if (settings.hasOwnProperty(chatId) === false) {
            settings[chatId] = {filters: {house: [], flat: [], location: Location.BUDAPEST}};
        }

        if (type === 'location') {
            if ((settings[chatId].filters.location ?? Location.BUDAPEST) !== name) {
                settings[chatId].filters = {
                    location: name,
                    flat: [],
                    house: []
                };
            }
            return settings;
        }

        let filters = settings[chatId].filters[type] || [];

        if (name.includes('-')) {
            let [alias, value] = name.split('-');
            filters = filters.filter((item: string) => !item.includes(alias) || item === name);
        }

        if (filters.indexOf(name) === -1) {
            filters.push(name);
        } else {
            filters = filters.filter((item: string) => item !== name);
        }

        settings[chatId].filters[type] = filters;

        let houseFilters = settings[chatId].filters.house;
        let flatFilters = settings[chatId].filters.flat;

        if (houseFilters.length === 0 && flatFilters.length === 0) {
            return {};
        }

        return settings;
    }
}