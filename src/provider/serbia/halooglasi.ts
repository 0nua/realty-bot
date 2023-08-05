import Base from "../base";
import Location from "../../enums/location";
import ProviderItemInterface from "../../interfaces/providerItem";

export default class Halooglasi extends Base {
    filters: string[];

    constructor(filters: string[]) {
        super();

        this.filters = filters;
        this.selector = '.product-item.real-estates';
        this.withPages = true;
        this.limit = 20;
    }

    getUrl(page: number) {
        let filterMap = {
            pets: 'dodatno_id_ls=12000009',
            newly: 'tip_objekta_id_l=387235',
            furnished: 'namestenost_id_l=562',
            condi: 'ostalo_id_ls=12100002',
        };

        let location = null;
        let type = null;

        let filters = this.filters.map(
            (filter) => {
                if (filter.includes('-')) {
                    let [name, value] = filter.split('-');
                    switch (name) {
                        case 'price':
                            return `cena_d_from=${value}`;
                        case 'max':
                            return `cena_d_to=${value}`;
                        case 'room':
                            return `broj_soba_order_i_from=${value}`;
                    }
                }

                if (['flat', 'house'].includes(filter)) {
                    type = filter === 'flat' ? 'izdavanje-stanova' : 'izdavanje-kuca';
                    return null;
                }

                if (filter.includes('location')) {
                    location = 'beograd';
                    return null;
                }

                return filterMap[filter] || null;
            })
            .filter(filter => filter !== null);

        return `https://www.halooglasi.com/nekretnine/${type}/${location}?${filters.join('&')}&page=${page}`;
    }

    parse(card: any): ProviderItemInterface {
        let address = card.querySelectorAll('.subtitle-places > li').map((item: any) => item.text.trim());
        return {
            id: `https://www.halooglasi.com${card.querySelector('.product-title > a').getAttribute('href')}`,
            price: card.querySelector('.central-feature i').text.trim(),
            address: address.join(', '),
        }
    }

    static isApplicable(location: string): boolean {
        return location === Location.BELGRADE;
    }
}