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
  (async () => {
    console.log(`::group::Send notification (${messages.length})`);
    for (let chunk of chunks) {
      try {
        const res = await Promise.allSettled(chunk.map(async (message) => {
          return {
            to: message.to,
            result: await fetch('https://api.expo.dev/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({to: message.to, data: message.data}),
            }).then(res => res.json())
          }
        }));

        res.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (typeof result.value?.result?.data?.id === 'string') {
              console.log('Sent to', result.value.to, 'with receipt', result.value?.result.data?.id);
            } else {
              console.error(`::error::Failed for`,  result.value.to, 'with message',  result.value?.result.data?.message);
            }
          } else {
            console.error(`::error::${result.reason}`);
          }
        });

      } catch (error) {
        console.error(`::error::${error}`);
      }
    }
    console.log(`::endgroup::`);
  })();
});
