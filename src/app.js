const express = require('serverless-express/express');
const TgBot = require('./class/tgBot');

const app = express();

app.tgBot = new TgBot();

app.use(express.json());

module.exports = app;