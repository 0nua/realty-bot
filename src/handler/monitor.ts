import app from '../app';
import Logger from "../service/logger";

let handle = async (event: any) => {
    try {
        let data = await app.tgBot.checkUpdates();
        return {
            statusCode: 200,
            body: JSON.stringify(data.result),
        };
    } catch (err: any) {
        await Logger.log(err);
        return {
            statusCode: 500,
            error: err.message,
        };
    }
};

export {handle}