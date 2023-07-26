import TgBot from "../src/service/tgBot";
import Filters from '../src/dto/filters';

test('Test TgBot filters keyboard', () => {
    let keyboard = (new TgBot()).getFiltersKeyboard('flat', new Filters({
        flat: ["max-500","pets","newly","room-3", "condi", "furnished"],
        house: ["price-150", "max-250", "pets", "condi", "furnished"]
    }));

    let hasBalconyBtn = false;
    for (let row in keyboard) {
        for (let index in keyboard[row]) {
            let button = keyboard[row][index];
            if (hasBalconyBtn === false) {
                hasBalconyBtn = button.text.includes('Balcony');
            }
        }
    }

    expect(keyboard.length).toBe(10);
    expect(hasBalconyBtn).toBe(true);
});

test('Test TgBot exception on wrong environment', () => {
    process.env.IS_OFFLINE = 'true';

    process.env.APP_ENV = 'dev';
    expect(() => new TgBot()).toThrow('Invalid .env file was loaded for offline mode.');

    process.env.APP_ENV = 'offline';
    expect(()=> new TgBot()).not.toThrow('Invalid .env file was loaded for offline mode.')
});