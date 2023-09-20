import Location from "../../enums/location";
import Base from "../base";
import RequestWrapper from "../../service/requestWrapper";
import crypto from "crypto";
import ProviderItemInterface from "../../interfaces/providerItem";

export default class CityExpert extends Base {
    filters: string[];
    cities: {
        [id: number]: string
    };

    constructor(filters: string[]) {
        super();

        this.cities = {
            1: Location.BELGRADE
        };
        this.filters = filters;
        this.withPages = true;
        this.limit = 30;
    }

    async getData() {
        let result = {};
        let page = 1;
        let listings = [];

        do {
            let url = this.getUrl(page);
            let response = await RequestWrapper.request(url, {timeout: this.timeout});
            listings = response.data.result;

            if (listings.length > 0) {
                listings.forEach((item: object) => {
                    let data = this.parse(item);
                    if (data === null) {
                        return;
                    }

                    let key = crypto.createHash('md5').update(data.id).digest('hex');

                    result[key] = data;
                });

            }

            if (this.limit && listings.length !== this.limit) {
                break;
            }

            page++

            await new Promise(resolve => setTimeout(resolve, 0.1 * 1000)); //sleep 0.1 sec

        } while (this.withPages && page < 20);

        return result;
    }

    getUrl(page: number, humanLink: boolean = false): string {
        let filterMap = {
            pets: {petsArray: [1, 2]},
            house: {ptId: [2]},
            flat: {ptId: [1]},
            balcony: {otherArray: ['adpTerrace']},
            newly: {yearOfConstruction: [4, 5]},
            furnished: {furnished: [1]},
            condi: {furnishingArray: ['furAircon']}
        };

        let filters = {};

        this.filters.map(
            (filter) => {
                if (filter.includes('-')) {
                    let [name, value] = filter.split('-');
                    switch (name) {
                        case 'price':
                            filters['minPrice'] = value;
                            return;
                        case 'max':
                            filters['maxPrice'] = value;
                            return;
                        case 'room':
                            filters['structure'] = [`${value}.0`];
                            return;
                        case 'location':
                            filters['cityId'] = this.getCityIdByName(value);
                            return;
                    }
                }

                filters = {...filters, ...filterMap[filter]};
            });

        if (humanLink) {
            let converted = [];
            let city = null;
            for (let name in filters) {
                let value = filters[name];
                if (Array.isArray(value)) {
                    value = value.join(',');
                }

                if (name === 'cityId') {
                    city = this.getCityById(filters['cityId']);
                    continue;
                }
                converted.push(`${name}=${value}`);
            }
            return `https://cityexpert.rs/en/properties-for-rent/${city}?${converted.join('&')}`;
        }

        filters = {
            ...filters,
            ...{
                rentOrSale: "r",
                searchSource: "regular",
                sort: "datedsc",
                currentPage: page
            }
        }

        return `https://cityexpert.rs/api/Search?req=${JSON.stringify(filters)}`;
    }

    parse(card: any): ProviderItemInterface {
        let types = {
            1: 'apartment',
            2: 'house'
        };

        let url = `${card.propId}/${card.structure.replace('.', '')}-rooms-${types[card.ptId]}-${card.street.replace(' ', '-')}-${card.municipality}`

        return {
            id: `https://cityexpert.rs/en/properties-for-rent/${this.getCityById(card.cityId)}/${url}`,
            price: `${card.price}€`,
            address: `${card.street}, ${card.municipality}`,
        }
    }

    static isApplicable(location: string): boolean {
        return location === Location.BELGRADE;
    }

    getCityById(id: number): string | null {
        return this.cities[id] ?? null;
    }

    getCityIdByName(name: string): number | null {
        for (let id in this.cities) {
            let city = this.cities[id];
            if (name === city) {
                return Number.parseInt(id);
            }
        }

        return null;
    }
}