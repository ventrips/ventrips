import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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

export const createStripeCustomer = functions.firestore
.document('users/{uid}')
.onCreate(async snap => {
    // const customer = await stripe.customers.create({
    //     metadata: { firebaseUID: user!.uid }
    // });
    return db.doc(`users/${snap.data()!.uid}`).update({
        stripeId: '123',
        joined: admin.firestore.FieldValue.serverTimestamp(),
        role: 'member' // Create member role
    });
});

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