import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import * as puppeteer from 'puppeteer';
import * as moment from 'moment';
const GoogleTrends = require('google-trends-api');
const Sentiment = require('sentiment');
const Request = require('request');

admin.initializeApp();
const db = admin.firestore();
// import * as Stripe from 'stripe';
// const stripe = new Stripe(functions.config().stripe.secret);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
export const predict = functions.https.onRequest(async (request, response): Promise<any> => {
    const tickers: Array<any> = await scrapeSeekingAlpha(true);
    const trends: Array<any> = await getGoogleTrends(tickers, true);
    response.send(trends);
});

// Step 1: Get Tomorrow's Upcoming Stock Earnings
async function scrapeSeekingAlpha(useMock: boolean = false): Promise<Array<any>> {
    if (useMock) {
        const seekingAlphaJSON = require('./../mocks/seeking-alpha.json');
        return seekingAlphaJSON;
    }

    const results: Array<any> = [];
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://seekingalpha.com/earnings/earnings-calendar`, { waitUntil: 'networkidle0' })

    let sections = await page.$$('.earningsTable tbody tr');

    for (const section of sections) {
        const releaseDate = await section.$eval(
            '.release-date',
            (item: any) => item.innerText.trim().replace(/\n/g, ' '),
        );
        if (_.isEqual(releaseDate, moment(new Date()).add(1,'days').format('L'))) {
            const releaseTime = await section.$eval(
                '.release-time',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const url = await section.$eval(
                '.sym',
                (item: any) => `https://seekingalpha.com${item.getAttribute('href')}`
            );
            const symbol = await section.$eval(
                '.sym',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const name = await section.$eval(
                '.ticker-name',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const obj = {
                url,
                symbol,
                name,
                releaseDate,
                releaseTime
            };
            results.push(obj);
        }
    }
    return results;
}

// Step 2: Get Trending Stocks
async function getGoogleTrends(tickers: Array<any> = [], useMock: boolean = false): Promise<Array<any>> {
    const symbols: Array<string> = _.slice(_.map(tickers, (ticker) => _.get(ticker, ['symbol'])), 0, 5);

    let results;
    if (useMock) {
        results = require('./../mocks/google-trends.json');
    } else {
        const unparsedResults = await GoogleTrends.interestOverTime({keyword: symbols, startTime: moment(new Date()).subtract(7, 'days').toDate() })
        results = JSON.parse(unparsedResults);
    }

    const timelineData = results.default.timelineData;
    const data: any = {
        symbols,
        timelineData
    };

    return data;
}

export const trends = functions.https.onRequest(async (request, response): Promise<any> => {
    const allowedOrigins: Array<String> = ['http://localhost:4200', 'https://www.ventrips.com'];
    const origin: any = request.headers.origin;
    if (_.indexOf(allowedOrigins, origin) > -1) {
        response.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Request(`https://gapi.xyz/api/v3/search?q=${req.query.q}&token=9d0d7434d0964972e47f18e1862e821a`, function (error: any, response: any, body: any) {
    //     console.log('error:', error); // Print the error if one occurred
    //     console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    //     console.log('body:', body); // Print the HTML for the Google homepage.
    //     if (error) {
    //         res.send(response.statusCode).send(error);
    //     }
    //     const data = JSON.parse(body);
        // * START
        let data = {};
        if (_.isEqual(_.toLower(request.query.q), 'aapl')) {
            data = require('./../mocks/aapl.json');
            ;
        } else if (_.isEqual(_.toLower(request.query.q), 'bitcoin')) {
            data = require('./../mocks/bitcoin.json');
        }
        const results = {
            statusCode: 200
        }
        // * END
        _.forEach(_.get(data, ['articles']), (article: any) => {
            const newSentiment = new Sentiment();
            const bagOfWords = _.join(_.compact(_.split(_.replace(_.toLower(`${_.get(article, ['title'])} ${_.get(article, ['description'])}`), /[^a-zA-Z0-9]/g, ' '), ' ')), ' ');
            const sentiment = newSentiment.analyze(bagOfWords);
            article.sentiment = sentiment;
        });
        const overallSentiment = new Sentiment();
        data.overallSentiment = overallSentiment.analyze(_.join(_.reduce(_.get(data, ['articles']), (list, article: any) => _.concat(list, article.sentiment.tokens), []), ' '));
        data.alphavantage = await Request(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=demo`);

        response.status(results.statusCode).send(data);
    // });



    // // Launch a browser
        // const browser = await puppeteer.launch({
        //     headless: true,
        //     args: ['--no-sandbox', '--disable-setuid-sandbox']
        // });

        // // Pass a topic via a query param
        // const topic = _.toLower(request.query.topic);

        // // Visit the page a get content
        // const page = await browser.newPage();
        // await page.goto(`https://www.cryptonewsz.com//?s=${topic}`, { waitUntil: 'networkidle0' })

        // const sections = await page.$$('.post-item');
        // const responseBody = {
        //     overallSentiment: {},
        //     posts: []
        // };
        // for (const section of sections) {
        //     const url = await section.$eval(
        //         '.post-title a',
        //         (item: any) => item.getAttribute('href'),
        //     );
        //     const title = await section.$eval(
        //         '.post-title',
        //         (item: any) => item.innerText.trim().replace(/\n/g, ' '),
        //     );
        //     const newSentiment = new Sentiment();
        //     const bagOfWords = _.join(_.compact(_.split(_.replace(_.toLower(title), /[^a-zA-Z0-9]/g, ' '), ' ')), ' ');
        //     const sentiment = newSentiment.analyze(bagOfWords);
        //     const obj = {
        //         url,
        //         title,
        //         sentiment
        //     };
        //     responseBody.posts.push(obj);
        // }
        // const overallSentiment = new Sentiment();
        // responseBody.overallSentiment = overallSentiment.analyze(_.join(_.reduce(responseBody.posts, (list, post) => list.concat(post.sentiment.tokens), []), ' '));
        // response.status(200).send(responseBody);

        // const content = await page.content();
        // const content = await page.evaluate(el => el.innerHTML, await page.$('p'));
        // Send the response
        // var sentiment = new Sentiment();
        // var result = sentiment.analyze(content);
        // response.send(result);
    }
);

const universal  = require(`${process.cwd()}/dist/server`).app;
export const angularUniversalFunction = functions.https.onRequest(universal);

export const createUserRoles = functions.firestore
.document('users/{uid}')
.onCreate(async snapshot => {
    // const customer = await stripe.customers.create({
    //     metadata: { firebaseUID: snapshot.data()!.uid }
    // });
    return db.doc(`users/${snapshot.data()!.uid}`).update({
        // stripeId: _.get(customer, ['id']),
        roles: {
            admin: false,
            editor: false,
            subscriber: false,
        },
        joined: admin.firestore.FieldValue.serverTimestamp()
    });
});

export const subscribeToTopic = functions.https.onCall(
    async (data, context) => {
        await admin.messaging().subscribeToTopic(data.token, _.capitalize(data.topic));

      return `Subscribed to ${_.capitalize(data.topic)}`;
    }
);

export const unsubscribeFromTopic = functions.https.onCall(
    async (data, context) => {
        await admin.messaging().unsubscribeFromTopic(data.token, _.capitalize(data.topic));

        return `Unsubscribed from ${_.capitalize(data.topic)}`;
    }
);

export const sendPushNotification = functions.firestore
.document('notifications/{notificationId}')
.onCreate(async (snapshot, context) => {
    const fcm = snapshot.data();

    const notification: admin.messaging.Notification = {
        title: _.get(fcm, ['title'], 'We made some new updates'),
        body: _.get(fcm, ['body'], 'Come check it out!')
    };

    const payload: admin.messaging.Message = {
        notification,
        webpush: {
          notification: {
            vibrate: [200, 100, 200],
            icon: _.get(fcm, ['icon'], 'https://www.ventrips.com/favicon.ico'),
            click_action: _.get(fcm, ['link'], 'https://www.ventrips.com/')
          }
        },
        topic: _.capitalize('Ventrips')
    };

    return admin.messaging().send(payload);
});

// export const createStripeCheckOutCharge = functions.https.onCall(
//     async (data, context) => {
//         // data is the data passed to the call by the client

//         // authentication is done this way
//         if (!context.auth) return { status: 'error', code: 401, title: 'Authentication error',  message: 'Not signed in'};

//         if (!data.source) {
//             return { status: 'error', code: 500, title: 'Server error',  message: 'Failed to attach source ID to card'}
//         }

//         // context has useful info such as:
//         const userId = _.get(context, ['auth', 'uid']); // the uid of the authenticated user
//         // const email = context.auth.token.email // email of the authenticated user
//         const userDoc = await db.doc(`users/${userId}`).get();
//         const user = userDoc.data() || {};

//         let stripeId = _.get(user, ['stripeId']);
//         // Create new stripe Id if doesn't exist for any reason
//         if (!stripeId) {
//             const customer = await stripe.customers.create({
//                 metadata: { firebaseUID: userId }
//             });
//             stripeId = _.get(customer, ['id']);
//         }

//         const charge = await stripe.charges.create({
//             customer: stripeId,
//             source: _.get(data, ['source']),
//             amount: _.get(data, ['amount']),
//             description: _.get(data, ['description']),
//             currency: 'usd'
//         })

//         // Update user document
//         return db.doc(`users/${userId}`).update({
//             status: charge,
//             stripeId: stripeId
//         })
//     }
// )

// export const startSubscription = functions.https.onCall(
//     async (data, context) => {
//         const userId = context.auth.uid;
//         const userDoc = await db.doc(`users/${userId}`).get();
//         const user = userDoc.data();

//         // Attach the card to the user
//         const source = await stripe.customers.createSource(user.stripeId, {
//             source: data.source
//         });

//         if (!source) {
//             throw new Error(`Stripe failed to attach card`);
//         }

//         // Subscribe the user to the plan
//         const sub = await stripe.subscriptions.create({
//             customer: user.stripeId,
//             items: [ { plan: 'donation' }]
//         })

//         // Update user document
//         return db.doc(`users/${userId}`).update({
//             status: sub.status,
//             subscriptionId: sub.id,
//             itemId: sub.items.data[0].id
//         })
//     }
// )
