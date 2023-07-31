import YaDisk from './yaDisk';
import lodash from 'lodash';
import Base from '../provider/base';
import {Ingatlan} from '../provider/ingatlan';
import {RentWithPaws} from '../provider/rentWithPaws';
import {Alberlet} from '../provider/alberlet';
import ProviderItemInterface from '../interfaces/providerItem';
import CollectorDataInterface from '../interfaces/collectorData';
import Filters from '../dto/filters';
import Logger from './logger';
import Location from "../enums/location";
import Halooglasi from "../provider/serbia/halooglasi";

export default class Collector {

    chatId: number;
    yaDisk: YaDisk;
    providers: Base[]

    constructor(chatId: number, filters: Filters) {
        this.chatId = chatId;
        this.yaDisk = new YaDisk();
        this.providers = [];

        if (RentWithPaws.isApplicable(filters.location)) {
            this.providers.push(new RentWithPaws());
        }

        for (let type in {flat: filters.flat, house: filters.house}) {
            let values = [...filters[type]];
            if (values.length === 0) {
                continue;
            }
            values.push(type);
            values.push(`location-${filters.location}`);

            [
                Ingatlan,
                Alberlet,
                Halooglasi
            ].forEach((Provider) => {
                if (Provider.isApplicable(filters.location) === false) {
                    return;
                }
                this.providers.push(new Provider(values));
            });
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
            let promise = provider.getData()
                .then(data => result = lodash.merge(result, data))
                .catch(async err => Logger.log(err));

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