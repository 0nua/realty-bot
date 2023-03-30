import Logger from '../service/logger';
import Move from '../service/move';

const handler = require('serverless-express/handler');
import app from '../app';

app.get('/move', async (req: any, res: any) => {
    try {
        let result = await (new Move()).toDynamoDb();

        return res.send(`Success: ${result} rows inserted`);
    } catch (err: any) {
        await Logger.log(err);
        return res.status(500).send(`Failed: ${err.message}`);
    }
});

let handle = handler(app);

export {handle}