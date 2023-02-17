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

        let min = '0', max = '0';

        let filters = this.filters
            .map(
                (filter) => {
                    if (filter.includes('room')) {
                        let [, count] = filter.split('-');
                        return `${count}-szoba-felett`;
                    }
                    if (filter.includes('price')) {
                        min = filter.split('-')[1];
                        return null;
                    }

                    if (filter.includes('max')) {
                        max = filter.split('-')[1];
                        return null;
                    }
                    return filterMap[filter] || null;
                }
            )
            .filter((part => part !== null));

        if (max !== '0' && min !== '0') {
            filters.push(`havi-${min}-${max}-ezer-Ft`);
        } else if (max !== '0') {
            filters.push(`havi-${max}-ezer-Ft-ig`);
        } else if (min !== '0') {
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