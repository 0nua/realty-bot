import Base from './base';
import ProviderItemInterface from "../interfaces/providerItem";

export class RentWithPaws extends Base {

    constructor() {
        super();

        this.selector = 'div.property-item';
    }

    parse(card: any): ProviderItemInterface|null {
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

    getUrl(page: number) {
        return 'https://tappancsosotthon.hu/';
    }

}