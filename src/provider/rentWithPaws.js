const Base = require('./base');

class RentWithPaws extends Base {

    constructor() {
        super();

        this.url = 'https://tappancsosotthon.hu/';
        this.selector = 'div.property-item';
    }

    parse(card) {
        let link = card.querySelector('.property-title > a');

        let date = card.querySelector('.property-date').text;
        if (date.includes('hónap') || date.includes('év')) {
            return null;
        }

        return {
            id: link.getAttribute('href'),
            price: card.querySelector('div.property-price > span').text.trim(),
            address: link.text.trim(),
        };
    }

}

module.exports = RentWithPaws;