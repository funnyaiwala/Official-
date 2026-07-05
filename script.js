// Firebase SDKs Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Configuration (Aapka Original Config)
const firebaseConfig = {
  apiKey: "AIzaSyAAV38UqBfRwfmITkx-izewPjI4WMYQCa4",
  authDomain: "site-a2e87.firebaseapp.com",
  projectId: "site-a2e87",
  storageBucket: "site-a2e87.firebasestorage.app",
  messagingSenderId: "801671545026",
  appId: "1:801671545026:web:005b61f1272cf0f03cfb5b"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Variables
let SYSTEM_PASSWORD = "310726";
let isUnlocked = false;
let requestedSection = "";

// Database se Admin Password Fetch karna
async function fetchLatestPassword() {
    try {
        const docRef = doc(db, "settings", "security");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            SYSTEM_PASSWORD = docSnap.data().password;
        }
    } catch (e) {
        console.log("Error fetching password", e);
    }
}
fetchLatestPassword();

// DOM Elements
const profileSection = document.getElementById("profile-section");
const contentSection = document.getElementById("content-section");
const settingsSection = document.getElementById("settings-section");
const passwordModal = document.getElementById("password-modal");
const passwordInput = document.getElementById("access-password");
const errorMsg = document.getElementById("error-msg");
const sectionTitle = document.getElementById("section-title");
const contentArea = document.getElementById("content-area");

// Event Listeners for New Floating Dock Menu
document.getElementById("nav-home").addEventListener("click", showProfile);
document.getElementById("nav-apps").addEventListener("click", () => requestAccess("apps"));
document.getElementById("nav-documents").addEventListener("click", () => requestAccess("documents"));
document.getElementById("nav-notes").addEventListener("click", () => requestAccess("notes"));
document.getElementById("nav-settings").addEventListener("click", showSettings);

// Photo par click karne se Home par aane ka shortcut
const profilePic = document.querySelector(".profile-pic");
if(profilePic) {
    profilePic.style.cursor = "pointer";
    profilePic.title = "Go to Home";
    profilePic.addEventListener("click", showProfile);
}

// Security Access Logic
function requestAccess(section) {
    requestedSection = section;
    if (isUnlocked) {
        openSection(section);
    } else {
        passwordInput.value = "";
        errorMsg.classList.add("hidden");
        passwordModal.classList.remove("hidden");
        // Re-trigger animation on modal
        const modalContent = passwordModal.querySelector('.premium-modal');
        modalContent.classList.remove('scale-in');
        void modalContent.offsetWidth; // trigger reflow
        modalContent.classList.add('scale-in');
        
        setTimeout(() => passwordInput.focus(), 100);
    }
}

// Modal Buttons Events
document.getElementById("cancel-btn").addEventListener("click", () => {
    passwordModal.classList.add("hidden");
    requestedSection = "";
    if(!profileSection.classList.contains("hidden")) {
        updateActiveMenu("nav-home");
    }
});

document.getElementById("submit-btn").addEventListener("click", verifyPassword);
passwordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") verifyPassword();
});

function verifyPassword() {
    if (passwordInput.value === SYSTEM_PASSWORD) {
        isUnlocked = true;
        passwordModal.classList.add("hidden");
        openSection(requestedSection);
    } else {
        errorMsg.classList.remove("hidden");
        passwordInput.value = "";
    }
}

// Helper: Re-trigger fade animation for a section
function triggerAnimation(element) {
    element.classList.remove("fade-in-up");
    void element.offsetWidth; // trigger reflow
    element.classList.add("fade-in-up");
}

// Sections Hide/Show Logic
function hideAllSections() {
    profileSection.classList.add("hidden");
    contentSection.classList.add("hidden");
    settingsSection.classList.add("hidden");
}

function showProfile() {
    hideAllSections();
    profileSection.classList.remove("hidden");
    triggerAnimation(profileSection);
    updateActiveMenu("nav-home");
}

function showSettings() {
    hideAllSections();
    settingsSection.classList.remove("hidden");
    triggerAnimation(settingsSection);
    updateActiveMenu("nav-settings");
}

function openSection(section) {
    hideAllSections();
    contentSection.classList.remove("hidden");
    triggerAnimation(contentSection);
    updateActiveMenu("nav-" + section);

    // Update Title with subtle animation
    sectionTitle.style.opacity = 0;
    setTimeout(() => {
        sectionTitle.innerText = section.charAt(0).toUpperCase() + section.slice(1);
        sectionTitle.style.transition = "opacity 0.3s";
        sectionTitle.style.opacity = 1;
    }, 150);

    renderContent(section);
}

// Updated Dock Active State logic
function updateActiveMenu(activeId) {
    document.querySelectorAll('.dock-item').forEach(item => item.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

// FETCH & RENDER DATA WITH NEW PREMIUM UI
async function renderContent(section) {
    // New Premium Loading State
    contentArea.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <p>Syncing secure data...</p>
        </div>`;
    
    let currentUrl = window.location.href.split('index.html')[0];
    if(!currentUrl.endsWith('/')) currentUrl += '/';

    try {
        const querySnapshot = await getDocs(collection(db, section));
        
        // Inject Premium Grid/List Wrapper
        let wrapperClass = section === "apps" ? "premium-grid" : "premium-list";
        let html = `<div class="${wrapperClass}">`;
        let itemsFound = false;

        querySnapshot.forEach((docSnap) => {
            itemsFound = true;
            const data = docSnap.data();
            
            let filePath = `uploads/${data.fileName}`;
            let viewerLink = filePath;
            let ext = data.fileName ? data.fileName.split('.').pop().toUpperCase() : "FILE";

            // Microsoft Office Web Viewer Logic
            let isOfficeFile = ["DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX"].includes(ext);
            if (section === "documents" && isOfficeFile) {
                let absoluteUrl = currentUrl + filePath;
                viewerLink = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`;
            }

            // APPS SECTION (Premium Card)
            if (section === "apps") {
                let iconHtml = data.appIcon ? 
                    `<img src="uploads/${data.appIcon}" class="app-icon-img" alt="App Icon">` : 
                    `<i class="fa-brands fa-android" style="font-size: 3rem; color: #3b82f6; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(59,130,246,0.3));"></i>`;

                html += `
                    <div class="premium-app-card">
                        ${iconHtml}
                        <h3>${data.title}</h3>
                        <div class="app-meta">
                            <span>Size: ${data.appSize || 'N/A'}</span><br>
                            <span>Req: ${data.appReq || 'Android'}</span>
                        </div>
                        <a href="${filePath}" download class="btn btn-primary btn-small">
                            <i class="fa-solid fa-download"></i> Get App
                        </a>
                    </div>`;
            } 
            // DOCUMENTS SECTION (Premium List)
            else if (section === "documents") {
                let icon = "fa-file-word";
                let iconColor = "#3b82f6"; // Default Blue
                if(data.type === "excel") { icon = "fa-file-excel"; iconColor = "#10b981"; }
                else if(data.type === "ppt") { icon = "fa-file-powerpoint"; iconColor = "#f97316"; }
                else if(data.type === "html") { icon = "fa-file-code"; iconColor = "#8b5cf6"; }
                else if(data.type === "svg") { icon = "fa-bezier-curve"; iconColor = "#ec4899"; }

                html += `
                    <div class="premium-list-card">
                        <div class="icon-box" style="background: ${iconColor}20; color: ${iconColor};">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="list-info">
                            <h4>${data.title}</h4>
                            <p>${ext} FILE</p>
                        </div>
                        <a href="${viewerLink}" target="_blank" class="btn btn-primary btn-small" style="width: auto;">
                            <i class="fa-solid fa-eye"></i> View
                        </a>
                    </div>`;
            } 
            // NOTES SECTION (Premium List)
            else if (section === "notes") {
                html += `
                    <div class="premium-list-card" style="align-items: flex-start; flex-direction: column;">
                        <div style="display: flex; gap: 15px; width: 100%; align-items: center; margin-bottom: 10px;">
                            <div class="icon-box" style="background: rgba(139, 92, 246, 0.2); color: #c084fc;">
                                <i class="fa-solid fa-book-open"></i>
                            </div>
                            <div class="list-info">
                                <h4>${data.title}</h4>
                            </div>
                        </div>
                        <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 15px; width: 100%;">
                            ${data.content}
                        </p>
                        <a href="${filePath}" target="_blank" class="btn btn-primary btn-small">
                            <i class="fa-solid fa-book-reader"></i> Read Note
                        </a>
                    </div>`;
            }
        });

        if (!itemsFound) {
            html += `
                <div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 30px 0;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No ${section} uploaded yet.</p>
                </div>`;
        }

        html += `</div>`;
        contentArea.innerHTML = html;

    } catch (error) {
        contentArea.innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Failed to decrypt server data.</p>
            </div>`;
        console.error(error);
    }
}
