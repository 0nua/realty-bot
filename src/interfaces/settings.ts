export interface Filters {
    flat: string[],
    house: string[],
}

export interface Settings {
    chatIds: number[],

    [id: number]: {
        filters: Filters,
        lastDate: number
    }
}