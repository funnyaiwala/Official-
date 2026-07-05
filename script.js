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
        console.log("Error fetching security protocol", e);
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

// Mobile Menu Logic
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNavPanel = document.querySelector('.mobile-nav-panel');

mobileMenuBtn.addEventListener('click', () => {
    mobileNavPanel.classList.toggle('show');
    const icon = mobileMenuBtn.querySelector('i');
    if (mobileNavPanel.classList.contains('show')) {
        icon.classList.replace('ph-list', 'ph-x');
    } else {
        icon.classList.replace('ph-x', 'ph-list');
    }
});

function closeMobileMenu() {
    mobileNavPanel.classList.remove('show');
    mobileMenuBtn.querySelector('i').classList.replace('ph-x', 'ph-list');
}

// Navigation Listeners (Desktop & Mobile)
const navMappings = [
    { id: 'nav-home', action: showProfile },
    { id: 'nav-apps', action: () => requestAccess("apps") },
    { id: 'nav-documents', action: () => requestAccess("documents") },
    { id: 'nav-notes', action: () => requestAccess("notes") },
    { id: 'nav-settings', action: showSettings }
];

navMappings.forEach(nav => {
    // Desktop Nav
    const deskElement = document.getElementById(nav.id);
    if(deskElement) deskElement.addEventListener("click", nav.action);
    
    // Mobile Nav
    const mobElement = document.getElementById(nav.id + '-mobile');
    if(mobElement) mobElement.addEventListener("click", () => {
        closeMobileMenu();
        nav.action();
    });
});

// Security Access Logic
function requestAccess(section) {
    requestedSection = section;
    if (isUnlocked) {
        openSection(section);
    } else {
        passwordInput.value = "";
        errorMsg.classList.add("hidden");
        passwordModal.classList.remove("hidden");
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

// Helper: Re-trigger animation
function triggerAnimation(element) {
    element.style.animation = 'none';
    element.offsetHeight; /* trigger reflow */
    element.style.animation = null; 
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

    // Update Title
    const formattedTitle = section.charAt(0).toUpperCase() + section.slice(1);
    sectionTitle.innerText = `${formattedTitle} Repository`;
    document.querySelector('.section-meta').innerText = `Securely fetching ${section} data from ZenV servers.`;

    renderContent(section);
}

// Updated Active State logic
function updateActiveMenu(activeId) {
    document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
    
    const deskElement = document.getElementById(activeId);
    const mobElement = document.getElementById(activeId + '-mobile');
    
    if(deskElement) deskElement.classList.add('active');
    if(mobElement) mobElement.classList.add('active');
}

// FETCH & RENDER DATA WITH CORPORATE UI
async function renderContent(section) {
    // Professional Loading State
    contentArea.innerHTML = `
        <div class="corporate-loader">
            <i class="ph ph-spinner-gap spinner-icon"></i>
            <div>Establishing secure connection...</div>
        </div>`;
    
    let currentUrl = window.location.href.split('index.html')[0];
    if(!currentUrl.endsWith('/')) currentUrl += '/';

    try {
        const querySnapshot = await getDocs(collection(db, section));
        let html = "";
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

            // APPS SECTION
            if (section === "apps") {
                let iconHtml = data.appIcon ? 
                    `<img src="uploads/${data.appIcon}" alt="App Icon">` : 
                    `<i class="ph ph-android-logo" style="font-size: 48px; color: var(--accent-blue);"></i>`;

                html += `
                    <div class="corp-app-card">
                        <div class="app-icon-wrap">
                            ${iconHtml}
                        </div>
                        <h3>${data.title}</h3>
                        <div class="app-details">
                            <span><strong>Size:</strong> ${data.appSize || 'N/A'}</span>
                            <span><strong>Requires:</strong> ${data.appReq || 'Android'}</span>
                        </div>
                        <a href="${filePath}" download class="btn btn-primary btn-full">
                            Download Package
                        </a>
                    </div>`;
            } 
            // DOCUMENTS SECTION
            else if (section === "documents") {
                let icon = "ph-file-text";
                if(data.type === "excel") icon = "ph-file-xls";
                else if(data.type === "ppt") icon = "ph-projector-screen";
                else if(data.type === "html") icon = "ph-file-code";
                else if(data.type === "svg") icon = "ph-bezier-curve";

                html += `
                    <div class="corp-list-item">
                        <div class="list-icon"><i class="ph ${icon}"></i></div>
                        <div class="list-content">
                            <h4>${data.title}</h4>
                            <p>${ext} Format</p>
                        </div>
                        <a href="${viewerLink}" target="_blank" class="btn btn-outline">
                            View Document
                        </a>
                    </div>`;
            } 
            // NOTES SECTION
            else if (section === "notes") {
                html += `
                    <div class="corp-list-item" style="align-items: flex-start;">
                        <div class="list-icon"><i class="ph ph-book-open-text"></i></div>
                        <div class="list-content">
                            <h4>${data.title}</h4>
                            <p style="margin-top: 8px;">${data.content}</p>
                        </div>
                        <a href="${filePath}" target="_blank" class="btn btn-outline">
                            Read Note
                        </a>
                    </div>`;
            }
        });

        if (!itemsFound) {
            html += `
                <div class="corporate-loader">
                    <i class="ph ph-folder-open" style="font-size: 2.5rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <div>No resources available in this repository.</div>
                </div>`;
        }

        contentArea.innerHTML = html;

    } catch (error) {
        contentArea.innerHTML = `
            <div class="corporate-loader" style="color: #ef4444;">
                <i class="ph ph-warning-circle" style="font-size: 2.5rem; margin-bottom: 16px;"></i>
                <div>System failed to fetch data. Please contact administrator.</div>
            </div>`;
        console.error(error);
    }
}
