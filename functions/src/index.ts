import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as _ from 'lodash';
// import * as puppeteer from 'puppeteer';
const Sentiment = require('sentiment');
const request = require('request');
// const applBody = {
//     "timestamp": 1565534741,
//     "articleCount": 10,
//     "articles": [
//         {
//             "title": "Atalanta Sosnoff Capital LLC Purchases 63,708 Shares of Apple Inc. (NASDAQ:AAPL)",
//             "description": "Atalanta Sosnoff Capital LLC grew its position in Apple Inc. (NASDAQ:AAPL) by 9.6% in the second quarter, according to the company in its most recent Form ...",
//             "url": "https://mayfieldrecorder.com/2019/08/11/atalanta-sosnoff-capital-llc-has-143-35-million-holdings-in-apple-inc-nasdaqaapl.html",
//             "image": null,
//             "publishedAt": "2019-08-11 10:12:06 UTC",
//             "source": {
//                 "name": "Mayfield Recorder",
//                 "url": "https://mayfieldrecorder.com"
//             }
//         },
//         {
//             "title": "Nomura Boosts Apple (NASDAQ:AAPL) Price Target to $180.00",
//             "description": "Apple (NASDAQ:AAPL) had its target price increased by Nomura from $175.00 to $180.00 in a report published on Friday, July 19th, Briefing.com Automated ...",
//             "url": "https://mayfieldrecorder.com/2019/08/10/apple-nasdaqaapl-price-target-raised-to-180-00.html",
//             "image": null,
//             "publishedAt": "2019-08-10 22:26:09 UTC",
//             "source": {
//                 "name": "Mayfield Recorder",
//                 "url": "https://mayfieldrecorder.com"
//             }
//         },
//         {
//             "title": "Brown Brothers Harriman & Co Stake in Apple (AAPL) Boosted by $927,045 as Stock Value Rose; Birch Hill Investment Advisors Decreased Holding in Wells Fargo Co New (WFC) as Share Price Rose",
//             "description": "Brown Brothers Harriman & Co increased its stake in Apple Inc (AAPL) by 2.25% based on its latest 2019Q1 regulatory filing with the SEC. Brown Brothers Birch ...",
//             "url": "https://enherald.com/brown-brothers-harriman-birch-hill-investment-advisors-decreased-holding-in-wells-fargo-co-new-wfc-as-share-price-rose/",
//             "image": null,
//             "publishedAt": "2019-08-10 17:54:20 UTC",
//             "source": {
//                 "name": "The EN Herald",
//                 "url": "https://enherald.com"
//             }
//         },
//         {
//             "title": "Apple (AAPL) Shareholder Jnba Financial Advisors Lifted Position; Echostar (SATS) Share Price Rose While Nokomis Capital Has Decreased Position",
//             "description": "Jnba Financial Advisors increased its stake in Apple Inc (AAPL) by 27.3% based on its latest 2019Q1 regulatory filing with the SEC. Jnba Financial Advisors ...",
//             "url": "https://enherald.com/apple-aapl-shareholder-jnba-financial-advisors-lifted-position-echostar-sats-share-price-rose-while-nokomis-capital-has-decreased-position/",
//             "image": null,
//             "publishedAt": "2019-08-10 14:52:02 UTC",
//             "source": {
//                 "name": "The EN Herald",
//                 "url": "https://enherald.com"
//             }
//         },
//         {
//             "title": "Moneta Group Investment Advisors Stake in Apple (AAPL) Decreased as Valuation Rose; As Post Hldgs (POST) Market Value Declined, Holder Van Den Berg Management I Has Trimmed Its Holding by $8.81 Million",
//             "description": "Moneta Group Investment Advisors Llc decreased its stake in Apple Inc (AAPL) by 14.04% based on its latest 2019Q1 regulatory filing with the SEC. Moneta ...",
//             "url": "https://cryptocoinstribune.com/moneta-group-investment-advisors-stake-in-apple-aapl-decreased-as-valuation-rose-as-post-hldgs-post-market-value-declined-holder-van-den-berg-management-i-has-trimmed-its-holding-by-8-81-millio/",
//             "image": null,
//             "publishedAt": "2019-08-10 10:39:32 UTC",
//             "source": {
//                 "name": "CryptoCoinsTribune",
//                 "url": "https://cryptocoinstribune.com"
//             }
//         },
//         {
//             "title": "First National Bank of Mount Dora Trust Investment Services Sells 198 Shares of Apple Inc. (NASDAQ:AAPL)",
//             "description": "First National Bank of Mount Dora Trust Investment Services cut its position in shares of Apple Inc. (NASDAQ:AAPL) by 0.6% during the second quarter, ...",
//             "url": "https://slatersentinel.com/news/2019/08/10/apple-inc-nasdaqaapl-is-first-national-bank-of-mount-dora-trust-investment-services-8th-largest-position.html",
//             "image": "https://lh3.googleusercontent.com/proxy/J5SanBKqXQSeIB2xMhkFgvC7f4A5CPcXAAOzdbLoJeWAib3VZP9-ySmXAccSEPXBl68U1T0roycs20yyaZbcyjUAGRrP8Q=-c",
//             "publishedAt": "2019-08-10 06:38:55 UTC",
//             "source": {
//                 "name": "Slater Sentinel",
//                 "url": "https://slatersentinel.com"
//             }
//         },
//         {
//             "title": "Oakmont Partners Has Increased Apple (AAPL) Stake by $362173; Stock Price Rose; Leggett & Platt (LEG) Holder Speece Thorson Capital Group Trimmed Stake as Share Value Rose",
//             "description": "Oakmont Partners Llc increased its stake in Apple Inc (AAPL) by 25.33% based on its latest 2019Q1 regulatory filing with the SEC. Oakmont Partners Llc bought ...",
//             "url": "https://stocksbeat.com/2019/08/10/trending-stock-news/oakmont-partners-has-increased-apple-aapl-stake-by-362173-stock-price-rose-leggett-platt-leg-holder-speece-thorson-capital-group-trimmed-stake-as-share-value-rose/",
//             "image": null,
//             "publishedAt": "2019-08-10 05:52:00 UTC",
//             "source": {
//                 "name": "Stocks Beat",
//                 "url": "https://stocksbeat.com"
//             }
//         },
//         {
//             "title": "Apple's ASMR Venture, LOL Samsung, AAPL Buybacks with Charlotte Henry",
//             "description": "Apple has posted plenty of “Shot on iPhone”: videos, but four new ASMR videos mark the first time where the *content* is more about the experience than it is ...",
//             "url": "https://www.macobserver.com/podcasts/apples-asmr-venture-lol-samsung-aapl-buybacks-charlotte-henry-acm-520/",
//             "image": null,
//             "publishedAt": "2019-08-10 00:04:01 UTC",
//             "source": {
//                 "name": "The Mac Observer",
//                 "url": "https://www.macobserver.com"
//             }
//         },
//         {
//             "title": "Can AAPL Escape the Tariff War?",
//             "description": "Shares of Apple (AAPL) have been volatile, to say the least, since the start of 2018. With the trade war raging on, Apple's margins could take a huge hit.",
//             "url": "https://marketrealist.com/2019/08/can-aapl-escape-tariff-war/",
//             "image": "https://lh5.googleusercontent.com/proxy/7lGsL_K5_b1eeVdsJf1Bu5oSjRMjC5WieusmrkdVVc4m6wI_PBggHLhr0FhOvW4ykZK5T3NAXM8rM0UAbDQOX-h3PiVTpwJmNghYeqxkaj8yRCjOdENZ=-c",
//             "publishedAt": "2019-08-09 18:22:07 UTC",
//             "source": {
//                 "name": "Market Realist",
//                 "url": "https://marketrealist.com"
//             }
//         },
//         {
//             "title": "Turtle Creek Asset Management Has Increased Its Pra Group (PRAA) Stake by $3.13 Million as Stock Value Rose; Academy Capital Management Maintains Position in Apple Computer (AAPL)",
//             "description": "Turtle Creek Asset Management Inc increased its stake in Pra Group Inc (PRAA) by 3.01% based on its latest 2019Q1 regulatory filing with the SEC. Turtle Creek ...",
//             "url": "https://enherald.com/turtle-creek-asset-management-has-increased-its-pra-group-praa-stake-by-3-13-million-as-stock-value-rose-academy-capital-management-maintains-position-in-apple-computer-aapl/",
//             "image": null,
//             "publishedAt": "2019-08-09 17:29:21 UTC",
//             "source": {
//                 "name": "The EN Herald",
//                 "url": "https://enherald.com"
//             }
//         }
//     ]
// }
// const bitCoinBody = {
//     "timestamp": 1565505549,
//     "articleCount": 10,
//     "articles": [
//         {
//             "title": "The Bitcoin Bulls Look Set for Another Weekly Gain. But It Isn’t Plane Sailing…",
//             "description": "Bitcoin gives the broader market a boost early on. The bulls will need to a return to $12000 levels for the majors to cut the current week losses.",
//             "url": "https://finance.yahoo.com/news/bitcoin-bulls-look-set-another-005216594.html",
//             "image": null,
//             "publishedAt": "2019-08-10 20:52:00 UTC",
//             "source": {
//                 "name": "Yahoo Finance",
//                 "url": "https://finance.yahoo.com"
//             }
//         },
//         {
//             "title": "Bitcoin (BTC) Price Upsurge Anchors Stellar (XLM) And Cardano (ADA) Out Of The Downtrend",
//             "description": "Bitcoin is currently maintaining itself at $11876. The same is causing an uptrend in the market. Many coins have started recovering from yesterday's drop.",
//             "url": "https://www.cryptonewsz.com/bitcoin-btc-price-upsurge-anchors-stellar-xlm-and-cardano-ada-out-of-the-downtrend/36029/",
//             "image": null,
//             "publishedAt": "2019-08-10 19:59:45 UTC",
//             "source": {
//                 "name": "CryptoNewsZ",
//                 "url": "https://www.cryptonewsz.com"
//             }
//         },
//         {
//             "title": "Bitcoin (BTC) Price Upsurge Anchors Stellar (XLM) And Cardano (ADA) Out Of The Downtrend",
//             "description": "Bitcoin is currently maintaining itself at $11876. The same is causing an uptrend in the market. Many coins have started recovering from yesterday's drop.",
//             "url": "https://www.cryptonewsz.com/bitcoin-btc-price-upsurge-anchors-stellar-xlm-and-cardano-ada-out-of-the-downtrend/36029/",
//             "image": null,
//             "publishedAt": "2019-08-10 19:56:11 UTC",
//             "source": {
//                 "name": "CryptoNewsZ",
//                 "url": "https://www.cryptonewsz.com"
//             }
//         },
//         {
//             "title": "Bitcoin (BTC) Price Upsurge Anchors Stellar (XLM) And Cardano (ADA) Out Of The Downtrend",
//             "description": "Bitcoin is currently maintaining itself at $11876. The same is causing an uptrend in the market. Many coins have started recovering from yesterday's drop.",
//             "url": "https://www.cryptonewsz.com/bitcoin-btc-price-upsurge-anchors-stellar-xlm-and-cardano-ada-out-of-the-downtrend/36029/",
//             "image": null,
//             "publishedAt": "2019-08-10 19:40:46 UTC",
//             "source": {
//                 "name": "CryptoNewsZ",
//                 "url": "https://www.cryptonewsz.com"
//             }
//         },
//         {
//             "title": "Bitcoin Price Drops on the Day as Altcoins Send Mixed Messages",
//             "description": "",
//             "url": "https://cointelegraph.com/news/bitcoin-price-drops-on-the-day-as-altcoins-send-mixed-messages",
//             "image": null,
//             "publishedAt": "2019-08-10 18:10:00 UTC",
//             "source": {
//                 "name": "Cointelegraph",
//                 "url": "https://cointelegraph.com"
//             }
//         },
//         {
//             "title": "Bitcoin Price Drops on the Day as Altcoins Send Mixed Messages",
//             "description": "Bitcoin price stumbles while altcoins report mixed, mostly red activity, with Cardano currently winning the day among top 20 coins.",
//             "url": "https://cointelegraph.com/news/bitcoin-price-drops-on-the-day-as-altcoins-send-mixed-messages",
//             "image": null,
//             "publishedAt": "2019-08-10 18:10:00 UTC",
//             "source": {
//                 "name": "Cointelegraph",
//                 "url": "https://cointelegraph.com"
//             }
//         },
//         {
//             "title": "Bitcoin Price Drops on the Day as Altcoins Send Mixed Messages",
//             "description": "Saturday, Aug. 10 — the top 20 cryptocurrencies are reporting largely reddish movement on the day, as Bitcoin (BTC) price saw a sudden dip earlier today.",
//             "url": "https://cointelegraph.com/news/bitcoin-price-drops-on-the-day-as-altcoins-send-mixed-messages",
//             "image": null,
//             "publishedAt": "2019-08-10 18:10:00 UTC",
//             "source": {
//                 "name": "Cointelegraph",
//                 "url": "https://cointelegraph.com"
//             }
//         },
//         {
//             "title": "Ethereum vs Bitcoin: ETH Recovers Sluggishly as Compared to BTC",
//             "description": "Bitcoin is correcting up after a plunge near $11796, meanwhile, Ethereum is yet to see any notable price recovery; Ethereum is still resuming a bearish ...",
//             "url": "https://www.cryptonewsz.com/ethereum-vs-bitcoin-eth-recovers-sluggishly-as-compared-to-btc/36051/",
//             "image": null,
//             "publishedAt": "2019-08-10 18:01:48 UTC",
//             "source": {
//                 "name": "CryptoNewsZ",
//                 "url": "https://www.cryptonewsz.com"
//             }
//         },
//         {
//             "title": "Ethereum vs Bitcoin: ETH Recovers Sluggishly as Compared to BTC",
//             "description": "Bitcoin is correcting up after a plunge near $11796, meanwhile, Ethereum is yet to see any notable price recovery; Ethereum is still resuming a bearish ...",
//             "url": "https://www.cryptonewsz.com/ethereum-vs-bitcoin-eth-recovers-sluggishly-as-compared-to-btc/36051/",
//             "image": null,
//             "publishedAt": "2019-08-10 17:41:16 UTC",
//             "source": {
//                 "name": "CryptoNewsZ",
//                 "url": "https://www.cryptonewsz.com"
//             }
//         },
//         {
//             "title": "Who Is David Marcus: Bitcoin Believer Turned Facebook’s Libra Boss",
//             "description": "David Marcus, the man who has come to personify the seismic change in the global financial system, has come a long way to the helm of Facebook's Libra.",
//             "url": "https://cointelegraph.com/news/who-is-david-marcus-bitcoin-believer-turned-facebooks-libra-boss",
//             "image": null,
//             "publishedAt": "2019-08-10 17:03:00 UTC",
//             "source": {
//                 "name": "Cointelegraph",
//                 "url": "https://cointelegraph.com"
//             }
//         }
//     ]
// }

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

export const trends = functions.https.onRequest((req, res) => {
    const allowedOrigins: Array<String> = ['http://localhost:4200', 'https://www.ventrips.com'];
    const origin: any = req.headers.origin;
    if (_.indexOf(allowedOrigins, origin) > -1) {
         res.setHeader('Access-Control-Allow-Origin', origin);
    }

    request(`https://gapi.xyz/api/v3/search?q=${req.query.q}&token=9d0d7434d0964972e47f18e1862e821a`, function (error: any, response: any, body: any) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        if (error) {
            res.send(response.statusCode).send(error);
        }
        const data = JSON.parse(body);
        // * START
        // let data = {};
        // if (_.isEqual(_.toLower(req.query.q), 'aapl')) {
        //     body = applBody;
        // } else if (_.isEqual(_.toLower(req.query.q), 'bitcoin')) {
        //     body = bitCoinBody;
        // }
        // tempResponse
        // const response = {
        //     statusCode: 200
        // }
        // * END
        _.forEach(_.get(data, ['articles']), (article: any) => {
            const newSentiment = new Sentiment();
            const bagOfWords = _.join(_.compact(_.split(_.replace(_.toLower(`${_.get(article, ['title'])} ${_.get(article, ['description'])}`), /[^a-zA-Z0-9]/g, ' '), ' ')), ' ');
            const sentiment = newSentiment.analyze(bagOfWords);
            article.sentiment = sentiment;
        });
        const overallSentiment = new Sentiment();
        data.overallSentiment = overallSentiment.analyze(_.join(_.reduce(_.get(data, ['articles']), (list, article: any) => _.concat(list, article.sentiment.tokens), []), ' '));
        res.status(response.statusCode).send(data);
    });



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
