const zlib = require('zlib');
const {
    promisify
} = require('util');

import * as ss from 'simple-statistics';

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
            galtM,
            time
        }) => ({
            latitude,
            longitude,
            galtM,
            time
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
            galtM,
            time
        }) => ({
            latitude,
            longitude,
            galtM,
            time
        }));
        if (qParams && qParams.latLonOnly) {
            items = items.map(picked);
        }

        let gzippedResponse = await zipAsync(JSON.stringify(items));
        //console.log(gzippedResponse.byteLength);
        callback(null, successZipped(gzippedResponse));
    } catch (e) {
        //console.log(e.message);
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

// http://localhost:3000/allFlightsInBox?from=1532101200&to=1532107600&lat=51.443874&lon=-0.342588&max=2500&minDistance=1200

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

        const allSummaries = genFlightsStats(items, reqPosition);
        const belowMaxDistanceArray = allSummaries.filter(el => el.minDistance < Number(qParams.minDistance));
        const belowMaxDistance = belowMaxDistanceArray.length;
        const onlyMinDArray = belowMaxDistanceArray.map(el => el.minDistance);

        const medianDistance = belowMaxDistance > 0 ? ss.median(onlyMinDArray) : undefined;
        const meanDistance = belowMaxDistance > 0 ? ss.mean(onlyMinDArray) : undefined;
        const minDistance = belowMaxDistance > 0 ? ss.min(onlyMinDArray) : undefined;
        const qRankTest = belowMaxDistance > 0 ? ss.quantileRank(onlyMinDArray, medianDistance) : undefined;

        const results = {
            belowMaxDistance,
            medianDistance,
            meanDistance,
            minDistance,
            qRankTest
        };

        if (!qParams.summaryOnly) {
            results.belowMaxDistanceArray = belowMaxDistanceArray;
        }

        callback(null, success(results));
    } catch (e) {
        console.log(e.message);
        callback(null, failure({
            status: false
        }));
    }
}