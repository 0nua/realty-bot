import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    DeleteCommand,
    UpdateCommand,
    ScanCommand
} from '@aws-sdk/lib-dynamodb';

import Logger from './logger';

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

        if (process.env.APP_ENV === 'offline') {
            config['endpoint'] = 'http://localhost:8000';
        }

        let client = new DynamoDBClient(config);

        this.db = DynamoDBDocumentClient.from(client);
    }

    async put(table: string, data: object): Promise<any> {
        let params = {
            TableName: table,
            Item: data
        };
        let result = await this.db.send(new PutCommand(params));

        this.log('put', params, result);

        return result['$metadata'].httpStatusCode === 200;
    }

    async get(table: string, key: object, fields: string = ''): Promise<any> {
        let params = {
            TableName: table,
            Key: key
        };

        if (fields) {
            params['ProjectionExpression'] = fields;
        }

        let result = await this.db.send(new GetCommand(params));

        this.log('get', params, result);

        return result;
    }

    async update(table: string, key: object, data: object): Promise<boolean> {
        let params = {
            TableName: table,
            Key: key,
        };

        params = {...params, ...this.convertDataToUpdateExpression(data)};

        let result = await this.db.send(new UpdateCommand(params));

        this.log('update', params, result);

        return result['$metadata'].httpStatusCode === 200;
    }

    async delete(table: string, key: object): Promise<boolean> {
        let params = {
            TableName: table,
            Key: key
        };

        let result = await this.db.send(new DeleteCommand(params));

        this.log('delete', params, result);

        return result['$metadata'].httpStatusCode === 200;
    }

    async scan(table: string, fields: string): Promise<any> {
        let params = {
            TableName: table,
            ProjectionExpression: fields
        }

        let result = await this.db.send(new ScanCommand(params));

        this.log('scan', params, result);

        return result;
    }

    convertDataToUpdateExpression(data: object): object {
        let result = {
            UpdateExpression: 'SET ',
            ExpressionAttributeValues: {},
        };

        for (let prop in data) {
            let value = data[prop];
            result.UpdateExpression += `${prop} = :${prop}`;
            result.ExpressionAttributeValues[`:${prop}`] = value;
        }

        return result;
    }

    log(type: string, data: object, result: object) {
        if (process.env.APP_ENV !== 'offline') {
            return;
        }
        console.log(
            `DynamoDB request: ${type} with payload ${JSON.stringify(data)} and response ${JSON.stringify(result)}`
        );
    }
}