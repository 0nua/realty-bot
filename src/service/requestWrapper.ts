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
        const request = {
            method: config.method ?? "GET",
            headers: config.headers ?? undefined,
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
            try { data = JSON.parse(data); } catch (_) {}

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
            err.message = `${err.message} (${url})`;
            RequestWrapper.log(request, {err: err.message});
            throw err;
        }
    }

    static log(request: object, response: object) {
        Logger.debug(`HTTP Request with payload ${JSON.stringify(request)} response ${JSON.stringify(response)}`);
    }
}