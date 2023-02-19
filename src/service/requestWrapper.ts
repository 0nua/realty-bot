interface Response {
    data: any,
    time: number
}

export default class RequestWrapper {

    static params: object = {
        timeout: 10 * 1000,
        headers: {
            'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
    };

    static async request(requestCb: any): Promise<Response> {
        let requestStart = (new Date()).getTime();
        let response = await requestCb(this.params);
        let requestTime = ((new Date()).getTime() - requestStart) / 1000;

        return {
            data: response.data,
            time: requestTime
        }
    }
}