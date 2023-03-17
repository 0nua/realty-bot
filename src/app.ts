const express: any = require('serverless-express/express');

const app = express();

app.use(express.json());

export default app;