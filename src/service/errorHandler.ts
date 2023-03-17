import app from '../app';
import {Telegram} from 'telegraf';

export default class ErrorHandler {

    static async log(error: any) {
        console.error(error);
        let chatId = Number.parseInt(process.env.ADMIN_CHAT_ID ?? '0');

        return app.tgBot.bot.telegram.sendMessage(chatId, `Error occured: ${error.message}`);
    }
}