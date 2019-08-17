import * as puppeteer from 'puppeteer';
// import * as moment from 'moment';
import * as _ from 'lodash';

exports.cors = function(request: any, response: any): void {
    const allowedOrigins: Array<String> = ['http://localhost:4200', 'https://www.ventrips.com'];
    const origin: any = request.headers.origin;
    if (_.indexOf(allowedOrigins, origin) > -1) {
        response.setHeader('Access-Control-Allow-Origin', origin);
    }
    return;
}

exports.puppeteerScrape = async function(source: string, url: string, baseUrl: string, sectionsTarget: string, keysObj: object): Promise<any> {
    const results: Array<any> = [];
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })
    const sections = await page.$$(sectionsTarget);

    for (const section of sections) {
        const obj:any = {
            source
        };
        for (const key in keysObj) {
            if (_.isEqual(key, 'url')) {
                try {
                    obj[key] = await section.$eval(
                        _.get(keysObj, [key]),
                        (item: any) => item.getAttribute('href')
                    );
                    obj[key] = `${baseUrl}${obj[key]}`;
                } catch {

                }
            } else {
                try {
                    obj[key] = await section.$eval(
                        _.get(keysObj, [key]),
                        (item: any) => item.innerText.trim().replace(/\n/g, ' '),
                    );
                } catch {

                }
            }
        }
        results.push(obj);
    }
    return results;
}