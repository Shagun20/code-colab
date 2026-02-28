import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { createContext, useContext, useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { linkWithPopup } from "firebase/auth";

import { getDatabase, ref, set, remove, off, get, onValue, child, push, update , onChildAdded, onChildChanged} from "firebase/database";

// const starCountRef = ref(db, 'posts/' + postId + '/starCount');
// onValue(starCountRef, (snapshot) => {
//   const data = snapshot.val();
//   updateStarCount(postElement, data);
// });



function subscribeToRoom(roomId, callback) {
  const db = getDatabase();


  const roomRef = ref(db, `root/rooms/${roomId}`);

  // onValue returns an 'unsubscribe' function
  const unsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // Send the data back to the component
  });

  return unsubscribe;
}

function subscribeToEditor(roomId, callback) {
  const db = getDatabase();

  const roomRef = ref(db, `root/liveContent/${roomId}/editor/`);

  // onValue returns an 'unsubscribe' function
  const unsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // Send the data back to the component
  });

  return unsubscribe;
}

function writeCode(roomId, data, link = '') {
  const db = getDatabase();

  //add fields like

  update(ref(db, `root/liveContent/${roomId}/editor/${link}`), data).then(() => {
    console.log('Data saved to editor successfully')
  })
    .catch((error) => {
      console.log("Error Saving Editor Data", error);
    });;
}

function subscribeToChat(roomId, callback) {
  const db = getDatabase();

  const roomRef = ref(db, `root/liveContent/${roomId}/chat/`);

  // onValue returns an 'unsubscribe' function
  const unsubscribe = onChildAdded(roomRef, (snapshot) => {
    const newMsg = snapshot.val();
    callback(newMsg); // Send the data back to the component
  });



  return unsubscribe;
}


async function sendMsg(roomId, data, link = 'msg') {
  const db = getDatabase();

  //add fields like

  push(ref(db, `root/liveContent/${roomId}/chat/`), data).then(() => {
    console.log('Data saved to chat successfully')
  })
    .catch((error) => {
      console.log("Error Saving chat Data", error);
    });;
}

const authenticate = async (uid) => {

}

const getRoomData = async (roomId, path = '') => {
  const db = getDatabase();

  const dbRef = ref(db);
  const room_snapshot = await get(child(dbRef, `root/rooms/${roomId}/${path}`));

  if (room_snapshot.exists()) {
    return (room_snapshot.val()); // This is your room object
  } else {
    console.log("No room found");
    return null;
  }
};

function writeRoomData(data, link) {
  const db = getDatabase();

  set(ref(db, 'root/rooms/' + link), data).then(() => {
    console.log('Data saved to rooms successfully')
  })
    .catch((error) => {
      console.log("Error Saving Room Data", error);
    });;
}

async function updateRoomData(data, room_id, path) {
  const db = getDatabase();

  const Ref = ref(db, `root/rooms/${room_id}/${path}`);

  await update(Ref, data);


}

function writeUserData(data, link) {
  const db = getDatabase();

  set(ref(db, 'root/users/' + link), data).then(() => {
    console.log('Data saved to users successfully')
  })
    .catch((error) => {
      console.log("Error Saving User Data", error);
    });;
}







const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const Firebasecontext = createContext(null);





const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Success! Welcome,", user);
    return user; // ← this was missing
  } catch (error) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/popup-blocked'
    ) {
      console.log("Popup closed, try again");
      return null;
    }
    console.error("Authentication Error:", error.message);
    alert("Failed to sign in. Please try again.");
    return null;
  }
};

async function pushWhiteboardStroke(roomId, stroke) {
  const db = getDatabase();
  const strokesRef = ref(db, `root/liveContent/${roomId}/whiteboard/strokes`);
  await push(strokesRef, stroke);
}

/**
 * Fires once per existing stroke on mount, then once per new stroke.
 * Never triggers a full redraw — each stroke is painted incrementally.
 */
function subscribeToWhiteboardStrokes(roomId, onStroke) {
  const db = getDatabase();
  const strokesRef = ref(db, `root/liveContent/${roomId}/whiteboard/strokes`);
  // onChildAdded returns the unsubscribe function directly
  return onChildAdded(strokesRef, (snapshot) => {
    onStroke({ key: snapshot.key, stroke: snapshot.val() });
  });
}

/**
 * Fires only when the strokes node is deleted (i.e. clearWhiteboard was called).
 * Tells the canvas to wipe itself without touching individual strokes.
 */
function subscribeToWhiteboardClear(roomId, onClear) {
  const db = getDatabase();
  const strokesRef = ref(db, `root/liveContent/${roomId}/whiteboard/strokes`);
  // onValue returns unsubscribe — return it directly so useEffect cleanup works
  return onValue(strokesRef, (snapshot) => {
    if (!snapshot.exists()) onClear();
  });
}

/**
 * Delete all strokes — clears the board for everyone.
 */
async function clearWhiteboard(roomId) {
  const db = getDatabase();
  const strokesRef = ref(db, `root/liveContent/${roomId}/whiteboard/strokes`);
  await remove(strokesRef);
}

// ─────────────────────────────────────────────────────────────────────────────


export const FirebaseProvider = (props) => {
  return (
    <Firebasecontext.Provider value={{ handleGoogleSignIn, sendMsg, subscribeToEditor, subscribeToChat, writeCode, subscribeToRoom, updateRoomData, writeRoomData, writeUserData, getRoomData, ensureAnonymousUser, getUserId 
      , pushWhiteboardStroke,
      subscribeToWhiteboardStrokes,
      subscribeToWhiteboardClear,
      clearWhiteboard,
    }}>

      {props.children}

    </Firebasecontext.Provider>
  )
};

export const useFirebase = () => useContext(Firebasecontext);
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const getUserId = () => {
  const [userId, setUserId] = useState('');
  const auth = getAuth();

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return userId;
};

export const ensureAnonymousUser = () => {
  const auth = getAuth();
  return new Promise((resolve, reject) => {

    // Otherwise, sign in anonymously
    signInAnonymously(auth)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
      })
      .catch(reject);
  });
};