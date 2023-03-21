import Base from './base';
import ProviderItemInterface from "../interfaces/providerItem";

export class Ingatlan extends Base {

    filters: string[];

    constructor(filters: string[]) {
        super();

        this.filters = filters;
        this.selector = 'div.listing';
        this.withPages = true;
        this.limit = 20
    }

    getUrl(page: number) {
        let filterMap = {
            pets: 'kisallat-hozhato',
            house: 'haz',
            flat: 'lakas',
            newly: 'uj-epitesu',
            location: 'budapest',
            balcony: '1-m2erkely-felett',
            furnished: 'butorozott',
            condi: 'van-legkondi'
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

        return `https://ingatlan.com/szukites/kiado+${filters.join('+')}?page=${page}`;
    }

    parse(card: any): ProviderItemInterface {
        let href = card.querySelector('.listing__link').getAttribute('href');
        return {
            id: `https://realestatehungary.hu${href}`,
            url: `https://ingatlan.com${href}`,
            price: card.querySelector('div.price').text.trim(),
            address: card.querySelector('div.listing__address').text.trim(),
        };
    }
}