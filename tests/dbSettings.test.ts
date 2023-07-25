import Filters from "../src/dto/filters";
import DbSettings from "../src/service/dbSettings";

function getMockWithFilters(filters: Filters) {
    let settings = new DbSettings();
    let mock = {
        1: {
            filters: filters
        }
    }

    jest.spyOn(settings, 'get')
        .mockImplementation(() => new Promise((resolve) => resolve(mock)));

    jest.spyOn(settings, 'getOne')
        .mockImplementation(() => new Promise((resolve) => resolve(mock)));

    return settings;
}

test('Test subscribtion', async () => {
    let settings = new DbSettings();

    let mock = {}

    jest.spyOn(settings, 'get')
        .mockImplementation(() => new Promise((resolve) => resolve(mock)));

    jest.spyOn(settings, 'getOne')
        .mockImplementation(() => new Promise((resolve) => resolve(mock)));

    let updated = await settings.processFilter(1, 'flat', 'pets');

    expect(updated[1].filters.flat).toEqual(['pets']);
})

test('Test add filter', async () => {
    let mock = getMockWithFilters(new Filters({flat: ['newly'], house: []}));
    let updated = await mock.processFilter(1, 'flat', 'pets');

    expect(updated[1].filters.flat).toEqual(['newly', 'pets']);
});

test('Test remove filter', async () => {
    let mock = getMockWithFilters(new Filters({flat: ['pets'], house: ['pets']}));
    let updated = await mock.processFilter(1, 'flat', 'pets');

    expect(updated[1].filters.flat).toEqual([]);
});

test('Test unsubscription', async () => {
    let mock = getMockWithFilters(new Filters({flat: ['pets'], house: []}));
    let updated = await mock.processFilter(1, 'flat', 'pets');

    expect(updated.hasOwnProperty(1)).toBeFalsy();
});

test('Test add/remove one type filter', async () => {
    let mock = getMockWithFilters(new Filters({flat: ['price-100'], house: ['pets']}));
    let updated = await mock.processFilter(1, 'flat', 'price-200');

    expect(updated[1].filters.flat.includes('price-100')).toBeFalsy();
    expect(updated[1].filters.flat.includes('price-200')).toBeTruthy();
});