const zlib = require('zlib');
const {
    promisify
} = require('util');

const zipAsync = promisify(zlib.gzip);

import {
    success,
    failure,
    successZipped
} from "./libs/response-lib";

const {
    startQueryingPromise,
    startQueryingFlightsPromise,
    startQueryingAllFilteredPromise
} = require('air-commons').mysql;

const Position = require('air-commons').Position;

const {
    genFlightsStats
} = require('./groupFlights');

export async function all(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    const qParams = event.queryStringParameters;

    try {
        let items = await startQueryingPromise(qParams.from, qParams.to);
        const picked = (({
            latitude,
            longitude,
            galtM
        }) => ({
            latitude,
            longitude,
            galtM
        }));
        if (qParams && qParams.latLonOnly) {
            items = items.map(picked);
        }
        callback(null, success(items));
    } catch (e) {
        callback(null, failure({
            status: false
        }));
    }
}

// Trying to zip directly as the option on AWS doesn't seem to work for me
export async function allZipped(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    const qParams = event.queryStringParameters;

    try {
        let items = await startQueryingPromise(qParams.from, qParams.to);
        const picked = (({
            latitude,
            longitude,
            galtM
        }) => ({
            latitude,
            longitude,
            galtM
        }));
        if (qParams && qParams.latLonOnly) {
            items = items.map(picked);
        }

        let gzippedResponse = await zipAsync(JSON.stringify(items));
        console.log(gzippedResponse.byteLength);
        callback(null, successZipped(gzippedResponse));
    } catch (e) {
        console.log(e.message);
        callback(null, failure({
            status: false
        }));
    }
}

export async function allInBox(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    const qParams = event.queryStringParameters;

    let from = 1520216000;
    let to = 1530226800;
    let lat = 51.444137;
    let lon = -0.351227;
    let max = 1000;

    try {
        let items = await startQueryingAllFilteredPromise(qParams.from, qParams.to, Number(qParams.lat), Number(qParams.lon), Number(qParams.max));
        callback(null, success(items));
    } catch (e) {
        callback(null, failure({
            status: false
        }));
    }
}

export async function flights(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    const qParams = event.queryStringParameters;

    try {
        let items = await startQueryingFlightsPromise(qParams.from, qParams.to);
        callback(null, success(items));
    } catch (e) {
        callback(null, failure({
            status: false
        }));
    }
}

export async function allFlightsInBox(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    const qParams = event.queryStringParameters;

    try {
        let items = await startQueryingAllFilteredPromise(qParams.from, qParams.to, Number(qParams.lat), Number(qParams.lon), Number(qParams.max));

        let flightsByIcao = {};

        for (let item of items) {
            flightsByIcao[item.icao] = flightsByIcao[item.icao] || 0;
            flightsByIcao[item.icao] = flightsByIcao[item.icao] + 1;
        }

        const reqPosition = new Position({
            lat: Number(qParams.lat),
            lon: Number(qParams.lon),
            alt: 20 // TODO: Calculate right one
        });

        let allSummaries = genFlightsStats(items, reqPosition);

        callback(null, success(allSummaries));
    } catch (e) {
        callback(null, failure({
            status: false
        }));
    }
}