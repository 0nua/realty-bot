import {FiltersInterface as FiltersInterface} from '../interfaces/settings';
import Location from "../enums/location";

export default class Filters implements FiltersInterface {
    public flat: string[] = [];
    public house: string[] = [];
    public location: string = Location.BUDAPEST;

    constructor(filters?: FiltersInterface) {
        if (filters) {
            this.flat = filters.flat ?? [];
            this.house = filters.house ?? [];
            this.location = filters.location ?? Location.BUDAPEST;
        }
    }
}