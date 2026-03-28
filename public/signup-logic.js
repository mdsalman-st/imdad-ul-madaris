import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
// Firestore (Database) ko import kar rahe hain
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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
const db = getFirestore(app); // Database chalu ho gaya

document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;

    if (!email || !password) {
        alert("Email aur Password bharna zaroori hai!");
        return;
    }

    try {
        // 1. Auth mein user banate hain
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Data prepare karte hain Database ke liye
        let userData = {
            email: email,
            role: userType,
            createdAt: new Date()
        };

        if (userType === "normal") {
            userData.name = document.getElementById('normalName').value;
            userData.phone = document.getElementById('normalPhone').value;
            userData.status = "active"; // Normal user turant active ho jayega
        } else {
            userData.madarsaName = document.getElementById('madarsaName').value;
            userData.registrationNumber = document.getElementById('madarsaReg').value;
            userData.status = "pending_kyc"; // Madarsa verification ke liye rukega
        }

        // 3. Database (Firestore) mein save karte hain
        await setDoc(doc(db, "users", user.uid), userData);

        alert("Mubarak ho! Account successfully ban gaya.");
        window.location.href = "login.html"; // Login page par bhej do

    } catch (error) {
        alert("Galti hui: " + error.message);
    }
});