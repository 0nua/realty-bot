const axios = require('axios');
const parser = require('node-html-parser');
const crypto = require('crypto');

class Base {

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
            let response = await axios.get(this.getUrl(page));

            let dom = parser.parse(response.data);
            listings = dom.querySelectorAll(this.selector);

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

    getUrl(page) {
        throw new Error('Not implemented');
    }

    parse(card) {
        throw new Error('Not implemented');
    }

}

module.exports = Base;