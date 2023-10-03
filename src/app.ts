import {Express} from "express";

interface App extends Express {
    tgBot: TgBot;
}

const express = require('serverless-express/express');
import TgBot from './service/tgBot';

const app: App = express();
app.use(express.json());

app.tgBot = new TgBot();

export default app;