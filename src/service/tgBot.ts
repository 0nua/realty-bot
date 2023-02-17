import {Markup, Telegraf} from 'telegraf';
import fs from 'fs';
import YaDisk from './yaDisk';
import Collector from './collector';
import Settings from "../interfaces/settings";
import Data from "../interfaces/collectorData";

export default class TgBot {
    bot: Telegraf;
    yaDisk: YaDisk;

    constructor() {
        this.yaDisk = new YaDisk('realty-bot/config.json');
        this.bot = new Telegraf(process.env.TG_BOT_TOKEN || 'null');
        this.init();
    }

    /**
     * Process bot mesages
     * @param req
     */
    async process(req: any): Promise<any> {
        return await this.bot.handleUpdate(req.body);
    }

    /**
     * Set webhook
     * @param req
     */
    setWebhook(req: any): Promise<boolean> {
        let event = req.apiGateway.event;
        let link = `https://${event.requestContext.domainName}/dev/webhook`;
        return this.bot.telegram.setWebhook(link);
    }

    async getChatId(settings: Settings): Promise<number> {
        let array = [];
        for (let userId in settings) {
            if (userId === 'chatIds') {
                continue;
            }

            let data = settings[userId];

            array.push(
                {
                    id: userId,
                    lastDate: data.lastDate
                }
            );
        }

        let neverUsed = array.filter((item) => item.lastDate === undefined);
        if (neverUsed.length > 0) {
            array = neverUsed;
        } else {
            array.sort((a: any, b: any) => {
                if (a.lastDate > b.lastDate) {
                    return -1;
                }

                return a.lastDate < b.lastDate ? 1 : 0;
            });
        }

        console.log(array);

        let user = array.pop();

        let id = user ? Number.parseInt(user.id) : 0;

        console.log(id);

        await this.yaDisk.update(
            {
                [id]: {lastDate: (new Date()).getTime()}
            },
            true
        )

        return id;
    }

    async checkUpdates(): Promise<any> {
        let settings: Settings = await this.yaDisk.get();

        let chatId = await this.getChatId(settings);

        let collector = new Collector(chatId, settings[chatId].filters);
        let data = await collector.getData();
        if (data.newest.length !== 0) {
            for (let item of data.newest) {
                //await this.bot.telegram.sendMessage(chatId, `${item.price}, ${item.address}, ${item.id}`);
            }
        }

        await this.bot.telegram.sendMessage(
            367825282,
            `For ${chatId} there are ${Object.keys(data.result).length} items. ${data.newest.length} new elements found`,
        );

        return data;
    }

    async getFilters(ctx: any, settings: Settings | null = null) {
        if (settings === null) {
            settings = await this.yaDisk.get();
        }

        let filters = settings && settings[ctx.chat.id].filters || {};

        let keyboard = [];
        for (let type in filters) {
            for (let index in filters[type]) {
                let item = filters[type][index];
                keyboard.push(
                    [Markup.button.callback(`${type}: ${item}`, `delete-${type}-${item}`)]
                );
            }
        }

        if (keyboard.length === 0) {
            await ctx.reply('Uh-oh. I could not find any filters');
            return;
        }

        await ctx.reply('This is your filters, click if would like to remove any', Markup.inlineKeyboard(keyboard));
    }

    init(): void {
        this.bot.command(['start', 'configure'], async ctx => {
            await ctx.reply(
                'What kind of realty would you rent?',
                Markup.inlineKeyboard(
                    [
                        Markup.button.callback('Apartments', `flat`),
                        Markup.button.callback('House', `house`),
                    ]
                )
            );
        });

        this.bot.command('stop', async ctx => {
            let settings: Settings = await this.yaDisk.get();
            settings.chatIds = settings.chatIds.filter((id: number) => id !== ctx.chat.id);
            await this.yaDisk.update(settings);
            await ctx.reply('Goodbye!');
        });

        this.bot.action('flat', ctx => {
            ctx.reply(
                'Okay, you need a flat, may be some details?!',
                Markup.inlineKeyboard(
                    [
                        [Markup.button.callback('Only new buildings', 'filter-flat-newly')],
                        [Markup.button.callback('With balcony', 'filter-flat-balcony')],
                        [Markup.button.callback('With pets', 'filter-flat-pets')],
                        [Markup.button.callback('Min. 2 rooms', 'filter-flat-room-2')],
                        [Markup.button.callback('Min. 3 rooms', 'filter-flat-room-3')],
                        [Markup.button.callback('Min. 4 rooms', 'filter-flat-room-4')],
                    ]
                )
            )
        });

        this.bot.action('house', ctx => {
            ctx.reply(
                'Okay, you need a house, may be some details?!',
                Markup.inlineKeyboard(
                    [
                        [Markup.button.callback('Only new buildings', 'filter-house-newly')],
                        [Markup.button.callback('With pets', 'filter-house-pets')],
                        [Markup.button.callback('Min. 2 rooms', 'filter-house-room-2')],
                        [Markup.button.callback('Min. 3 rooms', 'filter-house-room-3')],
                        [Markup.button.callback('Min. 4 rooms', 'filter-house-room-4')],
                    ]
                )
            )
        });

        this.bot.action(/filter-(flat|house)-(.+)/, async (ctx: any) => {
            let settings: Settings = await this.yaDisk.get();

            let type = ctx.match[1];
            let name = ctx.match[2];
            let filters = settings[ctx.chat.id].filters[type] || {};

            if (name.includes('room')) {
                filters = filters.filter((item: string) => !item.includes('room'));
            }

            filters.push(name);

            settings[ctx.chat.id].filters[type] = filters;

            await this.yaDisk.update(settings);

            await ctx.reply(`Filter ${type} ${name} was added`);
            await this.getFilters(ctx, settings);
        });

        this.bot.command('filters', async ctx => {
            await this.getFilters(ctx);
        });

        this.bot.action(/delete-(flat|house)-(.+)/, async (ctx: any) => {
            let settings: Settings = await this.yaDisk.get();
            let type = ctx.match[1];
            let name = ctx.match[2];

            settings[ctx.chat.id].filters[type] = settings[ctx.chat.id].filters[type].filter((item: string) => item !== name);

            await this.yaDisk.update(settings);

            await ctx.reply(`Filter ${type} ${name} was deleted`);
            await this.getFilters(ctx, settings);
        });

        this.bot.help(async ctx => {
            let settings: Settings = await this.yaDisk.get();
            await ctx.reply(`Keep calm and relax! Your chat id ${ctx.chat.id}. Settings: ${JSON.stringify(settings)}`);
        });

        this.bot.catch((err: any, ctx: any) => {
            console.log(err);
            ctx.reply(`Something went wrong. Try again. Error: ${err.message}`);
        });
    }
}