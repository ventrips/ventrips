import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import * as puppeteer from 'puppeteer';
const Sentiment = require('sentiment');

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

export const render = functions.https.onRequest(async (request, response) => {
    // Launch a browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Pass a URL via a query param
    const requestURL = request.query.requestURL;

    // Visit the page a get content
    const page = await browser.newPage()
    await page.goto(requestURL, { waitUntil: 'networkidle0' })

    const sections = await page.$$('.Box-row');
    const responseBody = [];
    for (const section of sections) {
        const url = await section.$eval(
            'h1 a',
            (item: any) => item.getAttribute('href'),
        );
        const title = await section.$eval(
            'h1',
            (item: any) => item.innerText.trim().replace(/\n/g, ' '),
        );
        const description = await section.$eval(
            'p',
            (item: any) => item.innerText.trim().replace(/\n/g, ' '),
        );
        const newSentiment = new Sentiment()
        const sentiment = newSentiment.analyze(description);
        const obj = {
            url,
            title,
            description,
            sentiment
        };
        responseBody.push(obj);
    }
    response.status(200).send(responseBody);
    // const content = await page.content();
    // const content = await page.evaluate(el => el.innerHTML, await page.$('p'));
    // Send the response
    // var sentiment = new Sentiment();
    // var result = sentiment.analyze(content);
    // response.send(result);
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
