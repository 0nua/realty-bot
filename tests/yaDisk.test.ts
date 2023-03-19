import YaDisk from "../src/service/yaDisk";

test('Test dev environment path', () => {
    process.env.APP_ENV = 'test';

    let envPath = (new YaDisk()).getEnvPath('/realty-bot/test.json');

    expect(envPath).toBe('/realty-bot-test/test.json');
});

test('Test prod environment path', () => {
    process.env.APP_ENV = 'dev';

    let envPath = (new YaDisk()).getEnvPath('/realty-bot/test.json');

    expect(envPath).toBe('/realty-bot/test.json');
});