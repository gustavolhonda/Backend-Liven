
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
