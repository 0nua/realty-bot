import Base from "./base";
import ProviderItemInterface from "../interfaces/providerItem";

export class Alberlet extends Base {

    filters: string[];

    constructor(filters: string[]) {
        super();

        this.filters = filters;
        this.selector = 'div.advert-data';
        this.withPages = true;
        this.limit = 50;
    }

    getUrl(page: number) {
        let filterMap = {
            pets: 'haziallat-engedelyezve:igen',
            house: 'ingatlan-tipus:haz',
            flat: 'ingatlan-tipus:lakas',
            balcony: 'erkely:igen',
            newly: 'ujszeru:igen',
            furnished: 'berendezes:2',
            condi: 'klima:igen'
        };

        let min = '0',
            max = 'x';

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
                            return `szoba:${value}-x`;
                        case 'location':
                            return `megye:${value}`;
                    }
                }

                return filterMap[filter] || null;
            })
            .filter(filter => filter !== null);

        filters.push(`berleti-dij:${min}-${max}-ezer-ft`);

        return `https://en.alberlet.hu/kiado_alberlet/page:${page}/${filters.join('/')}/limit:${this.limit}`;
    }

    parse(card: any): ProviderItemInterface {
        return {
            id: `https://en.alberlet.hu${card.querySelector('> a').getAttribute('href')}`,
            price: card.querySelector('div.col').text.trim(),
            address: card.querySelector('div.address').text.trim().replace('Budapest', ''),
        }
    }

}