import RequestWrapper from "../service/requestWrapper";
import axios from 'axios';
import parser from 'node-html-parser';
import crypto from 'crypto';
import ProviderItemInterface from '../interfaces/providerItem'

export default class Base {

    url: string;
    selector: string;
    withPages: boolean;
    limit: number | null;

    constructor() {
        this.url = '';
        this.selector = '';
        this.withPages = false;
        this.limit = null;
    }

    async getData() {
        let result = {};
        let page = 1;
        let listings = [];
        let log = [];

        do {
            let url = this.getUrl(page);
            let response = await RequestWrapper.request((params: object) => axios.get(url, params));

            let dom = parser.parse(response.data);
            listings = dom.querySelectorAll(this.selector);

            log.push({url: url, count: listings.length, time: response.time});

            if (listings.length > 0) {
                for (let index = 0; index < listings.length; index++) {
                    let data = this.parse(listings[index]);
                    if (data === null) {
                        continue;
                    }

                    let key = crypto.createHash('md5').update(data.id).digest('hex');

                    result[key] = data;
                }
            }

            if (this.limit && listings.length !== this.limit) {
                break;
            }

            page++

            await new Promise(resolve => setTimeout(resolve, 0.1 * 1000)); //sleep 0.1 sec

        } while (this.withPages && page < 20);

        return result;
    }

    getUrl(page: number): string {
        throw new Error('Not implemented');
    }

    parse(card: any): ProviderItemInterface | null {
        throw new Error('Not implemented');
    }

}