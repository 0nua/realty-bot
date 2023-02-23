import Queue from "../src/service/queue";

test('Test queue logic', async () => {
    const queue = new Queue();

    jest.spyOn(queue, 'getQueue')
        .mockImplementation(() => new Promise((resolve) => resolve({1: 1, 2: 10, 3: 100})));

    let subscribers = ['2', '4'];
    let actual = await queue.getActualQueue(subscribers);
    let chatId = queue.getChatId(actual);

    expect(Object.keys(actual)).toEqual(subscribers);

    expect(chatId).toBe(2);
});

test('Test queue sorting', async () => {
    let mock = {
        "113301052": 1677185644326,
        "206525893": 1677187444466,
        "317137793": 1677184445043,
        "367825282": 1677188644441,
        "368216450": 1677183845101,
        "412261322": 1677188044538,
        "426044295": 1677185044541,
        "446973724": 1677186844478,
        "504179583": 1677183244604,
        "541317609": 1677186325229,
        "623339899": 1677182644614,
        "679841426": 1677186244655
    };

    const queue = new Queue();

    jest.spyOn(queue, 'getQueue')
        .mockImplementation(() => new Promise((resolve) => resolve(mock)));

    let actual = await queue.getActualQueue(Object.keys(mock));
    let chatId = queue.getChatId(actual);

    expect(chatId).toBe(623339899);
})