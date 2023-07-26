import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';

interface Response {
    data: any,
    time: number,
    status: number
}

export default class RequestWrapper {

    static config: object = {
        method: 'GET',
        timeout: 10 * 1000,
        headers: {
            'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
    };

    static async request(url: string, config: object = {}, repeat: boolean = true): Promise<Response> {
        let request = {...this.config, url, ...config};
        try {
            let requestStart = (new Date()).getTime();
            let response = await axios.request(request);
            let time = ((new Date()).getTime() - requestStart) / 1000;
            RequestWrapper.log(request, {status: response.status, time});
            return {
                data: response.data,
                time,
                status: response.status
            }
        } catch (err: any) {
            if (repeat) {
                return RequestWrapper.request(url, config, false);
            }
            err.message = `${err.message} (${url})`;
            RequestWrapper.log(request, {err: err.message});
            throw err;
        }
    }

    static log(request: object, response: object) {
        if (process.env.APP_ENV !== 'offline') {
            return;
        }
        console.log(
            `HTTP Request with payload ${JSON.stringify(request)} response ${JSON.stringify(response)}`
        );
    }
}