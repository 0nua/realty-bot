import DbQueue from "../src/service/dbQueue";

test('Test getting oldest chat id from dynamo queue', async () => {
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

    const queue = new DbQueue();

    jest.spyOn(queue, 'getQueue')
        .mockImplementation(() => new Promise((resolve) => resolve(mock)));

    let actual = await queue.getQueue();
    let chatId = queue.getChatId(actual);

    expect(chatId).toBe(623339899);
})