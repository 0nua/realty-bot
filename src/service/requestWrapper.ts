interface Response {
    data: any,
    time: number
}

export default class RequestWrapper {

    static async request(requestCb: any): Promise<Response> {
        let requestStart = (new Date()).getTime();
        let response = await requestCb();
        let requestTime = ((new Date()).getTime() - requestStart) / 1000;

        return {
            data: response.data,
            time: requestTime
        }
    }
}