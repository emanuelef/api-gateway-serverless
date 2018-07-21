export function success(body) {
    return buildResponse(200, body);
}

export function failure(body) {
    return buildResponse(500, body);
}

const buildResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify(body)
    };
}

export function successZipped(gzippedResponse) {

    console.log(gzippedResponse.toString("base64"));

    return {
        statusCode: 200,
        "isBase64Encoded": true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Encoding": "gzip"
        },
        body: gzippedResponse.toString("base64")
    };
}