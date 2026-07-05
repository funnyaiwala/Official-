// Firebase SDKs ko CDN se Import karna
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Aapka Firebase Configuration
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

// Variables
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

// 🆕 Event Listeners for Bottom Menu (Added Home)
document.getElementById("nav-home").addEventListener("click", showProfile);
document.getElementById("nav-apps").addEventListener("click", () => requestAccess("apps"));
document.getElementById("nav-documents").addEventListener("click", () => requestAccess("documents"));
document.getElementById("nav-notes").addEventListener("click", () => requestAccess("notes"));
document.getElementById("nav-settings").addEventListener("click", showSettings);

// Photo par click karne se wapas Profile (Home) par aane ka shortcut
const profilePic = document.querySelector(".profile-pic");
if(profilePic) {
    profilePic.style.cursor = "pointer";
    profilePic.title = "Go to Home";
    profilePic.addEventListener("click", showProfile);
}

// Request Access Function
function requestAccess(section) {
    requestedSection = section;
    if (isUnlocked) {
        openSection(section);
    } else {
        passwordInput.value = "";
        errorMsg.classList.add("hidden");
        passwordModal.classList.remove("hidden");
        passwordInput.focus();
    }
}

// Modal Buttons Events
document.getElementById("cancel-btn").addEventListener("click", () => {
    passwordModal.classList.add("hidden");
    requestedSection = "";
    // Wapas home icon ko active kar do agar cancel kiya
    if(profileSection.classList.contains("hidden") === false) {
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

// Sections Hide/Show Logic
function hideAllSections() {
    profileSection.classList.add("hidden");
    contentSection.classList.add("hidden");
    settingsSection.classList.add("hidden");
}

function showProfile() {
    hideAllSections();
    profileSection.classList.remove("hidden");
    updateActiveMenu("nav-home");
}

function showSettings() {
    hideAllSections();
    settingsSection.classList.remove("hidden");
    updateActiveMenu("nav-settings");
}

function openSection(section) {
    hideAllSections();
    contentSection.classList.remove("hidden");
    updateActiveMenu("nav-" + section);

    sectionTitle.innerText = section.charAt(0).toUpperCase() + section.slice(1);
    renderContent(section);
}

function updateActiveMenu(activeId) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

// FIREBASE SE DATA FETCH KARKE SCREEN PAR DIKHANA
async function renderContent(section) {
    contentArea.innerHTML = `<p style="text-align: center; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching Data from Server...</p>`;
    
    let currentUrl = window.location.href.split('index.html')[0];
    if(!currentUrl.endsWith('/')) currentUrl += '/';

    try {
        const querySnapshot = await getDocs(collection(db, section));
        
        // 🆕 App section me CSS Grid layout add kiya gaya hai
        let wrapperClass = section === "apps" ? "content-grid-2" : "list-layout";
        let html = `<div style="padding: 10px 0;"><div class="${wrapperClass}">`;
        let itemsFound = false;

        querySnapshot.forEach((docSnap) => {
            itemsFound = true;
            const data = docSnap.data();
            
            let filePath = `uploads/${data.fileName}`;
            let viewerLink = filePath;

            // Extract Exact File Extension
            let ext = data.fileName ? data.fileName.split('.').pop().toUpperCase() : "FILE";

            // Microsoft Office Web Viewer Logic
            let isOfficeFile = ["DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX"].includes(ext);
            if (section === "documents" && isOfficeFile) {
                let absoluteUrl = currentUrl + filePath;
                viewerLink = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`;
            }

            // APPS SECTION (Now with Image, Size, Requirements)
            if (section === "apps") {
                // Agar custom icon (image) na ho, toh default android icon dikhega
                let iconHtml = data.appIcon ? 
                    `<img src="uploads/${data.appIcon}" class="app-icon-img" alt="App Icon">` : 
                    `<i class="fa-brands fa-android" style="font-size: 2.5rem; color: #3b82f6; margin-bottom: 10px;"></i>`;

                html += `
                    <div class="app-card">
                        ${iconHtml}
                        <h3 style="margin-bottom: 5px; font-size: 0.95rem; line-height: 1.2;">${data.title}</h3>
                        <div class="app-meta">
                            <span>Size: ${data.appSize || 'N/A'}</span><br>
                            <span>Req: ${data.appReq || 'Android'}</span>
                        </div>
                        <a href="${filePath}" download class="submit-btn btn btn-small" style="width: 100%; text-decoration:none;">Download</a>
                    </div>`;
            } 
            // DOCUMENTS SECTION (Fixed Layout for long text)
            else if (section === "documents") {
                let icon = "fa-file-word";
                if(data.type === "excel") icon = "fa-file-excel";
                else if(data.type === "ppt") icon = "fa-file-powerpoint";
                else if(data.type === "html") icon = "fa-file-code";
                else if(data.type === "svg") icon = "fa-bezier-curve";

                html += `
                    <div class="list-card">
                        <i class="fa-solid ${icon}" style="font-size: 2rem; color: #f97316; flex-shrink:0;"></i>
                        <div class="list-info">
                            <h4>${data.title}</h4>
                            <span style="font-size: 0.65rem; color: #94a3b8; text-transform:uppercase;">${ext} FILE</span>
                        </div>
                        <a href="${viewerLink}" target="_blank" class="submit-btn btn btn-small" style="text-decoration:none;">View/Present</a>
                    </div>`;
            } 
            // NOTES SECTION
            else if (section === "notes") {
                html += `
                    <div class="list-card" style="align-items: flex-start; flex-direction: column; gap: 10px;">
                        <div class="list-info" style="width: 100%;">
                            <h4 style="color: #c084fc; margin-bottom: 5px; font-size:1rem;">${data.title}</h4>
                            <p style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">${data.content}</p>
                        </div>
                        <a href="${filePath}" target="_blank" class="submit-btn btn btn-small" style="text-decoration:none; align-self: flex-end;">Read Note</a>
                    </div>`;
            }
        });

        if (!itemsFound) {
            html += `<p style="grid-column: 1 / -1; text-align: center; color: #94a3b8;">No ${section} uploaded yet.</p>`;
        }

        html += `</div></div>`;
        contentArea.innerHTML = html;

    } catch (error) {
        contentArea.innerHTML = `<p style="color: #ef4444; text-align: center;">Error fetching data.</p>`;
        console.error(error);
    }
}
