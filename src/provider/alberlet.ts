import Base from "./base";

export class Alberlet extends Base {

    filters: string[];

    constructor(filters: string[]) {
        super();

        this.filters = filters;
        this.selector = 'div.advert-data';
        this.withPages = true;
    }

    getUrl(page: number) {
        let filterMap = {
            pets: 'haziallat-engedelyezve:igen',
            house: 'ingatlan-tipus:haz',
            flat: 'ingatlan-tipus:lakas',
            location: 'megye:budapest',
            balcony: 'erkely:igen',
            newly: 'ujszeru:igen'
        };

        let filtersUrl = this.filters.map(
            (filter) => {
                if (filter.includes('room')) {
                    let [, count] = filter.split('-');
                    return `szoba:${count}-x`;
                }
                if (filter.includes('price')) {
                    let [, price] = filter.split('-');
                    return `berleti-dij:${price}-x-ezer-ft`;
                }
                return filterMap[filter] || 'undefined';
            }
        ).join('/');
        return `https://en.alberlet.hu/kiado_alberlet/page:${page}/${filtersUrl}`;
    }

    parse(card: any) {
        return {
            id: `https://en.alberlet.hu${card.querySelector('> a').getAttribute('href')}`,
            price: card.querySelector('div.col').text.trim(),
            address: card.querySelector('div.address').text.trim().replace('Budapest', ''),
        }
    }

}