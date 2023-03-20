import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, PutCommand, GetCommand} from '@aws-sdk/lib-dynamodb';

export default class DynamoDB {

    db: DynamoDBDocumentClient

    constructor() {
        let config = {
            region: process.env.AWS_PROJECT_REGION,
            credentials: {
                accessKeyId: process.env.AWS_PROJECT_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_PROJECT_SECRET_ACCESS_KEY || ''
            }
        };

        if (process.env.APP_ENV === 'test') {
            config['endpoint'] = 'http://localhost:8000';
        }

        let client = new DynamoDBClient(config);

        this.db = DynamoDBDocumentClient.from(client);
    }

    async put(table: string, data: object): Promise<any> {
        return this.db.send(new PutCommand({TableName: table, Item: data}));
    }

    async get(table: string, key: object): Promise<any> {
        return this.db.send(new GetCommand({TableName: table, Key: key}))
    }
}