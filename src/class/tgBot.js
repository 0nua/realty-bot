const { Markup, Telegraf } = require('telegraf');
const fs = require('fs');
const YaDisk = require('./yaDisk');
const Collector = require('./collector');

class TgBot {
    constructor() {
        this.yaDisk = new YaDisk('realty-bot/config.json');
        this.collector = new Collector();
        this.bot = new Telegraf(process.env.TG_BOT_TOKEN || null);
        this.init();
    }

    async process(req) {
        return await this.bot.handleUpdate(req.body);
    }

    setWebhook(req) {
        let event = req.apiGateway.event;
        let link = `https://${event.requestContext.domainName}/dev/webhook`;
        return this.bot.telegram.setWebhook(link);
    }

    async checkUpdates() {
        let settings = await this.yaDisk.get();
        let data = await this.collector.getData();
        if (!settings.chatIds || settings.chatIds.length === 0) {
            return data;
        }

        for (let chatId of settings.chatIds) {
            if (data.newest.length !== 0) {
                for (let item of data.newest) {
                    await this.bot.telegram.sendMessage(chatId, `${item.price}, ${item.address}, ${item.id}`);
                }
            } else if (chatId === 367825282) {
                await this.bot.telegram.sendMessage(
                    chatId,
                    `There are ${Object.keys(data.result).length} items in the storage.`,
                );
            }
        }
        return data;
    }

    init() {
        this.bot.start(async ctx => {
            await this.yaDisk.update({ chatIds: [ctx.chat.id] }, true);
            await ctx.reply('Nice to meet you! Enjoy!');
        });

        this.bot.help(async ctx => {
            let settings = await this.yaDisk.get();
            await ctx.reply(`Keep calm and relax! Your chat id ${ctx.chat.id}. Settings: ${JSON.stringify(settings)}`);
        });

        this.bot.catch((err, ctx) => {
            console.log(err);
            ctx.reply(`Something went wrong. Try again. Error: ${err.message}`);
        });
    }
}

module.exports = TgBot;