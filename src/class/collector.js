const YaDisk = require('./yaDisk');
const lodash = require('lodash');
const Ingatlan = require('../provider/ingatlan');
const RentWithPaws = require('../provider/rentWithPaws');
const Alberlet = require('../provider/alberlet');

class Collector {
    constructor() {
        this.yaDisk = new YaDisk('/realty-bot/collection.json');

        this.providers = [
            new Ingatlan(['rent', 'house', 'pets', 'location', 'price']),
            new Ingatlan(['rent', 'flat', 'newly', 'balcony', 'pets', 'location', 'price', 'rooms']),
            new Alberlet(['house', 'pets', 'location', 'price']),
            new Alberlet(['flat', 'newly', 'balcony', 'pets', 'location', 'price', 'rooms']),
            new RentWithPaws(),
        ];
    }

    async getData() {
        let result = {};
        let promises = [];
        for (let provider of this.providers) {
            let promise = provider.getData().then(data => result = lodash.merge(result, data));
            promises.push(promise);
        }

        await Promise.all(promises);

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