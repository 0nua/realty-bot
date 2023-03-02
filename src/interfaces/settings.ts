export interface Filters {
    flat: string[],
    house: string[],
}

export interface SettingsInterface {
    [id: number]: {
        filters: Filters,
        lastDate?: number
    }
}