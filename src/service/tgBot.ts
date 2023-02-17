import {Markup, Telegraf} from 'telegraf';
import fs from 'fs';
import YaDisk from './yaDisk';
import Collector from './collector';
import {Filters, Settings} from "../interfaces/settings";
import Data from "../interfaces/collectorData";
import {set} from "lodash";
import {keyboard} from "telegraf/typings/markup";

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
                await this.bot.telegram.sendMessage(chatId, `${item.price}, ${item.address}, ${item.id}`);
            }
        }

        await this.bot.telegram.sendMessage(
            367825282,
            `For ${chatId} there are ${Object.keys(data.result).length} items. ${data.newest.length} new elements found`,
        );

        return data;
    }

    async getFilters(chatId: number, settings: Settings | null = null, selectedType: string | null = null) {
        if (settings === null) {
            settings = await this.yaDisk.get();
        }

        let filters = settings && settings[chatId]?.filters || {};

        let keyboard = [];
        for (let type in filters) {
            if (selectedType !== null && type !== selectedType) {
                continue;
            }
            for (let index in filters[type]) {
                let item = filters[type][index];
                keyboard.push(
                    [Markup.button.callback(`${type}: ${item}`, `delete-${type}-${item}`)]
                );
            }
        }

        return keyboard;
    }

    getFiltersKeyboard(type: string, filters: Filters): any {

        let typeFilters = filters[type] ?? [];

        let buttons = {
            newly: 'New build',
            pets: 'Pets friendly',
            "room-2": 'Min. 2 rooms',
            "room-3": 'Min. 3 rooms',
            "room-4": 'Min. 4 rooms',
            "price-100": 'Min. 100th Ft/month',
            "price-300": 'Min. 300th Ft/month',
            "price-500": 'Min. 500th Ft/month',
            "price-700": 'Min. 700th Ft/month'
        };

        if (type === 'flat') {
            buttons['balcony'] = 'With balcony';
        }

        let keyboard = [];
        for (let alias in buttons) {
            let name = buttons[alias];

            keyboard.push(
                [Markup.button.callback(`${name} ${typeFilters.includes(alias) ? '+' : ''}`, `filter-${type}-${alias}`)]
            )
        }

        return keyboard;
    }

    init(): void {
        this.bot.command(['start', 'configure'], async ctx => {
            await ctx.reply(
                'What kind of realty do you need?',
                Markup.inlineKeyboard(
                    [
                        Markup.button.callback('Flat', `realty-flat`),
                        Markup.button.callback('House', `realty-house`),
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

        this.bot.action(/realty-(.+)/, async (ctx: any) => {
            let type = ctx.match[1];
            let settings: Settings = await this.yaDisk.get();
            let filters: Filters = settings[ctx.chat.id]?.filters || {};

            ctx.editMessageText(
                `Okay, you need a ${type}, may be some details?!`,
                Markup.inlineKeyboard(this.getFiltersKeyboard(type, filters))
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

            if (filters.indexOf(name) === -1) {
                filters.push(name);
            } else {
                filters = filters.filter((item: string) => item !== name);
            }

            settings[ctx.chat.id].filters[type] = filters;

            await this.yaDisk.update(settings);

            await this.yaDisk.delete(`/realty-bot/collection_${ctx.chat.id}.json`);

            await ctx.editMessageReplyMarkup(
                {
                    inline_keyboard: this.getFiltersKeyboard(type, settings[ctx.chat.id].filters)
                }
            );
        });

        this.bot.command('status', async ctx => {
            let settings: Settings = await this.yaDisk.get();

            if (settings.hasOwnProperty(ctx.chat.id)) {
                let collector = new Collector(ctx.chat.id, settings[ctx.chat.id].filters);

                let links = [];
                for (let link in collector.getUrls()) {
                    let url = collector.getUrls()[link];
                    links.push([Markup.button.url(url, url)]);
                }

                await ctx.reply(
                    'Your are in the business. There are your subscription links',
                    Markup.inlineKeyboard(links)
                );
            } else {
                await ctx.reply('Uh-oh. /configure you filters for start get updates.');
            }
        });

        this.bot.command('admin', async ctx => {
            let settings: Settings = await this.yaDisk.get();
            let count = Object.keys(settings).filter(item => item !== 'chatIds').length;

            await ctx.reply(`Your chat id ${ctx.chat.id}`);
            await ctx.reply(`Notification frequency ~ every ${5 * count} min`);
            await ctx.reply(`Settings: ${JSON.stringify(settings)}`);
        });

        this.bot.catch((err: any, ctx: any) => {
            console.log(err);
            ctx.reply(`Something went wrong. Try again. Error: ${err.message}`);
        });
    }
}