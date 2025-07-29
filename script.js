// script.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// Your web app's Firebase configuration
// !! IMPORTANT: Replace these with your actual Firebase project credentials !!
const firebaseConfig = {
    apiKey: "AIzaSyDUI2ht_2gv0vCa-AYhN6KtAQ6UvjHZLUA", // Example, replace with your actual key
    authDomain: "zeoo-chats.firebaseapp.com",
    projectId: "zeoo-chats",
    storageBucket: "zeoo-chats.firebasestorage.app",
    messagingSenderId: "93460025048",
    appId: "1:93460025048:web:8e59ff9dda9de20e4a11ad",
    measurementId: "G-NG4XLMXPTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const groupsRef = ref(database, 'groups'); // Reference to the 'groups' node in your database

// --- DOM Elements ---
const homeView = document.getElementById('homeView');
const addGroupView = document.getElementById('addGroupView');
const profileView = document.getElementById('profileView');

const groupListContainer = document.querySelector('.group-list-container');
const addGroupIcon = document.querySelector('.add-group-icon');
const profileIcon = document.querySelector('.profile-icon'); // Profile icon
const menuIcon = document.querySelector('.menu-icon'); // Hamburger menu icon

const addGroupForm = document.getElementById('addGroupForm');
const nextStepButton = addGroupForm.querySelector('.next-step-button');
const prevStepButton = addGroupForm.querySelector('.prev-step-button');
const formSteps = addGroupForm.querySelectorAll('.form-step');
let currentStep = 0; // For multi-step form

const categoryTabs = document.querySelectorAll('.category-tab');
const loadingSpinner = document.querySelector('.loading-spinner');
const snackbar = document.getElementById('snackbar');

const userIdDisplay = document.getElementById('userIdDisplay'); // For profile view
const profileCoinsDisplay = document.getElementById('profileCoinsDisplay'); // For profile view
const userCoinsDisplay = document.getElementById('userCoins'); // For header display

const sideMenu = document.querySelector('.side-menu');
const sideMenuOverlay = document.querySelector('.side-menu-overlay');
const closeMenuIcon = document.querySelector('.close-menu-icon');
const menuItems = document.querySelectorAll('.menu-item'); // For side menu navigation

let currentFilter = 'All'; // Default filter for group listing
let userCoins = 0; // User's coin balance

// --- Coin System Functions ---

/**
 * Initializes user coins from localStorage or sets initial coins for first-time users.
 */
function initializeUserCoins() {
    const storedCoins = localStorage.getItem('userCoins');
    const isFirstVisit = localStorage.getItem('isFirstVisit');

    if (storedCoins === null || isFirstVisit === null) {
        // First time user
        userCoins = 20; // Give 20 coins for first visit
        localStorage.setItem('isFirstVisit', 'false'); // Mark as not first visit anymore
        showSnackbar('Welcome! You received 20 coins.');
    } else {
        userCoins = parseInt(storedCoins, 10);
    }
    updateCoinsDisplay();
}

/**
 * Adds coins to the user's balance and updates display and localStorage.
 * @param {number} amount The number of coins to add.
 */
function addCoins(amount) {
    userCoins += amount;
    localStorage.setItem('userCoins', userCoins.toString());
    updateCoinsDisplay();
    showSnackbar(`${amount} coins added! Total: ${userCoins}`);
}

/**
 * Updates the coin display in the header and profile page.
 */
function updateCoinsDisplay() {
    userCoinsDisplay.textContent = userCoins;
    profileCoinsDisplay.textContent = userCoins;
}

/**
 * Handles the full-screen ad redirection and coin rewarding.
 * This function will be called when a user clicks 'Join Group'.
 * @param {string} originalLink The actual Telegram link to redirect to after the ad.
 */
function fireRedirectAd(originalLink) {
    // Store the original link in session storage so we can get it back after the ad redirect
    sessionStorage.setItem('originalTelegramLink', originalLink);

    // The 'invoke.js' script from profitableratecpm.com should handle the interstitial ad display
    // or redirection when it's loaded in the HTML.
    // To reward coins when the user returns, we typically rely on browser events
    // like 'visibilitychange' or 'popstate'.
    
    // Set a flag that an ad redirect was initiated
    sessionStorage.setItem('adRedirectInitiated', 'true');

    // Open the ad in a new window/tab. This is generally safer for not losing the user's current page state.
    // The ad network's script (invoke.js) might also do this automatically.
    window.open("https://profitableratecpm.com/604bac33ecfc479f1286990c0f08a84c/invoke.js", "_blank");
    
    // After a short delay, also open the original Telegram link.
    // This is a common pattern to ensure the user eventually gets to their destination,
    // assuming the ad might be brief or shown in a separate context.
    setTimeout(() => {
        window.open(originalLink, '_blank');
        showSnackbar('Opening Telegram group...');
    }, 1000); // 1-second delay
}


// --- Helper Functions ---

/**
 * Generates a random pastel-like color for avatar placeholders.
 * @returns {string} A hex color string.
 */
function getRandomAvatarColor() {
    const colors = ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD', '#E6E6FA', '#ADD8E6', '#B0E0E6']; // Lavender/purple/light blue shades
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Creates and returns a single group card HTML element.
 * @param {object} groupData The data for the group.
 * @param {string} key The Firebase key for this group.
 * @returns {HTMLElement} The created group card element.
 */
function createGroupCard(groupData, key) {
    const { name, link, category, owner = 'Admin', views = 0 } = groupData;
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    const card = document.createElement('div');
    card.classList.add('group-card');
    card.dataset.category = category; // Custom data attribute for filtering
    card.dataset.key = key; // Store Firebase key on the card element

    const updatedViews = (views || 0) + 1; // Increment views locally for immediate display

    card.innerHTML = `
        <div class="group-card-header">
            <div class="group-avatar" style="background-color: ${getRandomAvatarColor()};">
                <span>${initial}</span>
            </div>
            <div class="group-info">
                <h3>${name}</h3>
                <p class="description">Join our vibrant community!</p>
            </div>
        </div>
        <div class="group-tags">
            <span class="tag">Group/Channel</span>
            <span class="tag">${category}</span>
        </div>
        <div class="group-meta">
            <span class="author">By: ${owner}</span>
            <span class="view-count">
                <i class="fas fa-eye"></i> <span class="view-count-number">${updatedViews}</span> views
            </span>
            <a href="#" class="get-clicks-link" data-key="${key}" title="Get more info on clicks">Get Clicks</a>
        </div>
        <div class="group-actions">
            <a href="#" class="join-button" data-link="${link}">Join Group</a>
            </div>
    `;

    const getClicksLink = card.querySelector('.get-clicks-link');
    if (getClicksLink) {
        getClicksLink.addEventListener('click', (e) => {
            e.preventDefault();
            const currentCount = parseInt(card.querySelector('.view-count-number').textContent, 10);
            showSnackbar(`"${name}" has approximately ${currentCount} views (including this one).`);
        });
    }

    // Add event listener for "Join Group" button to trigger ad and then redirect
    const joinButton = card.querySelector('.join-button');
    if (joinButton) {
        joinButton.addEventListener('click', (e) => {
            e.preventDefault();
            const telegramLink = joinButton.dataset.link;
            fireRedirectAd(telegramLink); // Trigger ad and then open Telegram link
        });
    }

    return card;
}

/**
 * Renders the group cards to the DOM based on the current filter.
 * @param {object} groupsData The raw object of groups fetched from Firebase.
 */
function renderGroups(groupsData) {
    groupListContainer.innerHTML = ''; // Clear existing cards
    let groupsArray = [];

    // Convert the Firebase object into an array, adding the Firebase key
    for (const key in groupsData) {
        if (groupsData.hasOwnProperty(key)) {
            groupsArray.push({ key: key, ...groupsData[key] });
        }
    }

    // Sort by most recent (timestamp, descending)
    groupsArray.sort((a, b) => b.timestamp - a.timestamp);

    // Filter groups based on the currently active category
    const filteredGroups = groupsArray.filter(group =>
        currentFilter === 'All' || group.category === currentFilter
    );

    loadingSpinner.style.display = 'none'; // Hide spinner once data is processed

    if (filteredGroups.length === 0) {
        groupListContainer.innerHTML = `
            <p style="text-align: center; color: #777; margin-top: 50px; grid-column: 1 / -1;">
                No groups found in the '${currentFilter}' category.
            </p>
        `;
        return;
    }

    // Append filtered and sorted groups to the container with fade-in animation
    filteredGroups.forEach((group, index) => {
        const card = createGroupCard(group, group.key);
        card.style.animationDelay = `${index * 0.05}s`; // Staggered fade-in
        groupListContainer.appendChild(card);
    });
}

/**
 * Displays a snackbar/toast message.
 * @param {string} message The message to display.
 */
function showSnackbar(message) {
    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}

/**
 * Switches between different full-page views (home, add group, profile).
 * @param {HTMLElement} viewToShow The view element to make active.
 */
function showView(viewToShow) {
    // Hide all main content views first
    homeView.classList.remove('active-view');
    addGroupView.classList.remove('active-view');
    profileView.classList.remove('active-view');

    // Show the requested view
    viewToShow.classList.add('active-view');

    // Adjust header visibility based on view
    const header = document.querySelector('.header');
    const categoryTabsNav = document.querySelector('.category-tabs');
    const adBannerContainer = document.querySelector('.ad-banner-container'); // Use container

    if (viewToShow === homeView) {
        header.style.display = 'flex';
        categoryTabsNav.style.display = 'flex';
        adBannerContainer.style.display = 'flex'; // Show ad banner
        // Update user coins on home view (if coming from profile, etc.)
        updateCoinsDisplay();
    } else {
        header.style.display = 'none'; // Hide main header on other views
        categoryTabsNav.style.display = 'none';
        adBannerContainer.style.display = 'none'; // Hide ad banner
    }

    // For profile view, update coins display
    if (viewToShow === profileView) {
        profileCoinsDisplay.textContent = userCoins;
        userIdDisplay.textContent = localStorage.getItem('uniqueUserId') || 'N/A'; // Display persisted user ID
    }

    // Close side menu if open
    closeSideMenu();
}

/**
 * Updates the active step in the multi-step form.
 * @param {number} stepIndex The index of the step to make active.
 */
function updateFormStep(stepIndex) {
    formSteps.forEach((step, index) => {
        if (index === stepIndex) {
            step.classList.add('active-step');
        } else {
            step.classList.remove('active-step');
        }
    });
    currentStep = stepIndex;
}

/**
 * Generates a simple random user ID and stores it in localStorage.
 * @returns {string} A random 8-character alphanumeric string.
 */
function getOrCreateUserId() {
    let userId = localStorage.getItem('uniqueUserId');
    if (!userId) {
        userId = Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem('uniqueUserId', userId);
    }
    return userId;
}

/**
 * Toggles the side navigation menu visibility.
 * @param {boolean} show If true, opens the menu; otherwise, closes it.
 */
function toggleSideMenu(show) {
    if (show) {
        sideMenu.classList.add('active');
        sideMenuOverlay.classList.add('active');
    } else {
        sideMenu.classList.remove('active');
        sideMenuOverlay.classList.remove('active');
    }
}

function closeSideMenu() {
    toggleSideMenu(false);
}


// --- Event Listeners ---

// Navigation from Header Icons
addGroupIcon.addEventListener('click', () => {
    showView(addGroupView);
    updateFormStep(0); // Reset form to first step
});

profileIcon.addEventListener('click', () => {
    showView(profileView);
    userIdDisplay.textContent = getOrCreateUserId(); // Ensure user ID is displayed
});

menuIcon.addEventListener('click', () => {
    toggleSideMenu(true);
});

closeMenuIcon.addEventListener('click', () => {
    closeSideMenu();
});

// Navigation from Side Menu Items
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Only allow clicks on non-disabled items
        if (!item.classList.contains('disabled')) {
            e.preventDefault();
            const targetViewId = item.dataset.view;
            if (targetViewId) {
                showView(document.getElementById(targetViewId));
            }
        }
    });
});


// Back buttons for full-page views
document.querySelectorAll('.view-header .back-button').forEach(button => {
    button.addEventListener('click', () => showView(homeView));
});


// Multi-step form navigation
nextStepButton.addEventListener('click', () => {
    // Validate first step before moving to next
    const groupNameInput = document.getElementById('groupName');
    const telegramLinkInput = document.getElementById('telegramLink');

    if (!groupNameInput.value.trim() || !telegramLinkInput.value.trim()) {
        showSnackbar('Please fill in both name and link fields.');
        return;
    }
    if (!telegramLinkInput.value.trim().startsWith('https://t.me/')) {
        showSnackbar('Telegram Link must start with https://t.me/');
        return;
    }

    updateFormStep(currentStep + 1);
});

prevStepButton.addEventListener('click', () => {
    updateFormStep(currentStep - 1);
});


// Handle Add Group Form Submission
addGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const groupName = document.getElementById('groupName').value.trim();
    const telegramLink = document.getElementById('telegramLink').value.trim();
    const groupCategory = document.getElementById('groupCategory').value;

    if (!groupCategory) {
        showSnackbar('Please select a category.');
        return;
    }

    const newGroup = {
        name: groupName,
        link: telegramLink,
        category: groupCategory,
        timestamp: Date.now(),
        owner: getOrCreateUserId(), // Use the persistent user ID
        views: 0
    };

    try {
        await push(groupsRef, newGroup);
        showSnackbar('Group submitted successfully!');
        addGroupForm.reset(); // Clear form
        updateFormStep(0); // Reset to first step
        showView(homeView); // Navigate back to home
    } catch (error) {
        console.error("Error adding group: ", error);
        showSnackbar('Error submitting group. Please try again.');
    }
});

// Category Tab Filtering Logic
categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove 'active' class from all tabs
        categoryTabs.forEach(t => t.classList.remove('active'));
        // Add 'active' class to the clicked tab
        this.classList.add('active');
        currentFilter = this.dataset.category; // Update the filter

        // The onValue listener will automatically re-render with the new filter
        // because `currentFilter` is a global variable it uses.
    });
});

// --- Firebase Realtime Database Listener ---
// This listener runs once initially when the page loads,
// and then again every time the data at the 'groups' path changes in Firebase.
onValue(groupsRef, (snapshot) => {
    loadingSpinner.style.display = 'block'; // Show spinner while fetching/processing data
    const data = snapshot.val(); // Get the data as a JavaScript object

    if (data) {
        renderGroups(data); // Render all groups if data exists
    } else {
        groupListContainer.innerHTML = `
            <p style="text-align: center; color: #777; margin-top: 50px; grid-column: 1 / -1;">
                No groups added yet. Be the first!
            </p>
        `;
        loadingSpinner.style.display = 'none';
    }
}, (error) => {
    // Error handling for Firebase read operation
    console.error("Firebase Read Error: ", error);
    groupListContainer.innerHTML = `
        <p style="text-align: center; color: red; margin-top: 50px; grid-column: 1 / -1;">
            Error loading groups. Please check your Firebase configuration or network connection.
        </p>
    `;
    loadingSpinner.style.display = 'none';
});

// Initial header shadow on scroll
document.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 0) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// --- Initialize on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    initializeUserCoins(); // Load or set initial coins
    getOrCreateUserId(); // Ensure a user ID is set/retrieved
    showView(homeView); // Initially show the home view
    updateFormStep(0); // Ensure add group form starts on first step

    // Popstate listener for back button navigation (e.g., after ad redirect)
    // This will only work if the ad actually changes the browser's history state
    // and then the user presses the back button to return to your site.
    window.addEventListener('popstate', (event) => {
        // Check if an ad redirect was initiated and the user has returned
        if (sessionStorage.getItem('adRedirectInitiated') === 'true') {
            addCoins(10);
            sessionStorage.removeItem('adRedirectInitiated'); // Clear flag after rewarding
            // You might want to add a cooldown or a more sophisticated check here
            // to prevent accidental multiple awards.
        }
    });

    // An alternative way to detect return from ad (if ad opened in new tab/window):
    // This event fires when the tab visibility changes from hidden to visible.
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            // Check if an ad redirect was initiated and the user has returned
            if (sessionStorage.getItem('adRedirectInitiated') === 'true') {
                addCoins(10);
                sessionStorage.removeItem('adRedirectInitiated'); // Clear flag after rewarding
                // Important: This `visibilitychange` can trigger for other reasons
                // (e.g., switching tabs). For a production app, you might need
                // a more robust ad network callback or a time-based cooldown
                // to prevent over-rewarding.
            }
        }
    });
});