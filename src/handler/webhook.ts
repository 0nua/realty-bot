import Logger from "../service/logger";

const handler: any = require('serverless-express/handler');
import app from '../app';

app.post('/webhook', (req: any, res: any) => {
    return app.tgBot.process(req)
        .then((result: boolean) => {
            return res.send(`Success: ${result}`);
        }).catch((err: Error) => {
            return Logger.log(err)
                .then(() => res.status(500).send(`Failed: ${err.message}`));
        });
});

let handle = handler(app);

export {handle}