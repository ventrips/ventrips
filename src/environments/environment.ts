// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  name: 'Ventrips',
  description: `Ventrips provides you with a one-stop trip to read and discover all of the latest news and trends relating to travel, videography, technology, finance, and lifestyle.
  Don't miss out on the opportunity to learn from enthusiasts and experts on these topics!`,
  url: 'https://www.ventrips.com',
  firebase: {
    apiKey: 'AIzaSyDAb0y87YBB3GH6Qddod_PDiUqjFxpC1gQ',
    authDomain: 'ventrips.com',
    databaseURL: 'https://ventrips-website.firebaseio.com',
    projectId: 'ventrips-website',
    storageBucket: 'ventrips-website.appspot.com',
    messagingSenderId: '556585707956',
    appId: '1:556585707956:web:752f1d8777908fad'
  },
  googleAnalyticsKey: 'UA-124647836-1',
  facebookAppId: '512336042564323',
  stripe: {
    publishable: 'pk_test_IWmofXjm7bppd1LPP6djGq1Q00g1LfqTym'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
