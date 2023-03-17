import tgBot from "./tgBot";

export default class ErrorHandler {

    static async log(error: any) {
        console.error(error);
        let chatId = Number.parseInt(process.env.ADMIN_CHAT_ID ?? '0');

        return tgBot.bot.telegram.sendMessage(chatId, `Error occured: ${error.message}`);
    }
}