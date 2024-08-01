const { Expo } = require('expo-server-sdk');
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} = require("firebase/firestore/lite");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "feed-556ee.firebaseapp.com",
  projectId: "feed-556ee",
  storageBucket: "feed-556ee.appspot.com",
  messagingSenderId: "823154327432",
  appId: "1:823154327432:web:59a35ac6c25560d8a1c43d"
};

let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false // this can be set to true in order to use the FCM v1 API
})

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const pushTokensCollection = collection(db, "push_tokens");

getDocs(
  query(
    pushTokensCollection,
    where(
      "updatedAt",
      ">=",
      Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 24 * 30)
    ),
    orderBy("updatedAt", "desc")
  )
).then((snapshot) => {

  /** @type {Array<String>} */
  const tokens = [];

  snapshot.forEach((doc) => {
    /**
     * @type {{total: String, updatedAt: Timestamp}}
     */
    const {token, updatedAt} = doc.data();

    if (!Expo.isExpoPushToken(token)) {
      console.error(`::notice::Push token ${token} is not a valid Expo push token`);
      deleteDoc(doc);
      return;
    }

    tokens.push(token)
  })

  const messages = tokens.reduce((acc, token) => {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`::notice::Push token ${token} is not a valid Expo push token`);
      return acc;
    }

    acc.push({
      to: token,
      data: { refresh: true },
    });

    return acc;
  }, []);

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    console.log(`::group::Send notification (${messages.length})`);
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        ticketChunk.forEach((ticket) => {
          if (ticket.status === 'ok') {
            console.log(ticket.id);
          } else {
            console.error('::error::' + ticket.message);
          }
        })
        
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(`::error::${error}`);
      }
    }
    console.log(`::endgroup::`);
  })();
});
