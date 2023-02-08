const app = require('../app');

module.exports.handle = async (event) => {
    try {
        let data = await app.tgBot.checkUpdates();
        return {
            statusCode: 200,
            body: JSON.stringify(data.result),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            error: err.message,
        };
    }
};