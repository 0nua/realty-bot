import axios from 'axios';
import Logger from "./logger";
import RequestWrapper from "./requestWrapper";

export default class YaDisk {
    config: {
        headers: {
            Authorization: string
        },
        timeout: number
    };

    constructor() {
        this.config = {
            headers: {
                Authorization: `OAuth ${process.env.YA_TOKEN}`,
            },
            timeout: 10 * 1000
        };
    }

    async get(path: string, def: any = {}): Promise<any> {
        try {
            let response = await RequestWrapper.request(
                `https://cloud-api.yandex.net/v1/disk/resources/download?path=${this.getEnvPath(path)}`,
                this.config
            );
            let content = await this.download(response.data.href);
            return JSON.parse(content);
        } catch (err: any) {
            let status = err.response && err.response.status
            if (status !== 404) {
                await Logger.log(err);
            }
            return def;
        }
    }

    download(url: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let response = await axios.get(url, {responseType: 'stream'});
            let stream = response.data;
            let content = '';
            stream.on('data', (data: string) => content += data);
            stream.on('end', () => resolve(content));
            stream.on('error', (err: Error) => reject(err));
        });
    }

    async update(path: string, data: object): Promise<boolean> {
        try {
            let upload = await RequestWrapper.request(
                `https://cloud-api.yandex.net/v1/disk/resources/upload?overwrite=true&path=${this.getEnvPath(path)}`,
                this.config
            );

            await RequestWrapper.request(upload.data.href, {method: 'PUT', data: data});

            let status = 'unknown';
            let limit = 0;
            while (status !== 'success') {
                if (limit > 5) {
                    throw new Error('Operation check limit reached');
                }

                let response = await RequestWrapper.request(
                    `https://cloud-api.yandex.net/v1/disk/operations/${upload.data.operation_id}`,
                    this.config
                );

                status = response.data.status ?? status;
                limit++;
            }

            return status === 'success';
        } catch (err) {
            await Logger.log(err);
            return false;
        }
    }

    async delete(path: string): Promise<boolean> {
        try {
            let response = await RequestWrapper.request(
                `https://cloud-api.yandex.net/v1/disk/resources?path=${this.getEnvPath(path)}`,
                {...this.config, method: 'DELETE'}
            );

            return response.status === 204;
        } catch (err: any) {
            let status = err.response && err.response.status
            if (status !== 404) {
                await Logger.log(err);
                return false;
            }
            return true;
        }
    }

    getEnvPath(path: string): string {
        let [dir, file] = path.slice(1).split('/');

        let suffix = process.env.APP_ENV === 'offline' ? '-test' : '';

        return `/${dir}${suffix}/${file}`;
    }

}