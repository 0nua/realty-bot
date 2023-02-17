import RequestWrapper from "../service/requestWrapper";
import axios from 'axios';
import parser from 'node-html-parser';
import crypto from 'crypto';
import Item from '../interfaces/providerItem'

export default class Base {

    url: string;
    selector: string;
    withPages: boolean;

    constructor() {
        this.url = '';
        this.selector = '';
        this.withPages = false;
    }

    async getData() {
        let result = {};
        let page = 1;
        let listings = [];
        let log = [];

        do {
            let url = this.getUrl(page);
            let response = await RequestWrapper.request(() => axios.get(url));

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
            page++
        } while (this.withPages && listings.length !== 0);

        console.log(log);

        return result;
    }

    getUrl(page: number): string {
        throw new Error('Not implemented');
    }

    parse(card: any): Item | null {
        throw new Error('Not implemented');
    }

}