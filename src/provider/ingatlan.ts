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
            balcony: '1-m2erkely-felett',
        };

        let min = null,
            max = null;

        let filters = this.filters.map(
            (filter) => {
                if (filter.includes('-')) {
                    let [name, value] = filter.split('-');
                    switch (name) {
                        case 'price':
                            min = value;
                            return null;
                        case 'max':
                            max = value;
                            return null;
                        case 'room':
                            return `${value}-szoba-felett`;
                    }
                }
                return filterMap[filter] || null;
            })
            .filter(filter => filter !== null);

        if (max && min) {
            filters.push(`havi-${min}-${max}-ezer-Ft`);
        } else if (max) {
            filters.push(`havi-${max}-ezer-Ft-ig`);
        } else if (min) {
            filters.push(`havi-${min}-ezer-Ft-tol`);
        }

        return `https://realestatehungary.hu/szukites/kiado+${filters.join('+')}?page=${page}`;
    }

    parse(card: any) {
        return {
            id: `https://realestatehungary.hu${card.querySelector('.listing__link').getAttribute('href')}`,
            price: card.querySelector('div.price').text.trim(),
            address: card.querySelector('div.listing__address').text.trim(),
        };
    }
}