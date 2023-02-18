import {Markup, Telegraf} from 'telegraf';
import fs from 'fs';
import YaDisk from './yaDisk';
import Collector from './collector';
import {Filters, Settings} from "../interfaces/settings";
import Data from "../interfaces/collectorData";

export default class TgBot {

    bot: Telegraf;
    yaDisk: YaDisk;
    buttons: object

    constructor() {
        this.yaDisk = new YaDisk();
        this.bot = new Telegraf(process.env.TG_BOT_TOKEN || 'null');
        this.buttons = {
            newly: 'New build',
            pets: 'Pets friendly',
            "room-2": 'Min. 2 rooms',
            "room-3": 'Min. 3 rooms',
            "room-4": 'Min. 4 rooms',
            "price-100": 'Min. 100th Ft/month',
            "price-300": 'Min. 300th Ft/month',
            "max-500": 'Max. 500th Ft/month',
            "max-700": 'Max. 700th Ft/month'
        };

        this.init();
    }

    /**
     * Process bot mesages
     * @param req
     */
    async process(req: any): Promise<any> {
        return await this.bot.handleUpdate(req.body);
    }

    setWebhook(req: any): Promise<boolean> {
        let event = req.apiGateway.event;
        let link = `https://${event.requestContext.domainName}/dev/webhook`;
        return this.bot.telegram.setWebhook(link);
    }

    async getChatId(settings: Settings): Promise<number> {
        let array = [];
        for (let chatId in settings) {
            if (chatId === 'chatIds') {
                continue;
            }

            let data = settings[chatId];
            array.push(
                {
                    id: chatId,
                    lastDate: data.lastDate
                }
            );
        }

        let chat = array.sort((a: any, b: any) => {
            if (a.lastDate > b.lastDate) {
                return -1;
            }

            return a.lastDate < b.lastDate ? 1 : 0;
        }).pop();

        let id = chat ? Number.parseInt(chat.id) : 0;

        if (id > 0) {
            settings[id].lastDate = (new Date()).getTime();
            await this.updateSettings(settings);
        }

        return id;
    }

    async checkUpdates(): Promise<any> {
        let settings: Settings = await this.getSettings();

        let chatId = await this.getChatId(settings);

        let collector = new Collector(chatId, settings[chatId].filters);
        let data = await collector.getData();
        if (data.newest.length > 0) {
            for (let item of data.newest) {
                await this.bot.telegram.sendMessage(chatId, `${item.price}, ${item.address}, ${item.id}`);
                console.log({url: item.id, price: item.price, chatId: chatId});
            }
        }

        console.log({chatId: chatId, result: Object.keys(data.result).length, new: data.newest.length})

        return data;
    }

    getFiltersKeyboard(type: string, filters: Filters): any {

        let typeFilters = filters[type] ?? [];

        let buttons = {...this.buttons};
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

        let nextType = type === 'flat' ? 'house' : 'flat';
        keyboard.push(
            [
                Markup.button.callback('<< Back', 'back'),
                Markup.button.callback(`${nextType} >>`, `realty-${nextType}`)]
        );

        return keyboard;
    }

    async getSettings(): Promise<Settings> {
        return this.yaDisk.get('/realty-bot/config.json');
    }

    async updateSettings(settings: Settings): Promise<boolean> {
        return this.yaDisk.update('/realty-bot/config.json', settings);
    }

    getConfigureKeyboard() {
        return Markup.inlineKeyboard(
            [
                [
                    Markup.button.callback('Flat', `realty-flat`),
                    Markup.button.callback('House', `realty-house`),
                ],
                [
                    Markup.button.callback('Close', 'close')
                ]
            ]
        );
    }

    init(): void {
        this.bot.command(['start', 'configure'], ctx => {
            ctx.reply('What kind of realty do you need?', this.getConfigureKeyboard());
        });

        this.bot.action('back', ctx => {
            ctx.editMessageText('What kind of realty do you need?', this.getConfigureKeyboard());
        });

        this.bot.action('close', ctx => ctx.deleteMessage());

        this.bot.command('stop', async ctx => {
            let settings = await this.getSettings();

            delete settings[ctx.chat.id];

            await this.updateSettings(settings);

            await ctx.reply('Subscribe was rejected! Goodbye!');
        });

        this.bot.action(/realty-(.+)/, async (ctx: any) => {
            let type = ctx.match[1];
            let settings = await this.getSettings();
            let filters: Filters = settings[ctx.chat.id]?.filters || {};

            ctx.editMessageText(
                `Okay, you need a ${type}, may be some details?!`,
                Markup.inlineKeyboard(this.getFiltersKeyboard(type, filters))
            )
        });

        this.bot.action(/filter-(flat|house)-(.+)/, async (ctx: any) => {
            let settings = await this.getSettings();

            let type = ctx.match[1];
            let name = ctx.match[2];

            if (settings.hasOwnProperty(ctx.chat.id) === false) {
                settings[ctx.chat.id] = {filters: {house: [], flat: []}, lastDate: (new Date()).getTime()};
            }

            let filters = settings[ctx.chat.id].filters[type] || [];

            if (name.includes('-')) {
                let [alias, value] = name.split('-');
                filters = filters.filter((item: string) => !item.includes(alias) || item === name);
            }

            if (filters.indexOf(name) === -1) {
                filters.push(name);
            } else {
                filters = filters.filter((item: string) => item !== name);
            }

            settings[ctx.chat.id].filters[type] = filters;

            let houseFilters = settings[ctx.chat.id].filters.house;
            let flatFilters = settings[ctx.chat.id].filters.flat;

            if (houseFilters.length === 0 && flatFilters.length === 0) {
                delete settings[ctx.chat.id];
            }

            await this.updateSettings(settings);

            await this.yaDisk.delete(`/realty-bot/collection_${ctx.chat.id}.json`);

            await ctx.editMessageReplyMarkup(
                {
                    inline_keyboard: this.getFiltersKeyboard(type, settings[ctx.chat.id]?.filters || {})
                }
            );
        });

        this.bot.command('status', async ctx => {
            let settings = await this.getSettings();

            if (settings.hasOwnProperty(ctx.chat.id)) {
                let collector = new Collector(ctx.chat.id, settings[ctx.chat.id].filters);

                let links = [];
                for (let link in collector.getUrls()) {
                    let url = collector.getUrls()[link];
                    links.push([Markup.button.url(url, url)]);
                }

                links.push([Markup.button.callback('Close', 'close')]);

                await ctx.reply(
                    'Your are in the business. There are your subscription links',
                    Markup.inlineKeyboard(links)
                );
            } else {
                await ctx.reply('Uh-oh. /configure you filters for start get updates.');
            }
        });

        this.bot.command('admin', async ctx => {
            let settings = await this.getSettings();
            let count = Object.keys(settings).filter(item => item !== 'chatIds').length;

            await ctx.reply(`Your chat id ${ctx.chat.id}`);
            await ctx.reply(`Notification frequency ~ every ${5 * count} min`);
            await ctx.reply(`Settings: ${JSON.stringify(settings)}`);
        });

        this.bot.catch((err: any, ctx: any) => {
            console.log(err);
            ctx.reply(`Something went wrong. Please, try again`);
        });
    }
}