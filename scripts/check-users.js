// Firebase初期化
const admin = require('firebase-admin');

// Firebase設定
const serviceAccount = {
  apiKey: "AIzaSyBhJvfBU2LNYlXaxwcZ8aR49nMGG2AV0MM",
  authDomain: "glasses1-582eb.firebaseapp.com",
  projectId: "glasses1-582eb",
  storageBucket: "glasses1-582eb.firebasestorage.app",
  messagingSenderId: "481608487323",
  appId: "1:481608487323:web:a09edd74e0e39aff5a113e",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ユーザー一覧を取得
db.collection('users').get()
  .then((snapshot) => {
    console.log('=== 登録済みユーザー ===');
    snapshot.forEach((doc) => {
      console.log(doc.id, ':', doc.data());
    });
    console.log('合計:', snapshot.size, 'ユーザー');
  })
  .catch((error) => {
    console.error('エラー:', error);
  });
