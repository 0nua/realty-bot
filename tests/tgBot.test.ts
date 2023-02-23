import TgBot from "../src/service/tgBot";

test('TgBot filters keyboard', () => {
    let keyboard = (new TgBot()).getFiltersKeyboard('flat', {
        flat: ["max-500","pets","newly","room-3", "condi", "furnished"],
        house: ["price-150", "max-250", "pets", "condi", "furnished"]
    });

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