// import * as puppeteer from 'puppeteer';
import * as _ from 'lodash';
const Sentiment = require('sentiment');

exports.trends = function(request: any, response: any, useMock: boolean = false) {
    let data = {};

    if (useMock) {
        if (_.isEqual(_.toLower(request.query.q), 'aapl')) {
            data = require('./../mocks/aapl.json');
        } else if (_.isEqual(_.toLower(request.query.q), 'bitcoin')) {
            data = require('./../mocks/bitcoin.json');
        };
        return response.send(constructData(data));
    }

    const Request = require('request');
    Request(`https://gapi.xyz/api/v3/search?q=${request.query.q}&token=9d0d7434d0964972e47f18e1862e821a`, function (error: any, res: any, body: any) {
        return response.send(constructData(JSON.parse(body)));
    });
};

function constructData(data: any) {
    _.forEach(_.get(data, ['articles']), (article: any) => {
        const newSentiment = new Sentiment();
        const bagOfWords = _.join(_.compact(_.split(_.replace(_.toLower(`${_.get(article, ['title'])} ${_.get(article, ['description'])}`), /[^a-zA-Z0-9]/g, ' '), ' ')), ' ');
        const sentiment = newSentiment.analyze(bagOfWords);
        article.sentiment = sentiment;
    });
    const overallSentiment = new Sentiment();
    data.overallSentiment = overallSentiment.analyze(_.join(_.reduce(_.get(data, ['articles']), (list, article: any) => _.concat(list, article.sentiment.tokens), []), ' '));
    return data;
}

// async function scrapeCrypoNews(request: any, response: any): any {
//         // Launch a browser
//         const browser = await puppeteer.launch({
//             headless: true,
//             args: ['--no-sandbox', '--disable-setuid-sandbox']
//         });

//         // Pass a topic via a query param
//         const topic = _.toLower(request.query.topic);

//         // Visit the page a get content
//         const page = await browser.newPage();
//         await page.goto(`https://www.cryptonewsz.com//?s=${topic}`, { waitUntil: 'networkidle0' })

//         const sections = await page.$$('.post-item');
//         const responseBody = {
//             overallSentiment: {},
//             posts: []
//         };
//         for (const section of sections) {
//             const url = await section.$eval(
//                 '.post-title a',
//                 (item: any) => item.getAttribute('href'),
//             );
//             const title = await section.$eval(
//                 '.post-title',
//                 (item: any) => item.innerText.trim().replace(/\n/g, ' '),
//             );
//             const newSentiment = new Sentiment();
//             const bagOfWords = _.join(_.compact(_.split(_.replace(_.toLower(title), /[^a-zA-Z0-9]/g, ' '), ' ')), ' ');
//             const sentiment = newSentiment.analyze(bagOfWords);
//             const obj = {
//                 url,
//                 title,
//                 sentiment
//             };
//             responseBody.posts.push(obj);
//         }
//         const overallSentiment = new Sentiment();
//         responseBody.overallSentiment = overallSentiment.analyze(_.join(_.reduce(responseBody.posts, (list, post) => list.concat(post.sentiment.tokens), []), ' '));
//         response.status(200).send(responseBody);

//         const content = await page.evaluate(el => el.innerHTML, await page.$('p'));
//         var sentiment = new Sentiment();
//         var result = sentiment.analyze(content);
//         return result;
// }