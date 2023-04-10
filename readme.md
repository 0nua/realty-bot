**How to run application locally?**
Use command `npm run start`. It runs app on your machine.

For local configuration create `.env.offline`

Create `Test bot` via Telegram BotFather and use https://webhook.site/ for link with local instance.

Set webhook via GET request with param `link`: http://localhost:3002/offline/link?link=<your_url>.

Note: https://webhook.site/ could proxy request from webhook url to your local instance. See: XHR Redirect option.

Note: chain of requests `Test Bot -> Webhook site -> http://localhost:3002/offline/webhook (local instance endpoint)`

**How to use dynamodb instance locally**

`npm run start` will startup offline lambda app with dynamodb instance.

For successful startup you need to install java on your machine.

`apt-get install openjdk-7-jre-headless`

For connecting to local instance use AWS CLI:

`aws dynamodb list-tables --endpoint-url http://localhost:8000`

`aws dynamodb scan --table=settings --endpoint-url http://localhost:8000`

Note 1: aws cli always ask you to set credetials and region, so you can use dummy values for localhost dynamodb

Note 2: http://localhost:8000/shell - was deprecated

Useful links:
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html
- https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html