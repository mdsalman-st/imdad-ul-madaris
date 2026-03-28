import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCZTzeqYz_KSzxUsZtYsxYeXS00FkGZKA0",
    authDomain: "tableeg-ba0e5.firebaseapp.com",
    projectId: "tableeg-ba0e5",
    storageBucket: "tableeg-ba0e5.firebasestorage.app",
    messagingSenderId: "201862792828",
    appId: "1:201862792828:web:b598a523833d5a6f1a2bf9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.login = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 🔥 YAHAN HAI ASLI JADU: Database se role check karo
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === "madarsa") {
                // Agar Madarsa hai toh uske dashboard par bhejo
                window.location.href = "madarsa-dashboard.html";
            } else {
                // Agar Normal user hai toh main home page par bhejo
                window.location.href = "index.html";
            }
        } else {
            alert("User ka data database mein nahi mila!");
        }

    } catch (error) {
        alert("Galti hui: " + error.message);
    }
};
