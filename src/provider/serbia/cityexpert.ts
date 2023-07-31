import Base from "../base";
import ProviderItemInterface from "../../interfaces/providerItem";
import Location from "../../enums/location";

export default class CityExpert extends Base {
    filters: string[];

    constructor(filters: string[]) {
        super();

        this.filters = filters;
        this.selector = '.property-card';
        this.withPages = true;
    }

    getUrl(page: number) {
        let filterMap = {
            pets: 'petsArray=2,1',
            house: 'ptId=2',
            flat: 'ptId=1',
            balcony: 'otherArray=adpTerrace',
            newly: 'yearOfConstruction=4,5',
            furnished: 'furnished=1',
            condi: 'furnishingArray=furAircon'
        };

        let location = null;
        let filters = this.filters.map(
            (filter) => {
                if (filter.includes('-')) {
                    let [name, value] = filter.split('-');
                    switch (name) {
                        case 'price':
                            return `minPrice=${value}`;
                        case 'max':
                            return `maxPrice=${value}`;
                        case 'room':
                            return `structure=${value}.0`;
                        case 'location':
                            location = value;
                            return null;
                    }
                }

                return filterMap[filter] || null;
            })
            .filter(filter => filter !== null);

        return `https://cityexpert.rs/en/properties-for-rent/${location}?${filters.join('&')}&currentPage=${page}`;
    }

    parse(card: any): ProviderItemInterface {
        return {
            id: card.querySelector('> a').getAttribute('href'),
            price: card.querySelector('.property-card__price-value').text.trim(),
            address: card.querySelector('.property-card__place').text.trim(),
        }
    }

    static isApplicable(location: string): boolean {
        return location === Location.BELGRADE;
    }
}