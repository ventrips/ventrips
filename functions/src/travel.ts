const RequestPromise = require('request-promise');
const Cheerio = require('cheerio');
const UserAgent = require('user-agents');
import * as _ from 'lodash';


// *** LOCAL TESTING: REMEMBER TO ALWAYS TSC --WATCH BEFORE RUNNING EMULATOR ***
exports.getTravelNumbers = async function(request: any, response: any, useMock: boolean = false) {
    return new Promise((resolve: any, reject: any) => {
        Promise.all([
            getTravelNumbers(useMock)
        ])
        .then(async (result: any) => {
            const data = {
                results: _.get(result, [0])
            }
            resolve(data);
            return data;
        }).catch((error: any) => reject(`Error in promises ${error}`));
    });
}



const getTravelNumbers = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
        if (useMock) {
            const data = require('./../mocks/travel/travel-numbers.json');
            resolve(data);
            return data;
        }

        const options = {
            uri: 'https://www.tsa.gov/coronavirus/passenger-throughput',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('table > tbody > tr').each(function (this: any, index: number) {
                if (_.isEqual(index, 0)) {
                    return;
                }
                const obj = {
                    date: new Date($(this).find('td:nth-child(1)').text()),
                    currentYearTravelNumbers: _.replace($(this).find('td:nth-child(2)').text(), /,/g, ''),
                    previousYearTravelNumbers: _.replace($(this).find('td:nth-child(3)').text(), /,/g, '')
                }
                data.push(obj);
            });
            // Process html like you would with jQuery...

            resolve(data);
        })
        .catch((err: any) => {
            // Crawling failed...
            reject(err);
            return err;
        });
    });
}
