const express: any = require('serverless-express/express');
import TgBot from './service/tgBot';

const app = express();
app.use(express.json());

app.tgBot = new TgBot();

export default app;