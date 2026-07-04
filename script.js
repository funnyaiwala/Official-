// Firebase SDKs ko CDN se Import karna (GitHub Pages ke liye best)
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
let SYSTEM_PASSWORD = "310726"; // Default password (Jab tak DB se load na ho jaye)
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
fetchLatestPassword(); // Load hote hi check karega

// DOM Elements
const profileSection = document.getElementById("profile-section");
const contentSection = document.getElementById("content-section");
const passwordModal = document.getElementById("password-modal");
const passwordInput = document.getElementById("access-password");
const errorMsg = document.getElementById("error-msg");
const sectionTitle = document.getElementById("section-title");
const contentArea = document.getElementById("content-area");

// Event Listeners for Bottom Menu
document.getElementById("nav-apps").addEventListener("click", () => requestAccess("apps"));
document.getElementById("nav-documents").addEventListener("click", () => requestAccess("documents"));
document.getElementById("nav-notes").addEventListener("click", () => requestAccess("notes"));
document.getElementById("nav-profile").addEventListener("click", showProfile);

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

function showProfile() {
    contentSection.classList.add("hidden");
    profileSection.classList.remove("hidden");
    updateActiveMenu("nav-profile");
}

function openSection(section) {
    profileSection.classList.add("hidden");
    contentSection.classList.remove("hidden");
    updateActiveMenu("nav-" + section);

    sectionTitle.innerText = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Live Data Load karna
    renderContent(section);
}

function updateActiveMenu(activeId) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(activeId).classList.add('active');
}

// FIREBASE SE DATA FETCH KARKE SCREEN PAR DIKHANA
async function renderContent(section) {
    contentArea.innerHTML = `<p style="text-align: center; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching Data from Server...</p>`;
    
    try {
        const querySnapshot = await getDocs(collection(db, section));
        let html = `<div style="padding: 20px 0;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">`;
        let itemsFound = false;

        querySnapshot.forEach((doc) => {
            itemsFound = true;
            const data = doc.data();
            
            // "uploads/" folder me save ki hui file ka path
            const filePath = `uploads/${data.fileName}`;

            if (section === "apps") {
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                        <i class="fa-brands fa-android" style="font-size: 2.5rem; color: #3b82f6; margin-bottom: 10px;"></i>
                        <h3 style="margin-bottom: 5px;">${data.title}</h3>
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 15px;">${data.desc}</p>
                        <a href="${filePath}" download class="submit-btn btn" style="display:block; text-align:center; text-decoration:none; font-size: 0.9rem;">Download APK</a>
                    </div>`;
            } 
            else if (section === "documents") {
                let icon = "fa-file-word";
                if(data.type === "excel") icon = "fa-file-excel";
                else if(data.type === "ppt") icon = "fa-file-powerpoint";
                else if(data.type === "html") icon = "fa-file-code";
                else if(data.type === "svg") icon = "fa-bezier-curve";

                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <i class="fa-solid ${icon}" style="font-size: 2rem; color: #f97316;"></i>
                            <div style="text-align: left;">
                                <h4 style="margin-bottom:2px;">${data.title}</h4>
                                <span style="font-size: 0.70rem; color: #94a3b8; text-transform:uppercase;">${data.type} File</span>
                            </div>
                        </div>
                        <a href="${filePath}" target="_blank" class="submit-btn btn" style="padding: 8px 15px; font-size: 0.8rem; text-decoration:none;">View</a>
                    </div>`;
            } 
            else if (section === "notes") {
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); text-align: left;">
                        <h4 style="color: #c084fc; margin-bottom: 10px;">${data.title}</h4>
                        <p style="font-size: 0.85rem; color: #cbd5e1; margin-bottom:15px;">${data.content}</p>
                        <a href="${filePath}" target="_blank" class="submit-btn btn" style="padding: 8px 15px; font-size: 0.8rem; text-decoration:none; display:inline-block;">Read Note</a>
                    </div>`;
            }
        });

        if (!itemsFound) {
            html += `<p style="grid-column: 1 / -1; text-align: center; color: #94a3b8;">No ${section} uploaded yet.</p>`;
        }

        html += `</div></div>`;
        contentArea.innerHTML = html;

    } catch (error) {
        contentArea.innerHTML = `<p style="color: #ef4444; text-align: center;">Error fetching data. Check Firebase Rules.</p>`;
        console.error(error);
    }
}
