import ErrorHandler from "../service/errorHandler";

const handler = require('serverless-express/handler');
import app from '../app';

app.get('/link', (req: any, res: any) => {
    return app.tgBot.setWebhook(req)
        .then((result: boolean) => {
            return res.send(`Success: ${result}`);
        }).catch((err: Error) => {
            return ErrorHandler.log(err)
                .then(() => res.status(500).send(`Failed: ${err.message}`));
        });
});

let handle = handler(app);

export {handle}