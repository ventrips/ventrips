const functions = require('firebase-functions');
import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import { cors } from './utils';
const Trends = require('./trends');
const Travel = require('./travel');

admin.initializeApp();
const db = admin.firestore();
export * from './news-api';
export * from './alpha-vantage-api';
// export * from './yahoo-finance-api';

// import * as Stripe from 'stripe';
// const stripe = new Stripe(functions.config().stripe.secret);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const searchNews = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request: any, response: any): Promise<any> => {
    cors(request, response);
    Trends.searchNews(request, response, false);
});

export const chartTrends = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onRequest(async (request: any, response: any): Promise<any> => {
    cors(request, response);
    const useMock = _.isEqual(_.toLower(_.get(request, 'query.mock')), 'true');
    const data = await Trends.chartTrends(request, response, useMock);

    response.send(data);
});

export const trends = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onRequest(async (request: any, response: any): Promise<any> => {
    cors(request, response);
    const useMock = _.isEqual(_.toLower(_.get(request, 'query.mock')), 'true');
    const isLocal = _.isEqual(_.toLower(_.get(request, 'query.local')), 'true');
    const data = await Trends.trends(request, response, useMock);

    if (isLocal) {
        response.send(data);
    } else {
        const final = _.assign(data, {updated: admin.firestore.FieldValue.serverTimestamp()});
        // USE POSTMAN - http://localhost:5001/ventrips-website/us-central1/trends?mock=false&local=true
        return db.doc(`trends/trends`).set(final).then((res) => {
            response.send(final);
        }).catch((error) => {
            response.send(error);
        });
    }
});

export const getTravelNumbers = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onRequest(async (request: any, response: any): Promise<any> => {
    cors(request, response);
    const useMock = _.isEqual(_.toLower(_.get(request, 'query.mock')), 'true');
    const isLocal = _.isEqual(_.toLower(_.get(request, 'query.local')), 'true');
    const data = await Travel.getTravelNumbers(request, response, useMock);

    if (isLocal) {
        response.send(data);
    } else {
        const final = _.assign(data, {updated: admin.firestore.FieldValue.serverTimestamp()});
        // USE POSTMAN - http://localhost:5001/ventrips-website/us-central1/travelNumbers?mock=false&local=false
        return db.doc(`travel/travelNumbers`).set(final).then((res) => {
            response.send(final);
        }).catch((error) => {
            response.send(error);
        });
    }
});

const universal  = require(`${process.cwd()}/dist/server`).app;
export const angularUniversalFunction = functions.runWith({ timeoutSeconds: 540, memory: '2GB' }).https.onRequest(universal);

export const createUserRoles = functions.firestore
.document('users/{uid}')
.onCreate(async (snapshot: { data: () => any; }) => {
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

// export const subscribeToTopic = functions.https.onCall(
//     async (data, context) => {
//         await admin.messaging().subscribeToTopic(data.token, _.capitalize(data.topic));

//       return `Subscribed to ${_.capitalize(data.topic)}`;
//     }
// );

// export const unsubscribeFromTopic = functions.https.onCall(
//     async (data, context) => {
//         await admin.messaging().unsubscribeFromTopic(data.token, _.capitalize(data.topic));

//         return `Unsubscribed from ${_.capitalize(data.topic)}`;
//     }
// );

// export const sendPushNotification = functions.firestore
// .document('notifications/{notificationId}')
// .onCreate(async (snapshot, context) => {
//     const fcm = snapshot.data();

//     const notification: admin.messaging.Notification = {
//         title: _.get(fcm, ['title'], 'We made some new updates'),
//         body: _.get(fcm, ['body'], 'Come check it out!')
//     };

//     const payload: admin.messaging.Message = {
//         notification,
//         webpush: {
//           notification: {
//             vibrate: [200, 100, 200],
//             icon: _.get(fcm, ['icon'], 'https://www.ventrips.com/favicon.ico'),
//             click_action: _.get(fcm, ['link'], 'https://www.ventrips.com/')
//           }
//         },
//         topic: _.capitalize('Ventrips')
//     };

//     return admin.messaging().send(payload);
// });

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
