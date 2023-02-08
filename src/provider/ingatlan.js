const Base = require('./base');

class Ingatlan extends Base {

    constructor(filters) {
        super();

        this.url = this.getUrlWithFilters(filters);
        this.selector = 'div.listing';
        this.withPages = true;
    }

    getUrlWithFilters(filters) {
        let filterMap = {
            pets: 'kisallat-hozhato',
            house: 'haz',
            flat: 'lakas',
            rent: 'kiado',
            newly: 'uj-epitesu',
            location: 'budapest',
            rooms: '2-szoba-felett',
            price: 'havi-600-ezer-Ft-ig',
            balcony: '1-m2erkely-felett',
        };

        return `https://realestatehungary.hu/szukites/${filters.map(filter => filterMap[filter] || 'undefined').join('+')}`;
    }

    parse(card) {
        return {
            id: `https://realestatehungary.hu${card.querySelector('.listing__link').getAttribute('href')}`,
            price: card.querySelector('div.price').text.trim(),
            address: card.querySelector('div.listing__address').text.trim(),
        };
    }
}

module.exports = Ingatlan;