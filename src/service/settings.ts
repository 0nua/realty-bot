import {ISettings} from "../interfaces/ISettings";
import YaDisk from "./yaDisk";

export default class Settings {

    yaDisk: YaDisk;

    constructor() {
        this.yaDisk = new YaDisk();
    }

    async get(): Promise<ISettings> {
        return this.yaDisk.get('/realty-bot/config.json');
    }

    async update(settings: ISettings): Promise<boolean> {
        if (settings.hasOwnProperty('chatIds')) {
            delete settings['chatIds'];
        }

        return this.yaDisk.update('/realty-bot/config.json', settings);
    }

    async processFilter(chatId: number, type: string, name: string): Promise<ISettings> {
        let settings = await this.get();
        if (settings.hasOwnProperty(chatId) === false) {
            settings[chatId] = {filters: {house: [], flat: []}};
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
            delete settings[chatId];
        }

        if (settings[chatId]?.lastDate) {
            delete settings[chatId].lastDate;
        }

        return settings;
    }

}