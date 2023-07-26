import RequestWrapper from "../service/requestWrapper";
import parser from 'node-html-parser';
import crypto from 'crypto';
import ProviderItemInterface from '../interfaces/providerItem'
import Location from "../enums/location";

export default class Base {

    url: string;
    selector: string;
    withPages: boolean;
    limit: number | null;
    timeout: number;

    constructor() {
        this.url = '';
        this.selector = '';
        this.withPages = false;
        this.limit = null;
        this.timeout = 10 * 1000; // in ms
    }

    async getData() {
        let result = {};
        let page = 1;
        let listings = [];
        let log = [];

        do {
            let url = this.getUrl(page);
            let response = await RequestWrapper.request(url, {timeout: this.timeout});

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

    static isApplicable(location: string): boolean {
        return location === Location.BUDAPEST;
    }

    getUrl(page: number): string {
        throw new Error('Not implemented');
    }

    parse(card: any): ProviderItemInterface | null {
        throw new Error('Not implemented');
    }

}