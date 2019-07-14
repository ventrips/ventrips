import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as _ from 'lodash';

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

const universal  = require(`${process.cwd()}/dist/server`).app;
export const angularUniversalFunction = functions.https.onRequest(universal);

export const createUserRoles = functions.firestore
.document('users/{uid}')
.onCreate(async snap => {
    // const customer = await stripe.customers.create({
    //     metadata: { firebaseUID: snap.data()!.uid }
    // });
    return db.doc(`users/${snap.data()!.uid}`).update({
        // stripeId: _.get(customer, ['id']),
        roles: {
            admin: false,
            editor: false,
            subscriber: false,
        },
        joined: admin.firestore.FieldValue.serverTimestamp()
    });
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
