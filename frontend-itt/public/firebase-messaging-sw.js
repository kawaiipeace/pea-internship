importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyCU956rxWWYv_Egj5Ij77UuR1bJcXRMja8", 
  authDomain: "pea-internship-project.firebaseapp.com",
  projectId: "pea-internship-project",
  storageBucket: "pea-internship-project.firebasestorage.app",
  messagingSenderId: "15442760639",
  appId: "1:15442760639:web:72c22e3ae6ccc26dd6470a",
  measurementId: "G-VHERBLMJ5V",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'สติสตางค์';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo/192-white.svg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
