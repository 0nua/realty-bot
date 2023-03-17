import app from '../app';
import tgBot from '../service/tgBot';
import ErrorHandler from "../service/errorHandler";
const handler = require('serverless-express/handler');

app.get('/link', (req: any, res: any) => {
    return tgBot.setWebhook(req)
        .then((result: boolean) => {
            return res.send(`Success: ${result}`);
        }).catch((err: Error) => {
            return ErrorHandler.log(err)
                .then(() => res.status(500).send(`Failed: ${err.message}`));
        });
});

let handle = handler(app);

export {handle}