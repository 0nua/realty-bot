import YaDisk from './yaDisk';
import lodash from 'lodash';
import Base from '../provider/base';
import {Ingatlan} from '../provider/ingatlan';
import {RentWithPaws} from '../provider/rentWithPaws';
import {Alberlet} from '../provider/alberlet';
import ProviderItemInterface from '../interfaces/providerItem';
import CollectorDataInterface from '../interfaces/collectorData';
import {Filters} from "../interfaces/settings";

export default class Collector {

    chatId: number;
    yaDisk: YaDisk;
    providers: Base[]

    constructor(chatId: number, filters: Filters) {
        this.chatId = chatId;
        this.yaDisk = new YaDisk();
        this.providers = [new RentWithPaws()];

        for (let type in filters) {
            let values = [...filters[type]];
            if (values.length === 0) {
                continue;
            }
            values.push(type);
            values.push('location');

            this.providers.push(new Ingatlan(values));
            this.providers.push(new Alberlet(values));
        }
    }

    async getCollection(): Promise<string[]> {
        return this.yaDisk.get(`/realty-bot/collection_${this.chatId}.json`, []);
    }

    async updateCollection(collection: string[]): Promise<boolean> {
        return this.yaDisk.update(`/realty-bot/collection_${this.chatId}.json`, collection);
    }

    async getData(): Promise<CollectorDataInterface> {
        let result = {};
        let promises = [];
        for (let provider of this.providers) {
            let promise = provider.getData().then(data => result = lodash.merge(result, data));
            promises.push(promise);
        }

        await Promise.all(promises);

        let newest: ProviderItemInterface[] = [];
        let collection = await this.getCollection();
        let firstTime = collection.length === 0;

        for (let id in result) {
            if (collection.indexOf(id) !== -1) {
                continue;
            }

            collection.push(id);

            if (firstTime === false) {
                newest.push(result[id]);
            }
        }

        await this.updateCollection(collection);

        return {
            result,
            newest,
        };
    }

    getUrls(): string[] {
        return this.providers.map((provider: Base) => {
            return provider.getUrl(1);
        });
    }
}