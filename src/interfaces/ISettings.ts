export interface Filters {
    flat: string[],
    house: string[],
}

export interface ISettings {
    [id: number]: {
        filters: Filters,
        lastUsage?: number
    }
}