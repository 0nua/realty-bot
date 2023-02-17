import {Markup, Telegraf} from 'telegraf';
import fs from 'fs';
import YaDisk from './yaDisk';
import Collector from './collector';
import {Settings} from "../interfaces/settings";
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

        let user = array.pop();

        let id = user ? Number.parseInt(user.id) : 0;

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

    getFiltersKeyboard(type: string): any {
        let keyboard = [
            [Markup.button.callback('Only new buildings', `filter-${type}-newly`)],
            [Markup.button.callback('With pets', `filter-${type}-pets`)],
            [Markup.button.callback('Min. 2 rooms', `filter-${type}-room-2`)],
            [Markup.button.callback('Min. 3 rooms', `filter-${type}-room-3`)],
            [Markup.button.callback('Min. 4 rooms', `filter-${type}-room-4`)],
            [Markup.button.callback('Min. 100th Ft/month', `filter-${type}-price-100`)],
            [Markup.button.callback('Min. 300th Ft/month', `filter-${type}-price-300`)],
            [Markup.button.callback('Min. 500th Ft/month', `filter-${type}-price-500`)],
            [Markup.button.callback('Min. 700th Ft/month', `filter-${type}-price-700`)],
        ];

        if (type === 'flat') {
            keyboard.push([Markup.button.callback('With balcony', `filter-${type}-balcony`)]);
        }

        return keyboard;
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

            delete settings[ctx.chat.id];

            await this.yaDisk.update(settings);

            await ctx.reply('Subscribe was rejected! Goodbye!');
        });

        this.bot.action('flat', ctx => {
            ctx.reply(
                'Okay, you need a flat, may be some details?!',
                Markup.inlineKeyboard(this.getFiltersKeyboard('flat'))
            )
        });

        this.bot.action('house', ctx => {
            ctx.reply(
                'Okay, you need a house, may be some details?!',
                Markup.inlineKeyboard(this.getFiltersKeyboard('house'))
            )
        });

        this.bot.action(/filter-(flat|house)-(.+)/, async (ctx: any) => {
            let settings: Settings = await this.yaDisk.get();

            let type = ctx.match[1];
            let name = ctx.match[2];

            if (settings.hasOwnProperty(ctx.chat.id) === false) {
                settings[ctx.chat.id] = {filters: {house: [], flat: []}, lastDate: (new Date()).getTime()};
            }

            let filters = settings[ctx.chat.id].filters[type] || [];

            if (name.includes('room')) {
                filters = filters.filter((item: string) => !item.includes('room'));
            }

            if (name.includes('price')) {
                filters = filters.filter((item: string) => !item.includes('price'));
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
            let filters = settings[ctx.chat.id].filters;

            settings[ctx.chat.id].filters[type] = filters[type].filter((item: string) => item !== name);

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