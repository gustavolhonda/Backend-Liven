<<<<<<< HEAD

const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail

} = require("firebase/auth") ;

require("dotenv").config();

const firebase = require("firebase/app");

const admin = require('firebase-admin');
const serviceAccount = require("../firebaseService.json");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
};

module.exports = {admin};
=======


const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail

} = require("firebase/auth") ;

require("dotenv").config();

const firebase = require("firebase/app");

const admin = require('firebase-admin');
const serviceAccount = require("../firebaseService.json");

const firebaseConfig = {
  apiKey: "AIzaSyBFGOkbLs8_65y5Ppm0i492UESs_6s6abc",
  authDomain: "liven-6cb39.firebaseapp.com",
  projectId: "liven-6cb39",
  storageBucket: "liven-6cb39.appspot.com",
  messagingSenderId: "953739692990",
  appId: "1:953739692990:web:9bb68c35313f00ba59c7ef"
};

firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  admin
};
>>>>>>> test
