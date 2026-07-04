// Firebase SDKs Import karna
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Aapka Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAV38UqBfRwfmITkx-izewPjI4WMYQCa4",
  authDomain: "site-a2e87.firebaseapp.com",
  projectId: "site-a2e87",
  storageBucket: "site-a2e87.firebasestorage.app",
  messagingSenderId: "801671545026",
  appId: "1:801671545026:web:005b61f1272cf0f03cfb5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 1. WELCOME ANIMATION & AUTHENTICATION STATE
// ==========================================
let isAnimationDone = false;
let currentUser = null;

// Check user login state
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (isAnimationDone) {
        showCorrectScreen();
    }
});

// Run Welcome Animation for 2.5s
setTimeout(() => {
    isAnimationDone = true;
    document.getElementById("welcome-screen").style.opacity = "0";
    
    setTimeout(() => {
        document.getElementById("welcome-screen").classList.add("hidden");
        showCorrectScreen();
    }, 800);
}, 2500);

// Faisla karna ki Login dikhana hai ya Dashboard
function showCorrectScreen() {
    if (currentUser) {
        // User is logged in
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-dashboard").classList.remove("hidden");
        
        // Fade-in dashboard
        document.getElementById("admin-dashboard").style.opacity = "0";
        document.getElementById("admin-dashboard").style.transition = "opacity 0.5s ease";
        setTimeout(() => { document.getElementById("admin-dashboard").style.opacity = "1"; }, 50);

        loadData(); // Server se data laao
    } else {
        // User is not logged in
        document.getElementById("admin-dashboard").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
    }
}

// ==========================================
// 2. LOGIN & LOGOUT LOGIC
// ==========================================
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-login-password").value;
    const btn = document.getElementById("login-btn");
    const errorText = document.getElementById("login-error");

    if(!email || !password) return;

    btn.innerText = "Logging in...";
    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorText.classList.add("hidden");
    } catch (error) {
        errorText.classList.remove("hidden");
        errorText.innerText = "Invalid Email or Password!";
    }
    btn.innerText = "Login securely";
});

window.logoutAdmin = () => {
    signOut(auth);
};

// ==========================================
// 3. TAB SWITCHING LOGIC
// ==========================================
window.switchTab = function(tabName) {
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));

    document.getElementById(`${tabName}-sec`).classList.remove("hidden");

    // Make the clicked button active
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if(btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(tabName)) {
            btn.classList.add("active");
        }
    });
};

// ==========================================
// 4. FIREBASE CRUD LOGIC (UPLOAD, READ, DELETE)
// ==========================================

// Add New Item to Firestore
window.uploadItem = async function(category) {
    let data = { timestamp: Date.now() };

    try {
        if (category === 'apps') {
            data.title = document.getElementById("app-title").value;
            data.desc = document.getElementById("app-desc").value;
            data.fileName = document.getElementById("app-filename").value;
            if(!data.title || !data.fileName) throw "Please enter Title and File Name";
        } 
        else if (category === 'documents') {
            data.title = document.getElementById("doc-title").value;
            data.type = document.getElementById("doc-type").value;
            data.fileName = document.getElementById("doc-filename").value;
            if(!data.title || !data.fileName) throw "Please enter Title and File Name";
        }
        else if (category === 'notes') {
            data.title = document.getElementById("note-title").value;
            data.content = document.getElementById("note-content").value;
            data.fileName = document.getElementById("note-filename").value;
            if(!data.title || !data.fileName) throw "Please enter Title and File Name";
        }

        // Save to Firebase
        await addDoc(collection(db, category), data);
        
        // Clear Inputs
        document.querySelectorAll("input[type=text], textarea").forEach(input => input.value = "");
        alert(`${category.slice(0,-1).toUpperCase()} details saved on server!`);
        
        loadData(); // Refresh UI
    } catch (error) {
        alert(error.message || error);
    }
}

// Fetch Items from Firestore
window.loadData = async function() {
    const categories = ["apps", "documents", "notes"];
    
    categories.forEach(async (category) => {
        try {
            const querySnapshot = await getDocs(collection(db, category));
            let html = "";
            let count = 0;

            querySnapshot.forEach((docSnap) => {
                count++;
                const data = docSnap.data();
                const id = docSnap.id; // Firebase unique ID

                if (category === "apps") {
                    html += createListHTML(data.title, data.desc, data.fileName, 'apps', id, '#3b82f6');
                } else if (category === "documents") {
                    html += createListHTML(data.title, data.type.toUpperCase() + " File", data.fileName, 'documents', id, '#f97316');
                } else if (category === "notes") {
                    html += createListHTML(data.title, data.content, data.fileName, 'notes', id, '#c084fc');
                }
            });

            // Update Counts in Dashboard
            const statMap = { 'apps': 'app-count', 'documents': 'doc-count', 'notes': 'note-count' };
            document.getElementById(statMap[category]).innerText = count;

            if (count === 0) html = "<p style='color: #94a3b8;'>No items uploaded yet.</p>";
            
            document.getElementById(`${category}-list`).innerHTML = html;

        } catch (error) {
            console.error("Error loading data:", error);
        }
    });
}

// Delete Item from Firestore
window.deleteItem = async function(category, id) {
    if(confirm("Are you sure you want to permanently delete this from server?")) {
        try {
            await deleteDoc(doc(db, category, id));
            loadData(); // Refresh UI
        } catch (error) {
            alert("Error deleting item!");
        }
    }
}

// Helper: Generate HTML for Admin List
function createListHTML(title, subtitle, filename, category, id, color) {
    return `
    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h4 style="color:${color}; margin-bottom: 5px;">${title}</h4>
            <p style="font-size: 0.8rem; color: #cbd5e1; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</p>
            <small style="color: #64748b;">Linked File: ${filename}</small>
        </div>
        <button onclick="deleteItem('${category}', '${id}')" style="background: #ef4444; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-trash"></i></button>
    </div>`;
}

// ==========================================
// 5. UPDATE USER PANEL PASSWORD IN DB
// ==========================================
window.changePassword = async function() {
    const newPassword = document.getElementById("new-password").value;
    const msgBox = document.getElementById("password-msg");

    if (newPassword.trim() === "") {
        return alert("Please enter a valid password!");
    }

    try {
        // Save to Firebase "settings/security" document
        await setDoc(doc(db, "settings", "security"), { password: newPassword });
        
        msgBox.classList.remove("hidden");
        setTimeout(() => { msgBox.classList.add("hidden"); }, 4000);
        document.getElementById("new-password").value = "";
    } catch (error) {
        alert("Error updating password. Check database rules.");
    }
}
