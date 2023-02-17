export interface Filters {
    flat: string[] | null,
    house: string[] | null,
}

export interface Settings {
    chatIds: number[],

    [id: number]: {
        filters: Filters,
        lastDate: number
    }
}