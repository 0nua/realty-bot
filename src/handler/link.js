const handler = require('serverless-express/handler');
const app = require('../app');

app.get('/link', (req, res) => {
    return app.tgBot.setWebhook(req)
        .then((result) => {
            return res.send(`Success: ${result}`);
        }).catch(err => {
            console.error(err);
            return res.status(500)
                .send(`Failed: ${err.message}`);
        });
});

module.exports.handle = handler(app);