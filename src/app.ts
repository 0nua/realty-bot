import express from "serverless-express";
const TgBot = require('./class/tgBot');

const app = express();

app.tgBot = new TgBot();

app.use(express.json());

export = app;