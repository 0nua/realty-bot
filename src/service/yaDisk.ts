import axios from 'axios';
import lodash from 'lodash';

export default class YaDisk {
    path: string;
    config: object;

    constructor(path: string) {
        this.path = path;
        this.config = {
            headers: {
                Authorization: `OAuth ${process.env.YA_TOKEN}`,
            },
        };
    }

    async get(): Promise<any> {
        try {
            let response = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/resources/download?path=${this.path}`,
                this.config,
            );
            let content = await this.download(response.data.href);
            return JSON.parse(content);
        } catch (err) {
            console.log(err);
            return {};
        }
    }

    download(url: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let response = await axios.get(url, { responseType: 'stream' });
            let stream = response.data;
            let content = '';
            stream.on('data', (data: string) => content += data);
            stream.on('end', () => resolve(content));
            stream.on('error', (err: Error) => reject(err));
        });
    }

    async update(data: object, merge = false): Promise<boolean> {
        try {
            if (merge) {
                let old = await this.get();
                data = lodash.mergeWith({}, old, data, (a, b) => {
                    if (lodash.isArray(a)) {
                        return lodash.uniq(b.concat(a));
                    }
                });
            }

            let upload = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/resources/upload?overwrite=true&path=${this.path}`,
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
            console.log(err);
            return false;
        }
    }

}