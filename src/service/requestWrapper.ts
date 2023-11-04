import Logger from "./logger";

const DEFAULT_TIMEOUT = 15 * 1000;

interface Response {
    data: any,
    time: number,
    status: number
}

interface AxiosRequest {
    method?: string;
    headers?: Record<string, string>;
    timeout?: number;
    url?: string;
    data?: object;
}

class FetchError extends Error {
    public response: unknown;
}

export default class RequestWrapper {
    static async request(url: string, config: AxiosRequest = {}, repeat: boolean = true): Promise<Response> {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            ...config.headers
        };

        const request = {
            method: config.method ?? "GET",
            headers: headers,
            body: config.data ? JSON.stringify(config.data): undefined,
            signal: AbortSignal.timeout(config.timeout ?? DEFAULT_TIMEOUT)
        };

        try {
            let requestStart = (new Date()).getTime();

            const response = await fetch(url, request);

            let time = ((new Date()).getTime() - requestStart) / 1000;
            RequestWrapper.log(request, {status: response.status, time});

            if (!response.ok) {
                const error = new FetchError(`Fetch error! Status: ${response.status}. Text: ${response.statusText}`);
                error.response = response;

                throw error;
            }

            let data = await response.text();
            try { data = JSON.parse(data    ); } catch (_) {}

            return {
                data,
                time,
                status: response.status
            }
        } catch (err: any) {
            if (repeat) {
                await new Promise(resolve => setTimeout(resolve, 2 * 1000));
                return RequestWrapper.request(url, config, false);
            }
            RequestWrapper.log(request, {message: `${err.message} (${url})`});
            throw err;
        }
    }

    static log(request: object, response: object) {
        Logger.debug(`HTTP Request with payload ${JSON.stringify(request)} response ${JSON.stringify(response)}`);
    }
}