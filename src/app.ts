const express: any = require('serverless-express/express');
import TgBot from './class/tgBot';

const app = express();

app.tgBot = new TgBot();

app.use(express.json());

export = app;