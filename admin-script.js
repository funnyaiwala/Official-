// Firebase SDKs Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Configuration (Same as original)
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
// 1. WELCOME ANIMATION & AUTH STATE
// ==========================================
let isAnimationDone = false;
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (isAnimationDone) showCorrectScreen();
});

// Premium Welcome Screen Timing
setTimeout(() => {
    isAnimationDone = true;
    document.getElementById("welcome-screen").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("welcome-screen").classList.add("hidden");
        showCorrectScreen();
    }, 800);
}, 3000);

function showCorrectScreen() {
    if (currentUser) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-dashboard").classList.remove("hidden");
        
        // Soft fade in for dashboard
        document.getElementById("admin-dashboard").style.opacity = "0";
        document.getElementById("admin-dashboard").style.transition = "opacity 0.8s ease";
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

    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...`;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorText.classList.add("hidden");
    } catch (error) {
        errorText.classList.remove("hidden");
        errorText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Invalid Credentials!`;
    }
    btn.innerHTML = `Authenticate <i class="fa-solid fa-arrow-right-to-bracket"></i>`;
});

window.logoutAdmin = () => { signOut(auth); };

// ==========================================
// 3. TAB SWITCHING LOGIC (Smooth Transitions)
// ==========================================
window.switchTab = function(tabName) {
    // Hide all sections and re-trigger animation
    document.querySelectorAll(".admin-section").forEach(sec => {
        sec.classList.add("hidden");
        sec.classList.remove("fade-in-up");
    });
    
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    
    const activeSec = document.getElementById(`${tabName}-sec`);
    activeSec.classList.remove("hidden");
    void activeSec.offsetWidth; // Trigger reflow for animation
    activeSec.classList.add("fade-in-up");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        if(btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(tabName)) {
            btn.classList.add("active");
        }
    });
};

// ==========================================
// 4. FIREBASE CRUD LOGIC
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
            if(!data.title || !data.fileName) throw "App Name and File Name are required.";
        } 
        else if (category === 'documents') {
            data.title = document.getElementById("doc-title").value;
            data.type = document.getElementById("doc-type").value;
            data.fileName = document.getElementById("doc-filename").value;
            if(!data.title || !data.fileName) throw "Document Title and File Name are required.";
        }
        else if (category === 'notes') {
            data.title = document.getElementById("note-title").value;
            data.content = document.getElementById("note-content").value;
            data.fileName = document.getElementById("note-filename").value;
            if(!data.title || !data.fileName) throw "Note Title and File Name are required.";
        }

        await addDoc(collection(db, category), data);
        document.querySelectorAll("input[type=text], textarea").forEach(input => input.value = "");
        alert(`Deploy Successful: ${category.slice(0,-1).toUpperCase()} saved on server!`);
        loadData(); 
    } catch (error) {
        alert(error.message || error);
    }
}

// Fetch Items & Inject Premium UI
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
                
                window.allData[category][id] = data; // Save to global object

                if (category === "apps") {
                    html += createListHTML(data.title, `Size: ${data.appSize} | Req: ${data.appReq}`, data.fileName, 'apps', id, 'text-blue');
                } else if (category === "documents") {
                    html += createListHTML(data.title, data.type.toUpperCase() + " Format", data.fileName, 'documents', id, 'text-green');
                } else if (category === "notes") {
                    html += createListHTML(data.title, data.content, data.fileName, 'notes', id, 'text-purple');
                }
            });

            const statMap = { 'apps': 'app-count', 'documents': 'doc-count', 'notes': 'note-count' };
            document.getElementById(statMap[category]).innerText = count;

            if (count === 0) {
                html = `<div class="loading-state"><i class="fa-solid fa-ghost" style="font-size:1.5rem; margin-bottom:10px;"></i><br>No active endpoints found.</div>`;
            }
            document.getElementById(`${category}-list`).innerHTML = html;

        } catch (error) {
            console.error("Error loading data:", error);
        }
    });
}

// Delete Item
window.deleteItem = async function(category, id) {
    if(confirm("CRITICAL ACTION: Are you sure you want to permanently delete this from the live server?")) {
        try {
            await deleteDoc(doc(db, category, id));
            loadData(); 
        } catch (error) {
            alert("Error deleting item!");
        }
    }
}

// Generate Admin List HTML (Premium Classes)
function createListHTML(title, subtitle, filename, category, id, titleColorClass) {
    return `
    <div class="admin-list-card">
        <div class="admin-card-info">
            <h4 class="${titleColorClass}">${title}</h4>
            <p>${subtitle}</p>
            <span class="file-badge"><i class="fa-solid fa-server"></i> ${filename}</span>
        </div>
        <div class="action-btns">
            <button onclick="openEditModal('${category}', '${id}')" class="action-btn edit-btn" title="Edit Data"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteItem('${category}', '${id}')" class="action-btn delete-btn" title="Delete Data"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>`;
}

// ==========================================
// 5. EDIT MODAL LOGIC (New UI Integration)
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
            <div class="input-group"><label>App Icon Name</label><input type="text" id="edit-app-icon" value="${data.appIcon || ''}"></div>
            <div class="input-group"><label>App Name</label><input type="text" id="edit-app-title" value="${data.title || ''}"></div>
            <div class="input-group"><label>APK File Name</label><input type="text" id="edit-app-filename" value="${data.fileName || ''}"></div>
            <div class="input-group"><label>App Size</label><input type="text" id="edit-app-size" value="${data.appSize || ''}"></div>
            <div class="input-group"><label>Requirements</label><input type="text" id="edit-app-req" value="${data.appReq || ''}"></div>
        `;
    } else if (category === "documents") {
        html = `
            <div class="input-group"><label>Document Title</label><input type="text" id="edit-doc-title" value="${data.title || ''}"></div>
            <div class="input-group">
                <label>Document Type</label>
                <div class="select-wrapper">
                    <select id="edit-doc-type">
                        <option value="word" ${data.type==='word'?'selected':''}>Word / Doc</option>
                        <option value="excel" ${data.type==='excel'?'selected':''}>Excel / Xlsx</option>
                        <option value="ppt" ${data.type==='ppt'?'selected':''}>PowerPoint / PPT</option>
                        <option value="html" ${data.type==='html'?'selected':''}>HTML / Web</option>
                        <option value="svg" ${data.type==='svg'?'selected':''}>SVG / XML Vector</option>
                    </select>
                </div>
            </div>
            <div class="input-group"><label>File Name</label><input type="text" id="edit-doc-filename" value="${data.fileName || ''}"></div>
        `;
    } else if (category === "notes") {
        html = `
            <div class="input-group"><label>Note Title</label><input type="text" id="edit-note-title" value="${data.title || ''}"></div>
            <div class="input-group"><label>Content snippet</label><textarea id="edit-note-content" rows="4">${data.content || ''}</textarea></div>
            <div class="input-group"><label>File Name</label><input type="text" id="edit-note-filename" value="${data.fileName || ''}"></div>
        `;
    }
    
    container.innerHTML = html;
    
    // Reset Modal Animation
    const modalOverlay = document.getElementById("edit-modal");
    const editBox = modalOverlay.querySelector('.edit-box');
    modalOverlay.classList.remove("hidden");
    editBox.classList.remove("scale-in");
    void editBox.offsetWidth;
    editBox.classList.add("scale-in");
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
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;

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
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Changes`;
});

// ==========================================
// 6. UPDATE MASTER PASSWORD
// ==========================================
window.changePassword = async function() {
    const newPassword = document.getElementById("new-password").value;
    const msgBox = document.getElementById("password-msg");

    if (newPassword.trim() === "") return alert("Please enter a secure password!");

    try {
        await setDoc(doc(db, "settings", "security"), { password: newPassword });
        msgBox.classList.remove("hidden");
        setTimeout(() => { msgBox.classList.add("hidden"); }, 4000);
        document.getElementById("new-password").value = "";
    } catch (error) {
        alert("Error updating cryptographic key.");
    }
}
