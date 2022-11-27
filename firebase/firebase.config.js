// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app")
const { getAnalytics } = require("firebase/analytics")
const { getMessaging } = require("firebase/messaging")
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//     apiKey: "AIzaSyC4RR1aK8L3t3zL3PMG7GYtQs_uPtP1LQw",
//     authDomain: "mini-project-369811.firebaseapp.com",
//     projectId: "mini-project-369811",
//     storageBucket: "mini-project-369811.appspot.com",
//     messagingSenderId: "548381311452",
//     appId: "1:548381311452:web:98bab81aa75d597f244f19",
//     measurementId: "G-71VZ13D4BZ"
// }
const firebaseConfig = {
    apiKey: "AIzaSyCboTXQ9W23HXD2t-qM8PE1GnAMKhDKKAY",
    authDomain: "psychic-apex-334206.firebaseapp.com",
    databaseURL: "https://psychic-apex-334206-default-rtdb.firebaseio.com/",
    projectId: "psychic-apex-334206",
    storageBucket: "psychic-apex-334206.appspot.com",
    messagingSenderId: "738057478646",
    appId: "1:738057478646:web:1887444f60df21bb1a27d7",
    measurementId: "${config.measurementId}"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)
const analytics = getAnalytics(app)

module.exports = { messaging, analytics }