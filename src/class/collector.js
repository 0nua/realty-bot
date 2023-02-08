const YaDisk = require('./yaDisk');
const lodash = require('lodash');
const Ingatlan = require('../provider/ingatlan');
const RentWithPaws = require('../provider/rentWithPaws');

class Collector {
    constructor() {
        this.yaDisk = new YaDisk('/realty-bot/collection.json');

        this.providers = [
            new Ingatlan(['rent', 'house', 'pets', 'location', 'price']),
            new Ingatlan(['rent', 'flat', 'newly', 'balcony', 'pets', 'location', 'price', 'rooms']),
            new RentWithPaws(),
        ];
    }

    async getData() {
        let result = {};
        for (let provider of this.providers) {
            result = lodash.merge(result, await provider.getData());
        }

        let newest = [];
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
}

module.exports = Collector;