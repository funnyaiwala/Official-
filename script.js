// Firebase SDKs Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAV38UqBfRwfmITkx-izewPjI4WMYQCa4",
  authDomain: "site-a2e87.firebaseapp.com",
  projectId: "site-a2e87",
  storageBucket: "site-a2e87.firebasestorage.app",
  messagingSenderId: "801671545026",
  appId: "1:801671545026:web:005b61f1272cf0f03cfb5b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Variables
let SYSTEM_PASSWORD = "310726";
let isUnlocked = false;
let requestedSection = "";

// Security Fetch
async function fetchLatestPassword() {
    try {
        const docRef = doc(db, "settings", "security");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) SYSTEM_PASSWORD = docSnap.data().password;
    } catch (e) { console.log("Security Init Error"); }
}
fetchLatestPassword();

// UI Elements
const profileSection = document.getElementById("profile-section");
const contentSection = document.getElementById("content-section");
const settingsSection = document.getElementById("settings-section");
const passwordModal = document.getElementById("password-modal");
const passwordInput = document.getElementById("access-password");
const errorMsg = document.getElementById("error-msg");
const contentArea = document.getElementById("content-area");

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
const mobileNavPanel = document.getElementById('mobile-nav-panel');

mobileMenuBtn.addEventListener('click', () => {
    mobileNavPanel.classList.toggle('show');
});

// ==========================================
// FAST NATIVE IMAGE VIEWER LOGIC 
// ==========================================
const viewerModal = document.getElementById('image-viewer-modal');
const viewerImageSrc = document.getElementById('viewer-image-src');
const viewerTitle = document.getElementById('viewer-title');
const viewerDownloadBtn = document.getElementById('viewer-download-btn');

document.getElementById('close-viewer-btn').addEventListener('click', () => {
    viewerModal.classList.add('hidden');
    viewerImageSrc.src = ""; // Memory clean karo
});

// Window function taaki HTML onclick use kar sake
window.openImageViewer = function(imageUrl, imageTitle) {
    viewerTitle.innerText = imageTitle || 'Image File';
    viewerImageSrc.src = imageUrl;
    viewerDownloadBtn.href = imageUrl;
    viewerModal.classList.remove('hidden');
};

// Navigation Setup
const navMappings = [
    { id: 'nav-home', action: showProfile },
    { id: 'nav-apps', action: () => requestAccess("apps") },
    { id: 'nav-documents', action: () => requestAccess("documents") },
    { id: 'nav-notes', action: () => requestAccess("notes") },
    { id: 'nav-settings', action: showSettings }
];

navMappings.forEach(nav => {
    const desk = document.getElementById(nav.id);
    const mob = document.getElementById(nav.id + '-mobile');
    if(desk) desk.addEventListener("click", nav.action);
    if(mob) mob.addEventListener("click", () => { mobileNavPanel.classList.remove('show'); nav.action(); });
});

// Security Access
function requestAccess(section) {
    requestedSection = section;
    if (isUnlocked) {
        openSection(section);
    } else {
        passwordInput.value = "";
        errorMsg.classList.add("hidden");
        passwordModal.classList.remove("hidden");
    }
}

// Modal Logic
document.getElementById("cancel-btn").addEventListener("click", () => passwordModal.classList.add("hidden"));
document.getElementById("submit-btn").addEventListener("click", verifyPassword);

function verifyPassword() {
    if (passwordInput.value === SYSTEM_PASSWORD) {
        isUnlocked = true;
        passwordModal.classList.add("hidden");
        openSection(requestedSection);
    } else {
        errorMsg.classList.remove("hidden");
    }
}

// Sections Switcher
function hideAllSections() {
    profileSection.classList.add("hidden");
    contentSection.classList.add("hidden");
    settingsSection.classList.add("hidden");
}

function showProfile() { hideAllSections(); profileSection.classList.remove("hidden"); updateActiveMenu("nav-home"); }
function showSettings() { hideAllSections(); settingsSection.classList.remove("hidden"); updateActiveMenu("nav-settings"); }

function openSection(section) {
    hideAllSections();
    contentSection.classList.remove("hidden");
    document.getElementById("section-title").innerText = section.charAt(0).toUpperCase() + section.slice(1);
    updateActiveMenu("nav-" + section);
    renderContent(section);
}

function updateActiveMenu(activeId) {
    document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
    if(document.getElementById(activeId)) document.getElementById(activeId).classList.add('active');
    if(document.getElementById(activeId + '-mobile')) document.getElementById(activeId + '-mobile').classList.add('active');
}

// Render Data
async function renderContent(section) {
    contentArea.innerHTML = `<div class="material-loader"><i class="fa-solid fa-circle-notch fa-spin"></i><span>Loading...</span></div>`;
    
    try {
        const querySnapshot = await getDocs(collection(db, section));
        let html = "";
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const filePath = `uploads/${data.fileName}`;
            const ext = data.fileName ? data.fileName.split('.').pop().toLowerCase() : "";
            
            // Check if file is an image
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

            if (section === "apps") {
                html += `
                    <div class="material-card">
                        ${data.appIcon ? `<img src="uploads/${data.appIcon}" style="width:50px; border-radius:12px; margin-bottom:10px;">` : ''}
                        <h3>${data.title}</h3>
                        <p>Size: ${data.appSize || 'N/A'}</p>
                        <a href="${filePath}" download class="btn btn-filled">Download</a>
                    </div>`;
            } else if (section === "documents") {
                html += `
                    <div class="material-list-item">
                        <div class="icon-circle"><i class="fa-solid fa-file-lines"></i></div>
                        <div class="list-content"><h4>${data.title}</h4></div>
                        <a href="${filePath}" target="_blank" class="btn btn-text">Open</a>
                    </div>`;
            } else if (section === "notes") {
                if (isImage) {
                    // Fast Viewer trigger directly on the card
                    html += `
                        <div class="material-list-item" style="cursor: pointer;" onclick="openImageViewer('${filePath}', '${data.title}')">
                            <div class="icon-circle"><i class="fa-solid fa-image"></i></div>
                            <div class="list-content">
                                <h4>${data.title}</h4>
                                <p>Tap to View Image</p>
                            </div>
                        </div>`;
                } else {
                    // Standard document reader
                    html += `
                        <div class="material-list-item">
                            <div class="icon-circle"><i class="fa-solid fa-book"></i></div>
                            <div class="list-content">
                                <h4>${data.title}</h4>
                                <p>Read Note</p>
                            </div>
                            <a href="${filePath}" target="_blank" class="btn btn-text">Read</a>
                        </div>`;
                }
            }
        });
        contentArea.innerHTML = html || `<p style="text-align:center; padding:40px;">No content found.</p>`;
    } catch (e) {
        contentArea.innerHTML = `<p style="color:red; text-align:center;">Error loading records.</p>`;
    }
}
