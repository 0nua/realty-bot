import YaDisk from './yaDisk';
import lodash from 'lodash';
import Base from '../provider/base';
import { Ingatlan } from '../provider/ingatlan';
import { RentWithPaws } from '../provider/rentWithPaws';
import { Alberlet } from '../provider/alberlet';
import Item from '../interfaces/providerItem';
import Data from '../interfaces/collectorData';
import {Filters} from "../interfaces/settings";

export default class Collector {

    yaDisk: YaDisk;
    providers: Base[]

    constructor(chatId: number, filters: Filters) {
        this.yaDisk = new YaDisk(`/realty-bot/collection_${chatId}.json`);

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

    async getData(): Promise<Data> {
        let result = {};
        let promises = [];
        for (let provider of this.providers) {
            let promise = provider.getData().then(data => result = lodash.merge(result, data));
            promises.push(promise);
        }

        await Promise.all(promises);

        let newest: Item[] = [];
        let collection = await this.yaDisk.get();
        Object.keys(result).forEach(id => {
            if (collection.hasOwnProperty(id)) {
                return;
            }

            newest.push(result[id]);
        });

        //first time start
        if (Object.keys(collection).length === 0) {
            newest = [];
        }

        await this.yaDisk.update(result);

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