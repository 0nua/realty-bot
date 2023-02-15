import RequestWrapper from "../class/requestWrapper";
import axios from 'axios';
import parser from 'node-html-parser';
import crypto from 'crypto';

interface Item {
    id: string,
    price: string,
    address: string
}

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

        do {
            let url = this.getUrl(page);
            let response = await RequestWrapper.request(() => axios.get(url));

            let dom = parser.parse(response.data);
            listings = dom.querySelectorAll(this.selector);

            console.log({url: url, count: listings.length, time: response.time});

            if (listings.length > 0) {
                listings.forEach(card => {
                    let data = this.parse(card);
                    if (data === null) {
                        return;
                    }
                    let key = crypto.createHash('md5').update(data.id).digest('hex');

                    result[key] = data;
                });
                page++;
            }
        } while (this.withPages && listings.length !== 0);

        return result;
    }

    getUrl(page: number): string {
        throw new Error('Not implemented');
    }

    parse(card: any): Item | null {
        throw new Error('Not implemented');
    }

}