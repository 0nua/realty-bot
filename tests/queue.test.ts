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