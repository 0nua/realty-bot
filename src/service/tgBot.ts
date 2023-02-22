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
        let queue: object = await this.yaDisk.get('/realty-bot/queue.json');

        //Add new chats
        let subscribers = Object.keys(settings);
        for (let index = 0; index < subscribers.length; index++) {
            let chatId = subscribers[index];
            if (queue.hasOwnProperty(chatId) === false) {
                queue[chatId] = (new Date()).getTime();
            }
        }

        let id: number = 0;
        let tempUsage: number = 0;
        let toDelete: number[] = [];
        for (let chatId in queue) {
            if (subscribers.includes(chatId) === false) {
                toDelete.push(Number.parseInt(chatId));
                continue;
            }

            let lastUsage = queue[chatId];
            if (tempUsage === 0 || lastUsage <= tempUsage) {
                tempUsage = lastUsage;
                id = Number.parseInt(chatId);
            }
        }

        if (id === 0) {
            throw new Error('Chat id not found');
        }

        //Delete old chats
        for (let index in toDelete) {
            let chatId = toDelete[index];
            delete queue[chatId];
        }

        //Update usage
        queue[id] = (new Date()).getTime();

        await this.yaDisk.update('/realty-bot/queue.json', queue);

        return id;
    }

    async unsubscribe(settings: Settings, chatId: number): Promise<boolean> {
        delete settings[chatId];

        await this.updateSettings(settings);

        return await this.deleteCollection(chatId);
    }

    async checkUpdates(): Promise<any> {
        let settings: Settings = await this.getSettings();
        let chatId = await this.getChatId(settings);
        let collector = new Collector(chatId, settings[chatId].filters);
        let data = await collector.getData();
        if (data.newest.length > 0) {
            let messages = [];
            for (let item of data.newest) {
                messages.push(this.bot.telegram.sendMessage(chatId, `${item.price}, ${item.address}, ${item.id}`));
            }

            try {
                await Promise.all(messages);
            } catch (err: any) {
                console.error(err);
                if (err.message.includes('bot was blocked by the user')) {
                    await this.unsubscribe(settings, chatId);
                }
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

        let nextType = type === 'flat' ? 'house' : 'flat';
        let keyboard = [
            [
                Markup.button.callback('<< Menu', 'back'),
                Markup.button.callback(`${nextType} >>`, `realty-${nextType}`)
            ],
            [Markup.button.callback('Close', 'close')]
        ];

        for (let alias in buttons) {
            keyboard.unshift(
                [
                    Markup.button.callback(
                        `${buttons[alias]} ${typeFilters.includes(alias) ? '+' : ''}`, `filter-${type}-${alias}`
                    )
                ]
            )
        }

        return keyboard;
    }

    async getSettings(): Promise<Settings> {
        return this.yaDisk.get('/realty-bot/config.json');
    }

    async updateSettings(settings: Settings): Promise<boolean> {
        return this.yaDisk.update('/realty-bot/config.json', settings);
    }

    deleteCollection(chatId: number): Promise<boolean> {
        return this.yaDisk.delete(`/realty-bot/collection_${chatId}.json`);
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

            await this.unsubscribe(settings, ctx.chat.id);

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
                settings[ctx.chat.id] = {filters: {house: [], flat: []}};
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

            await this.deleteCollection(ctx.chat.id);

            try {
                await ctx.editMessageReplyMarkup(
                    {
                        inline_keyboard: this.getFiltersKeyboard(type, settings[ctx.chat.id]?.filters || {})
                    }
                );
            } catch (err) {
                await ctx.answerCbQuery();
            }
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

        this.bot.command('about', ctx => {
            ctx.reply(
                "I check updates on sites https://tappancsosotthon.hu, https://en.alberlet.hu and https://realestatehungary.hu" +
                "\n\n" +
                "Use command /configure for set up your filters. https://tappancsosotthon.hu does not have filters, " +
                "so you will get all updates from it.\nFilter you have already selected will be marked by \"+\" symbol, " +
                "tap again for remove" +
                "\n\n" +
                "Use command /status for checking your subscription. You will get links with configured filters."
                + "\n\n" +
                "Use /stop for disable notifications. Your filters will be removed at all.",
                Markup.inlineKeyboard([Markup.button.callback('Close', 'close')])
            );
        });

        this.bot.command('/admin', async ctx => {
            let settings = await this.getSettings();
            let count = Object.keys(settings).filter(item => item !== 'chatIds').length;

            await ctx.reply(
                `Your chat id is ${ctx.chat.id}` + "\n" +
                `Subcribed users: ${count}` + "\n" +
                `Notification frequency ~ every ${10 * count} min`,
                Markup.inlineKeyboard([Markup.button.callback('Close', 'close')])
            );
        });

        this.bot.command('/data', async ctx => {
            let settings = await this.getSettings();
            await ctx.reply(
                `Settings: ${JSON.stringify(settings)}`,
                Markup.inlineKeyboard([Markup.button.callback('Close', 'close')])
            );
        });

        this.bot.catch((err: any, ctx: any) => {
            console.error(err);
            ctx.reply(`Something went wrong. Please, try again`);
        });
    }
}