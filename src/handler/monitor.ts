import app from '../app';
import ErrorHandler from "../service/errorHandler";

let handle = async (event: any) => {
    try {
        let data = await app.tgBot.checkUpdates();
        return {
            statusCode: 200,
            body: JSON.stringify(data.result),
        };
    } catch (err: any) {
        await ErrorHandler.log(err);
        return {
            statusCode: 500,
            error: err.message,
        };
    }
};

export {handle}