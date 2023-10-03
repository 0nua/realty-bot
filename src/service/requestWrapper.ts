import axios from 'axios';
import Logger from "./logger";

interface Response {
    data: any,
    time: number,
    status: number
}

export default class RequestWrapper {

    static config: object = {
        method: 'GET',
        timeout: 15 * 1000,
        headers: {
            'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0"
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
                await new Promise(resolve => setTimeout(resolve, 2 * 1000));
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