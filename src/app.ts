const express: any = require('serverless-express/express');
import TgBot from './service/tgBot';

const app = express();

app.tgBot = new TgBot();

app.use(express.json());

export = app;