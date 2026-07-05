// Firebase SDKs Import karna (Added 'updateDoc' for Editing)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Global Object to store data for Editing
window.allData = { apps: {}, documents: {}, notes: {} };

// ==========================================
// 1. WELCOME ANIMATION & AUTHENTICATION STATE
// ==========================================
let isAnimationDone = false;
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (isAnimationDone) showCorrectScreen();
});

setTimeout(() => {
    isAnimationDone = true;
    document.getElementById("welcome-screen").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("welcome-screen").classList.add("hidden");
        showCorrectScreen();
    }, 800);
}, 2500);

function showCorrectScreen() {
    if (currentUser) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-dashboard").classList.remove("hidden");
        
        document.getElementById("admin-dashboard").style.opacity = "0";
        document.getElementById("admin-dashboard").style.transition = "opacity 0.5s ease";
        setTimeout(() => { document.getElementById("admin-dashboard").style.opacity = "1"; }, 50);

        loadData(); 
    } else {
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

window.logoutAdmin = () => { signOut(auth); };

// ==========================================
// 3. TAB SWITCHING LOGIC
// ==========================================
window.switchTab = function(tabName) {
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`${tabName}-sec`).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        if(btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(tabName)) {
            btn.classList.add("active");
        }
    });
};

// ==========================================
// 4. FIREBASE CRUD LOGIC (UPLOAD, READ, DELETE, EDIT)
// ==========================================

// Upload New Item
window.uploadItem = async function(category) {
    let data = { timestamp: Date.now() };

    try {
        if (category === 'apps') {
            data.appIcon = document.getElementById("app-icon").value;
            data.title = document.getElementById("app-title").value;
            data.fileName = document.getElementById("app-filename").value;
            data.appSize = document.getElementById("app-size").value;
            data.appReq = document.getElementById("app-req").value;
            if(!data.title || !data.fileName) throw "Please enter App Title and File Name";
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

        await addDoc(collection(db, category), data);
        document.querySelectorAll("input[type=text], textarea").forEach(input => input.value = "");
        alert(`${category.slice(0,-1).toUpperCase()} details saved on server!`);
        loadData(); 
    } catch (error) {
        alert(error.message || error);
    }
}

// Fetch Items
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
                const id = docSnap.id; 
                
                window.allData[category][id] = data; // Save to global object for Editing

                if (category === "apps") {
                    html += createListHTML(data.title, `Size: ${data.appSize} | Req: ${data.appReq}`, data.fileName, 'apps', id, '#3b82f6');
                } else if (category === "documents") {
                    html += createListHTML(data.title, data.type.toUpperCase() + " File", data.fileName, 'documents', id, '#f97316');
                } else if (category === "notes") {
                    html += createListHTML(data.title, data.content, data.fileName, 'notes', id, '#c084fc');
                }
            });

            const statMap = { 'apps': 'app-count', 'documents': 'doc-count', 'notes': 'note-count' };
            document.getElementById(statMap[category]).innerText = count;

            if (count === 0) html = "<p style='color: #94a3b8;'>No items uploaded yet.</p>";
            document.getElementById(`${category}-list`).innerHTML = html;

        } catch (error) {
            console.error("Error loading data:", error);
        }
    });
}

// Delete Item
window.deleteItem = async function(category, id) {
    if(confirm("Are you sure you want to permanently delete this from server?")) {
        try {
            await deleteDoc(doc(db, category, id));
            loadData(); 
        } catch (error) {
            alert("Error deleting item!");
        }
    }
}

// Generate Admin List HTML (Added Edit Button)
function createListHTML(title, subtitle, filename, category, id, color) {
    return `
    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <div style="flex: 1; min-width: 0;">
            <h4 style="color:${color}; margin-bottom: 5px; font-size:1rem;">${title}</h4>
            <p style="font-size: 0.8rem; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</p>
            <small style="color: #64748b;">File: ${filename}</small>
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="openEditModal('${category}', '${id}')" style="background: #3b82f6; color: white; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteItem('${category}', '${id}')" style="background: #ef4444; color: white; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>`;
}

// ==========================================
// 5. EDIT MODAL LOGIC (New Feature)
// ==========================================
window.currentEditCategory = "";
window.currentEditId = "";

window.openEditModal = function(category, id) {
    window.currentEditCategory = category;
    window.currentEditId = id;
    const data = window.allData[category][id];
    const container = document.getElementById("edit-form-container");

    let html = "";
    if (category === "apps") {
        html = `
            <input type="text" id="edit-app-icon" value="${data.appIcon || ''}" placeholder="App Icon Name">
            <input type="text" id="edit-app-title" value="${data.title || ''}" placeholder="App Name">
            <input type="text" id="edit-app-filename" value="${data.fileName || ''}" placeholder="APK File Name">
            <input type="text" id="edit-app-size" value="${data.appSize || ''}" placeholder="App Size (e.g. 15 MB)">
            <input type="text" id="edit-app-req" value="${data.appReq || ''}" placeholder="Requirements">
        `;
    } else if (category === "documents") {
        html = `
            <input type="text" id="edit-doc-title" value="${data.title || ''}" placeholder="Document Title">
            <select id="edit-doc-type">
                <option value="word" ${data.type==='word'?'selected':''}>Word / Doc</option>
                <option value="excel" ${data.type==='excel'?'selected':''}>Excel / Xlsx</option>
                <option value="ppt" ${data.type==='ppt'?'selected':''}>PowerPoint / PPT</option>
                <option value="html" ${data.type==='html'?'selected':''}>HTML / Web</option>
                <option value="svg" ${data.type==='svg'?'selected':''}>SVG / XML Vector</option>
            </select>
            <input type="text" id="edit-doc-filename" value="${data.fileName || ''}" placeholder="File Name">
        `;
    } else if (category === "notes") {
        html = `
            <input type="text" id="edit-note-title" value="${data.title || ''}" placeholder="Note Title">
            <textarea id="edit-note-content" placeholder="Note content" rows="4">${data.content || ''}</textarea>
            <input type="text" id="edit-note-filename" value="${data.fileName || ''}" placeholder="File Name">
        `;
    }
    
    container.innerHTML = html;
    document.getElementById("edit-modal").classList.remove("hidden");
}

window.closeEditModal = function() {
    document.getElementById("edit-modal").classList.add("hidden");
}

// Save changes to Firebase
document.getElementById("save-edit-btn").addEventListener("click", async () => {
    const category = window.currentEditCategory;
    const id = window.currentEditId;
    let updateData = {};
    const btn = document.getElementById("save-edit-btn");
    btn.innerText = "Saving...";

    if (category === "apps") {
        updateData.appIcon = document.getElementById("edit-app-icon").value;
        updateData.title = document.getElementById("edit-app-title").value;
        updateData.fileName = document.getElementById("edit-app-filename").value;
        updateData.appSize = document.getElementById("edit-app-size").value;
        updateData.appReq = document.getElementById("edit-app-req").value;
    } else if (category === "documents") {
        updateData.title = document.getElementById("edit-doc-title").value;
        updateData.type = document.getElementById("edit-doc-type").value;
        updateData.fileName = document.getElementById("edit-doc-filename").value;
    } else if (category === "notes") {
        updateData.title = document.getElementById("edit-note-title").value;
        updateData.content = document.getElementById("edit-note-content").value;
        updateData.fileName = document.getElementById("edit-note-filename").value;
    }

    try {
        await updateDoc(doc(db, category, id), updateData);
        window.closeEditModal();
        loadData(); // Refresh list
    } catch(e) {
        alert("Error updating data: " + e.message);
    }
    btn.innerText = "Save Changes";
});

// ==========================================
// 6. UPDATE USER PASSWORD IN DB
// ==========================================
window.changePassword = async function() {
    const newPassword = document.getElementById("new-password").value;
    const msgBox = document.getElementById("password-msg");

    if (newPassword.trim() === "") return alert("Please enter a valid password!");

    try {
        await setDoc(doc(db, "settings", "security"), { password: newPassword });
        msgBox.classList.remove("hidden");
        setTimeout(() => { msgBox.classList.add("hidden"); }, 4000);
        document.getElementById("new-password").value = "";
    } catch (error) {
        alert("Error updating password.");
    }
}
