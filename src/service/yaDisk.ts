import axios from 'axios';

export default class YaDisk {
    config: {
        headers: {
            Authorization: string
        }
    };

    constructor() {
        this.config = {
            headers: {
                Authorization: `OAuth ${process.env.YA_TOKEN}`,
            },
        };
    }

    async get(path: string, def:any = {}): Promise<any> {
        try {
            let response = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/resources/download?path=${path}`,
                this.config,
            );
            let content = await this.download(response.data.href);
            return JSON.parse(content);
        } catch (err: any) {
            let status = err.response && err.response.status
            if (status !== 404) {
                console.error(err);
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
            let upload = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/resources/upload?overwrite=true&path=${path}`,
                this.config,
            );

            await axios.put(upload.data.href, JSON.stringify(data));

            let status = 'unknown';
            let limit = 0;
            while (status !== 'success') {
                if (limit > 5) {
                    throw new Error('Operation check limit reached');
                    break;
                }
                let response = await axios.get(
                    `https://cloud-api.yandex.net/v1/disk/operations/${upload.data.operation_id}`,
                    this.config,
                );
                status = response.data.status ?? status;
                limit++;
            }

            return status === 'success';
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async delete(path: string): Promise<boolean> {
        try {
            let response = await axios.delete(
                `https://cloud-api.yandex.net/v1/disk/resources?path=${path}`,
                this.config,
            );
            return response.status === 204;
        } catch (err: any) {
            let status = err.response && err.response.status
            if (status !== 404) {
                console.error(err);
                return false;
            }
            return true;
        }
    }

}