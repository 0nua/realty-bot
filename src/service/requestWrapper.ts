import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import Logger from "./logger";

interface Response {
    data: any,
    time: number,
    status: number
}

export default class RequestWrapper {

    static config: object = {
        method: 'GET',
        timeout: 10 * 1000
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
                await new Promise(resolve => setTimeout(resolve, 0.5 * 1000));
                return RequestWrapper.request(url, config, false);
            }
            err.message = `${err.message} (${url})`;
            RequestWrapper.log(request, {err: err.message});
            throw err;
        }
    }

    static log(request: object, response: object) {
        Logger.debug(`HTTP Request with payload ${JSON.stringify(request)} response ${JSON.stringify(response)}`);
    }
}