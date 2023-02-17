export default interface Settings {
    chatIds: number[],

    [id: number]: {
        filters: {
            flat: string[] | null,
            house: string[] | null,
        },
        lastDate: number
    }
}