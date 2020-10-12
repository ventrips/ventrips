// import * as puppeteer from 'puppeteer';
// import * as moment from 'moment';
import * as querystring from 'querystring';
import * as Request from 'request';
import * as _ from 'lodash';

export const cors = function(request: any, response: any): void {
    const allowedOrigins: Array<String> = ['http://localhost:4200', 'https://www.ventrips.com'];
    const origin: any = request.headers.origin;
    if (_.indexOf(allowedOrigins, origin) > -1) {
        response.setHeader('Access-Control-Allow-Origin', origin);
    }
    return;
}

export const commonRequest = async (params: any, BASE_URL: string, API_KEY?: string): Promise<any> => {
    return new Promise((resolve: any, reject: any) => {
        if (!_.isNil(API_KEY)) {
            _.set(params, 'apikey', API_KEY);
        }
        const url = `${BASE_URL}?${querystring.stringify(params)}`;
        Request(url, function (error: any, res: any, body: any) {
            if (!_.isNil(error)) {
                reject(error);
            }
            const data = JSON.parse(body);
            resolve(data);
        });
    });
};

// exports.puppeteerScrape = async function(url: string, baseUrl: string, sectionsTarget: string, keysObj: object): Promise<any> {
//     const results: Array<any> = [];
//     const browser = await puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });

//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })
//     const sections = await page.$$(sectionsTarget);

//     for (const section of sections) {
//         const obj:any = {};
//         for (const key in keysObj) {
//             if (_.isEqual(key, 'url')) {
//                 try {
//                     obj[key] = await section.$eval(
//                         _.get(keysObj, [key]),
//                         (item: any) => item.getAttribute('href')
//                     );
//                     obj[key] = `${baseUrl}${obj[key]}`;
//                 } catch {

//                 }
//             } else {
//                 try {
//                     obj[key] = await section.$eval(
//                         _.get(keysObj, [key]),
//                         (item: any) => item.innerText.trim().replace(/\n/g, ' '),
//                     );
//                 } catch {

//                 }
//             }
//         }
//         if (_.keys(obj).length > 1) {
//             results.push(obj);
//         }
//     }
//     return results;
// }