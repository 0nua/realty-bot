const Base = require('./base');

class Alberlet extends Base {

    constructor(filters) {
        super();

        this.filters = filters;
        this.selector = 'div.advert-data';
        this.withPages = true;
    }

    getUrl(page) {
        let filterMap = {
            pets: 'haziallat-engedelyezve:igen',
            house: 'ingatlan-tipus:haz',
            flat: 'ingatlan-tipus:lakas',
            location: 'megye:budapest',
            rooms: 'szoba:2-4',
            price: 'berleti-dij:0-600-ezer-ft',
            balcony: 'erkely:igen',
            newly: 'ujszeru:igen'
        };

        let filtersUrl = this.filters.map(filter => filterMap[filter] || 'undefined').join('/');
        return `https://en.alberlet.hu/kiado_alberlet/page:${page}/${filtersUrl}`;
    }

    parse(card) {
        return {
            id: `https://en.alberlet.hu/${card.querySelector('> a').getAttribute('href')}`,
            price: card.querySelector('div.col').text.trim(),
            address: card.querySelector('div.address').text.trim().replace('Budapest', ''),
        }
    }

}

module.exports = Alberlet;