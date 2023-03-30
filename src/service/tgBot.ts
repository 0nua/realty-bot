import {Markup, Telegraf} from 'telegraf';
import YaDisk from './yaDisk';
import Collector from './collector';
import {Filters, SettingsInterface} from "../interfaces/settings";
import CollectorDataInterface from "../interfaces/collectorData";
import Queue from "./queue";
import Settings from "./settings";
import Logger from "./logger";

export default class TgBot {

    bot: Telegraf;
    yaDisk: YaDisk;
    buttons: object;
    queue: Queue;
    settings: Settings;

    constructor() {
        this.yaDisk = new YaDisk();
        this.bot = new Telegraf(process.env.TG_BOT_TOKEN || 'null');
        this.queue = new Queue();
        this.settings = new Settings();
        this.buttons = {
            newly: 'Newly',
            pets: 'With pets',
            condi: 'Air conditioning',
            furnished: 'Furnished',
            balcony: 'Balcony',
            "room-2": 'Min. 2 rooms',
            "room-3": 'Min. 3 rooms',
            "room-4": 'Min. 4 rooms',
            "price-150": 'Min 150th',
            "price-200": 'Min 200th',
            "price-250": 'Min 250th',
            "price-300": 'Min 300th',
            "max-250": 'Max 250th',
            "max-350": 'Max 350th',
            "max-400": 'Max 400th',
            "max-500": 'Max 500th',
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
        let link = req.query.link ?? `https://${event.requestContext.domainName}/dev/webhook`;
        return this.bot.telegram.setWebhook(link);
    }

    async unsubscribe(settings: SettingsInterface, chatId: number): Promise<boolean> {
        delete settings[chatId];

        await this.settings.update(settings);

        return await this.deleteCollection(chatId);
    }

    async checkUpdates(): Promise<any> {
        let settings: SettingsInterface = await this.settings.get();

        let chatId = await this.queue.process(Object.keys(settings));

        let collector = new Collector(chatId, settings[chatId].filters);

        let data = await collector.getData();
        if (data.newest.length > 0) {
            let messages = [];
            for (let item of data.newest) {
                messages.push(this.bot.telegram.sendMessage(chatId, `${item.price}, ${item.address}, ${item.url ?? item.id}`));
            }

            try {
                await Promise.all(messages);
            } catch (err: any) {
                await Logger.log(err);
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
        if (type !== 'flat') {
            delete buttons['balcony'];
        }

        let nextType = type === 'flat' ? 'house' : 'flat';
        let keyboard = [
            [
                Markup.button.callback('<< Menu', 'back'),
                Markup.button.callback(`${nextType} >>`, `realty-${nextType}`)
            ],
            [Markup.button.callback('Close', 'close')]
        ];

        let row = [];
        for (let alias in buttons) {
            row.push(
                Markup.button.callback(
                    `${buttons[alias]} ${typeFilters.includes(alias) ? '+' : ''}`, `filter-${type}-${alias}`
                )
            );

            if (row.length === 2) {
                keyboard.unshift([...row]);
                row = [];
            }
        }

        if (row.length > 0) {
            keyboard.unshift([...row]);
        }

        return keyboard;
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

    async updateFilters(ctx: any, repeat: boolean = true): Promise<boolean> {
        try {
            let type = ctx.match[1];
            let name = ctx.match[2];

            let settings = await this.settings.processFilter(ctx.chat.id, type, name);

            await this.settings.update(settings);
            await ctx.editMessageReplyMarkup(
                {
                    inline_keyboard: this.getFiltersKeyboard(type, settings[ctx.chat.id]?.filters || {})
                }
            );
            await this.deleteCollection(ctx.chat.id);
            return true;
        } catch (err) {
            if (repeat) {
                return await this.updateFilters(ctx, false);
            }
            ctx.answerCbQuery();
            return false;
        }
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
            let settings = await this.settings.get();

            await this.unsubscribe(settings, ctx.chat.id);

            await ctx.reply('Subscribe was rejected! Goodbye!');
        });

        this.bot.action(/realty-(.+)/, async (ctx: any) => {
            let type = ctx.match[1];
            let settings = await this.settings.get();
            let filters: Filters = settings[ctx.chat.id]?.filters || {};

            ctx.editMessageText(
                `Okay, you need a ${type}, may be some details?!`,
                Markup.inlineKeyboard(this.getFiltersKeyboard(type, filters))
            )
        });

        this.bot.action(/filter-(flat|house)-(.+)/, async (ctx: any) => {
            await this.updateFilters(ctx);
        });

        this.bot.command('status', async ctx => {
            let settings = await this.settings.get();

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
                "I check updates on sites https://tappancsosotthon.hu, https://en.alberlet.hu and https://ingatlan.com" +
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
            let queue = await this.queue.getQueue();
            let count = Object.keys(queue).length;

            await ctx.reply(
                `Your chat id is ${ctx.chat.id}` + "\n" +
                `Subcribers: ${count}` + "\n" +
                `Notification frequency ~ every ${5 * count} min`,
                Markup.inlineKeyboard([Markup.button.callback('Close', 'close')])
            );
        });

        this.bot.command('/error', async ctx => {
            throw new Error('test');
        });

        this.bot.catch(async (err: any, ctx: any) => {
            await Logger.log(err);
            await ctx.reply(`Something went wrong. Please, try again`);
        });
    }
}