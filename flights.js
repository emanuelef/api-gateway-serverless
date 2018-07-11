import {
    success,
    failure
} from "./libs/response-lib";

const {
    startQueryingPromise,
    startQueryingFlightsPromise,
    startQueryingAllFilteredPromise
} = require('air-commons').mysql;

export async function main(event, context, callback) {

    context.callbackWaitsForEmptyEventLoop = false;

    let from = 1520216000;
    let to = 1530226800;
    let lat = 51.444137;
    let lon = -0.351227;
    let max = 100;

    try {
        let items = await startQueryingAllFilteredPromise(from, to, Number(lat), Number(lon), Number(max));
        callback(null, success(items));
    } catch (e) {
        callback(null, failure({
            status: false
        }));
    }
}