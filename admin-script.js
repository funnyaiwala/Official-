
// Firebase SDKs Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Configuration
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
// 1. SYSTEM INITIALIZATION & AUTH STATE
// ==========================================
let isAnimationDone = false;
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (isAnimationDone) showCorrectScreen();
});

// Clean Material Loader Timing
setTimeout(() => {
    isAnimationDone = true;
    const loader = document.getElementById("welcome-screen");
    loader.style.opacity = "0";
    setTimeout(() => {
        loader.classList.add("hidden");
        showCorrectScreen();
    }, 400);
}, 1500);

function showCorrectScreen() {
    if (currentUser) {
        document.getElementById("login-screen").classList.add("hidden");
        const dashboard = document.getElementById("admin-dashboard");
        dashboard.classList.remove("hidden");
        
        dashboard.style.opacity = "0";
        dashboard.style.transition = "opacity 0.5s ease";
        setTimeout(() => { dashboard.style.opacity = "1"; }, 50);

        loadData(); 
    } else {
        document.getElementById("admin-dashboard").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
    }
}

// ==========================================
// 2. AUTHENTICATION (LOGIN / LOGOUT)
// ==========================================
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-login-password").value;
    const btn = document.getElementById("login-btn");
    const errorText = document.getElementById("login-error");

    if(!email || !password) return;

    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...`;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorText.classList.add("hidden");
    } catch (error) {
        errorText.classList.remove("hidden");
    }
    btn.innerHTML = `Login`;
});

window.logoutAdmin = () => { signOut(auth); };

// ==========================================
// 3. MOBILE SIDEBAR LOGIC (FIXED)
// ==========================================
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        adminSidebar.classList.add('show');
    });
}

if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
        adminSidebar.classList.remove('show');
    });
}

// ==========================================
// 4. CONSOLE NAVIGATION (TAB SWITCHING)
// ==========================================
window.switchTab = function(tabName) {
    // Hide all sections
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    
    // Show Target Section
    document.getElementById(`${tabName}-sec`).classList.remove("hidden");

    // Activate Nav Button
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if(btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(tabName)) {
            btn.classList.add("active");
        }
    });

    // Close sidebar on mobile after clicking a tab
    if (window.innerWidth <= 900) {
        adminSidebar.classList.remove('show');
    }

    // Update Header Title Dynamically
    const titles = {
        'dashboard': 'Dashboard Overview',
        'apps': 'Manage Apps',
        'documents': 'Manage Documents',
        'notes': 'Manage Notes',
        'settings': 'Security Settings'
    };
    document.getElementById("current-section-title").innerText = titles[tabName] || 'Admin Console';
};

// ==========================================
// 5. FIREBASE CRUD LOGIC (MATERIAL UI)
// ==========================================

// Deploy / Upload New Item
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
        alert(`${category.slice(0,-1).toUpperCase()} saved successfully!`);
        loadData(); 
    } catch (error) {
        alert(error.message || error);
    }
}

// Fetch Records & Inject Material UI Lists
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
                    html += createListHTML(data.title, `Size: ${data.appSize || 'N/A'} | Req: ${data.appReq || 'None'}`, data.fileName, 'apps', id);
                } else if (category === "documents") {
                    html += createListHTML(data.title, `Type: ${data.type.toUpperCase()}`, data.fileName, 'documents', id);
                } else if (category === "notes") {
                    html += createListHTML(data.title, data.content || 'No description.', data.fileName, 'notes', id);
                }
            });

            // Update Dashboard Metrics
            const statMap = { 'apps': 'app-count', 'documents': 'doc-count', 'notes': 'note-count' };
            document.getElementById(statMap[category]).innerText = count;

            if (count === 0) {
                html = `<div class="material-loader">
                            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                            No records found.
                        </div>`;
            }
            document.getElementById(`${category}-list`).innerHTML = html;

        } catch (error) {
            console.error("Data Fetch Error:", error);
        }
    });
}

// Delete Record
window.deleteItem = async function(category, id) {
    if(confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
        try {
            await deleteDoc(doc(db, category, id));
            loadData(); 
        } catch (error) {
            alert("Error: Unable to delete record.");
        }
    }
}

// Minimal Material List HTML Generator
function createListHTML(title, subtitle, filename, category, id) {
    return `
    <div class="admin-list-card">
        <div class="admin-card-info">
            <h4>${title}</h4>
            <p>${subtitle}</p>
            <span class="file-badge"><i class="fa-solid fa-file-code"></i> ${filename}</span>
        </div>
        <div class="action-btns">
            <button onclick="openEditModal('${category}', '${id}')" class="icon-btn" style="color: var(--primary);" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteItem('${category}', '${id}')" class="icon-btn" style="color: var(--danger);" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>`;
}

// ==========================================
// 6. EDIT MODAL (Form Integration)
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
            <div class="form-group full-width"><label>App Name</label><input type="text" id="edit-app-title" class="form-control" value="${data.title || ''}"></div>
            <div class="form-group full-width"><label>APK File Name</label><input type="text" id="edit-app-filename" class="form-control" value="${data.fileName || ''}"></div>
            <div class="form-group"><label>Icon File Name</label><input type="text" id="edit-app-icon" class="form-control" value="${data.appIcon || ''}"></div>
            <div class="form-group"><label>App Size</label><input type="text" id="edit-app-size" class="form-control" value="${data.appSize || ''}"></div>
            <div class="form-group full-width"><label>Requirements</label><input type="text" id="edit-app-req" class="form-control" value="${data.appReq || ''}"></div>
        `;
    } else if (category === "documents") {
        html = `
            <div class="form-group full-width"><label>Document Title</label><input type="text" id="edit-doc-title" class="form-control" value="${data.title || ''}"></div>
            <div class="form-group">
                <label>Format</label>
                <select id="edit-doc-type" class="form-control">
                    <option value="word" ${data.type==='word'?'selected':''}>Word (.docx)</option>
                    <option value="excel" ${data.type==='excel'?'selected':''}>Excel (.xlsx)</option>
                    <option value="ppt" ${data.type==='ppt'?'selected':''}>PowerPoint (.ppt)</option>
                    <option value="html" ${data.type==='html'?'selected':''}>HTML Web File</option>
                    <option value="svg" ${data.type==='svg'?'selected':''}>SVG Vector</option>
                </select>
            </div>
            <div class="form-group"><label>File Name</label><input type="text" id="edit-doc-filename" class="form-control" value="${data.fileName || ''}"></div>
        `;
    } else if (category === "notes") {
        html = `
            <div class="form-group full-width"><label>Note Title</label><input type="text" id="edit-note-title" class="form-control" value="${data.title || ''}"></div>
            <div class="form-group full-width"><label>Content</label><textarea id="edit-note-content" class="form-control" rows="3">${data.content || ''}</textarea></div>
            <div class="form-group full-width"><label>File Name</label><input type="text" id="edit-note-filename" class="form-control" value="${data.fileName || ''}"></div>
        `;
    }
    
    container.innerHTML = html;
    document.getElementById("edit-modal").classList.remove("hidden");
}

window.closeEditModal = function() {
    document.getElementById("edit-modal").classList.add("hidden");
}

// Save Changes
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
        loadData(); // Refresh records
    } catch(e) {
        alert("Error updating record: " + e.message);
    }
    btn.innerText = "Save Changes";
});

// ==========================================
// 7. CHANGE ADMIN PASSWORD
// ==========================================
window.changePassword = async function() {
    const newPassword = document.getElementById("new-password").value;
    const msgBox = document.getElementById("password-msg");

    if (newPassword.trim() === "") return alert("Please enter a new password!");

    try {
        await setDoc(doc(db, "settings", "security"), { password: newPassword });
        msgBox.classList.remove("hidden");
        setTimeout(() => { msgBox.classList.add("hidden"); }, 4000);
        document.getElementById("new-password").value = "";
    } catch (error) {
        alert("Error updating password.");
    }
}
