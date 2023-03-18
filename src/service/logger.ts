import {Telegraf} from "telegraf";

export default class Logger {

    static telegraf = new Telegraf(process.env.TG_BOT_TOKEN || 'null');

    static async log(error: any) {
        console.error(error);

        let chatId = Number.parseInt(process.env.ADMIN_CHAT_ID ?? '0');

        return Logger.telegraf.telegram.sendMessage(chatId, `Error occured: ${error.message}`);
    }
}