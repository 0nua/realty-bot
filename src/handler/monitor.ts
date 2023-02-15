import app from '../app';

let handle = async (event: any) => {
    try {
        let data = await app.tgBot.checkUpdates();
        return {
            statusCode: 200,
            body: JSON.stringify(data.result),
        };
    } catch (err: any) {
        console.error(err);
        return {
            statusCode: 500,
            error: err.message,
        };
    }
};

export {handle}