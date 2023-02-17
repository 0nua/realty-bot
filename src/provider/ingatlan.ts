import Base from './base';

export class Ingatlan extends Base {

    filters: string[];

    constructor(filters: string[]) {
        super();

        this.filters = filters;
        this.selector = 'div.listing';
        this.withPages = true;
    }

    getUrl(page: number) {
        let filterMap = {
            pets: 'kisallat-hozhato',
            house: 'haz',
            flat: 'lakas',
            newly: 'uj-epitesu',
            location: 'budapest',
            room: 'szoba-felett',
            price: 'havi-600-ezer-Ft-ig',
            balcony: '1-m2erkely-felett',
        };

        let filtersUrl = this.filters.map(
            (filter) => {
                if (filter.includes('room')) {
                    let [, count] = filter.split('-');
                    return `${count}-${filterMap.room}`;
                }
                return filterMap[filter] || 'undefined';
            }
        ).join('+');
        return `https://realestatehungary.hu/szukites/kiado+${filtersUrl}?page=${page}`;
    }

    parse(card: any) {
        return {
            id: `https://realestatehungary.hu${card.querySelector('.listing__link').getAttribute('href')}`,
            price: card.querySelector('div.price').text.trim(),
            address: card.querySelector('div.listing__address').text.trim(),
        };
    }
}