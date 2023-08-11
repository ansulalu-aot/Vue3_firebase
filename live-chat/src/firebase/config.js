import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCsXFQ8SiujOV_peawC0Ific_82Ps4pPAE",
  authDomain: "vue3-firebase-372c5.firebaseapp.com",
  projectId: "vue3-firebase-372c5",
  storageBucket: "vue3-firebase-372c5.appspot.com",
  messagingSenderId: "685857425027",
  appId: "1:685857425027:web:93bb0706793a0183febdb6"
};

// init firebase
firebase.initializeApp(firebaseConfig)

const projectAuth = firebase.auth()
const projectFirestore = firebase.firestore()
const timestamp = firebase.firestore.FieldValue.serverTimestamp

export { projectAuth, projectFirestore, timestamp }