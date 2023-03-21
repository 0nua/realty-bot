import {Telegraf} from "telegraf";

export default class Logger {

    static telegraf = new Telegraf(process.env.TG_BOT_TOKEN || 'null');
    static chatId = Number.parseInt(process.env.ADMIN_CHAT_ID ?? '0');

    static async log(error: any): Promise<void> {
        console.error(error);
        if (Logger.chatId) {
            await Logger.telegraf.telegram.sendMessage(Logger.chatId, `Error occurred: ${error.message}`);
        }
    }
}