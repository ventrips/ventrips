import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as _ from 'lodash';
const Utils = require('./utils');
const Predict = require('./predict');
const Trends = require('./trends');

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

export const predict = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    // const json = require('./../mocks/predict/predict.json');
    // response.send(json);
    // return;

    // const googleTrends: Array<any> = await Predict.getGoogleTrends(request, response, seekingAlphaEarningsDate, true);

    // return db.doc(`users/${snapshot.data()!.uid}`).update({
    //     // stripeId: _.get(customer, ['id']),
    //     roles: {
    //         admin: false,
    //         editor: false,
    //         subscriber: false,
    //     },
    //     joined: admin.firestore.FieldValue.serverTimestamp()
    // });

    const useMock = false;

    /* Earnings */
    const seekingAlphaEarnings: Array<any> = await Predict.getSeekingAlphaEarnings(request, response, useMock);

    /* Tickers */
    const stockTwitsTickers: Array<any> = await Predict.getStockTwitsTickers(request, response, useMock);
    const yahooTickers: Array<any> = await Predict.getYahooTickers(request, response, useMock);

    /* News */
    const seekingAlphaEarningsNews: Array<any> = await Predict.getSeekingAlphaNews(request, response, useMock);
    const marketWatchNews: Array<any> = await Predict.getMarketWatchNews(request, response, useMock);
    const businessInsiderNews: Array<any> = await Predict.getBusinessInsiderNews(request, response, useMock);
    const reutersNews: Array<any> = await Predict.getReutersNews(request, response, useMock);
    const barronsNews: Array<any> = await Predict.getBarronsNews(request, response, useMock);
    const theFlyNews: Array<any> = await Predict.getTheFlyNews(request, response, useMock);

    /* Forums */
    const hackerForums: Array<any> = await Predict.getHackerForums(request, response, useMock);
    const redditForums: Array<any> = await Predict.getRedditForums(request, response, useMock);
    const fourChanForums: Array<any> = await Predict.get4ChanForums(request, response, useMock);

    const final = {
        // trends: {
        //     googleTrends
        // }
        earnings: {
            seekingAlphaEarnings
        },
        tickers: {
            stockTwitsTickers
            ,yahooTickers
        }
        ,news: {
            seekingAlphaEarningsNews
            ,marketWatchNews
            ,businessInsiderNews
            ,reutersNews
            ,barronsNews
            ,theFlyNews
        }
        ,forums: {
            hackerForums
            ,redditForums
            ,fourChanForums
        }
    };

    const isProduction = _.get(request, ['query', 'production']);
    if (_.isEqual(_.toLower(isProduction), 'true')) {
        // USE POSTMAN - http://localhost:5001/ventrips-website/us-central1/predict?production=true
        return db.doc(`trends/predict`).set(final).then((res) => {
            response.send(final);
        }).then((error) => {
            response.send(error);
        });
    } else {
        response.send(final);
    }
});

export const trends = functions.https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    Trends.trends(request, response, false);
});

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
