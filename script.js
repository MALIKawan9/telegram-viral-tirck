// script.js

// Check the current page to apply specific logic
const currentPage = window.location.pathname.split('/').pop(); // "index.html" or "profile.html"

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

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

// --- Pinned Group Data ---
const pinnedGroupData = {
    name: "HACKER 99 🛑",
    link: "https://t.me/viphack987_bot",
    description: "Aapka iske andar ek lakh se jyada tools milenge jisse aap prank kar sakte hain apne doston ke sath unke mobile kuchh hack karke",
    category: "Tools",
    owner: "Admin",
    views: 999999, // High view count for a pinned group
    isPinned: true // Custom flag
};

// --- Global Constants ---
const GROUP_POST_COST = 10;
const AD_REWARD_COINS = 10;
const WATCH_AD_URL = "https://www.profitableratecpm.com/d63pq29r3m?key=49c6bb7028627aa53d76695323c8757d";

let userCoins = 0; // User's coin balance
let currentFilter = 'All'; // Default filter for group listing
let currentSortOrder = 'latest'; // Default sort order

// --- DOM Elements (conditionally selected based on page) ---
let homeView, addGroupView; // Only for index.html
let groupListContainer, addGroupIcon, profileIconLink, categoryTabs, loadingSpinner; // Mostly for index.html
let addGroupForm, nextStepButton, prevStepButton, formSteps; // Only for index.html (Add Group Popup)
let userCoinsDisplay; // In header (index.html)
let snackbar; // Both pages
let userIdDisplay, profileCoinsDisplay, watchAdButton, profileDpPreview, dpUploadInput; // Only for profile.html
let sortOrderSelect; // Only for index.html
let sideMenu, sideMenuOverlay, closeMenuIcon, menuItems; // Only for index.html

// Select elements only if they exist on the current page
document.addEventListener('DOMContentLoaded', () => {
    snackbar = document.getElementById('snackbar');

    if (currentPage === 'index.html' || currentPage === '') { // '' for root path
        homeView = document.getElementById('homeView');
        addGroupView = document.getElementById('addGroupView');

        groupListContainer = document.querySelector('.group-list-container');
        addGroupIcon = document.querySelector('.add-group-icon');
        profileIconLink = document.querySelector('.profile-link'); // Changed to link for profile.html
        menuIcon = document.querySelector('.menu-icon');

        addGroupForm = document.getElementById('addGroupForm');
        nextStepButton = addGroupForm.querySelector('.next-step-button');
        prevStepButton = addGroupForm.querySelector('.prev-step-button');
        formSteps = addGroupForm.querySelectorAll('.form-step');

        categoryTabs = document.querySelectorAll('.category-tab');
        loadingSpinner = document.querySelector('.loading-spinner');

        userCoinsDisplay = document.getElementById('userCoins'); // For header display
        sortOrderSelect = document.getElementById('sortOrder'); // For sorting

        sideMenu = document.querySelector('.side-menu');
        sideMenuOverlay = document.querySelector('.side-menu-overlay');
        closeMenuIcon = document.querySelector('.close-menu-icon');
        menuItems = document.querySelectorAll('.menu-item');

        initializeIndexPageListeners();
        initializeUserCoins(); // Initialize coins for the session
        getOrCreateUserId(); // Ensure user ID is set/retrieved
        showMainView(homeView); // Show home view by default on index.html

    } else if (currentPage === 'profile.html') {
        userIdDisplay = document.getElementById('userIdDisplay');
        profileCoinsDisplay = document.getElementById('profileCoinsDisplay');
        watchAdButton = document.getElementById('watchAdButton');
        profileDpPreview = document.getElementById('profileDpPreview');
        dpUploadInput = document.getElementById('dpUploadInput');

        initializeProfilePageListeners();
        initializeUserCoins(); // Initialize coins for the session
        updateProfilePageUI();
    }

    // Common event listeners for returning from ads
    window.addEventListener('popstate', handleAdReturn);
    document.addEventListener("visibilitychange", handleAdReturn);
});


// --- Coin System Functions ---

/**
 * Initializes user coins from localStorage or sets initial coins for first-time users.
 */
function initializeUserCoins() {
    const storedCoins = localStorage.getItem('userCoins');
    const isFirstVisit = localStorage.getItem('isFirstVisit');

    if (storedCoins === null || isFirstVisit === null) {
        userCoins = 20; // Give 20 coins for first visit
        localStorage.setItem('isFirstVisit', 'false'); // Mark as not first visit anymore
        showSnackbar('Welcome! You received 20 coins for being a first-time user!');
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
 * Deducts coins from the user's balance and updates display and localStorage.
 * @param {number} amount The number of coins to deduct.
 * @returns {boolean} True if coins were deducted successfully, false otherwise (e.g., insufficient coins).
 */
function deductCoins(amount) {
    if (userCoins >= amount) {
        userCoins -= amount;
        localStorage.setItem('userCoins', userCoins.toString());
        updateCoinsDisplay();
        return true;
    }
    return false;
}

/**
 * Updates the coin display in the header (if present) and profile page (if present).
 */
function updateCoinsDisplay() {
    if (userCoinsDisplay) { // Only update if element exists (on index.html)
        userCoinsDisplay.textContent = userCoins;
    }
    if (profileCoinsDisplay) { // Only update if element exists (on profile.html)
        profileCoinsDisplay.textContent = userCoins;
    }
}

/**
 * Handles the full-screen ad redirection and coin rewarding.
 */
function fireRedirectAd() {
    sessionStorage.setItem('adRedirectInitiated', 'true');
    window.open(WATCH_AD_URL, "_blank");
    showSnackbar('Ad opened in a new tab. Earn coins upon returning!');
}

/**
 * Generic handler for when the user might return from an ad.
 * This function will be triggered by popstate or visibilitychange events.
 */
function handleAdReturn() {
    if (sessionStorage.getItem('adRedirectInitiated') === 'true') {
        addCoins(AD_REWARD_COINS);
        sessionStorage.removeItem('adRedirectInitiated'); // Clear flag after rewarding
        // For robustness in a real app, you'd add:
        // 1. A timestamp in localStorage when the ad was shown.
        // 2. A cooldown period (e.g., 30 seconds, 1 minute) before allowing another reward.
        // This prevents users from quickly switching tabs to get multiple rewards.
    }
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
 * @param {string} key The Firebase key for this group (or a unique string for pinned).
 * @returns {HTMLElement} The created group card element.
 */
function createGroupCard(groupData, key) {
    const { name, link, category, description, owner = 'Admin', views = 0, isPinned = false } = groupData;
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    const card = document.createElement('div');
    card.classList.add('group-card');
    if (isPinned) {
        card.classList.add('pinned'); // Add pinned class for styling
    }
    card.dataset.category = category; // Custom data attribute for filtering
    card.dataset.key = key; // Store Firebase key on the card element

    // Increment views only for non-pinned groups
    const currentViews = views + (isPinned ? 0 : 1); // Only increment if not pinned and it's a "view"

    card.innerHTML = `
        <div class="group-card-header">
            <div class="group-avatar" style="background-color: ${getRandomAvatarColor()};">
                <span>${initial}</span>
            </div>
            <div class="group-info">
                <h3>${name} ${isPinned ? '<i class="fas fa-thumbtack" style="color:#8A2BE2; margin-left: 5px;"></i>' : ''}</h3>
                <p class="description">${description}</p>
            </div>
        </div>
        <div class="group-tags">
            <span class="tag">Group/Channel</span>
            <span class="tag">${category}</span>
        </div>
        <div class="group-meta">
            <span class="author">By: ${owner}</span>
            <span class="view-count">
                <i class="fas fa-eye"></i> <span class="view-count-number">${currentViews}</span> views
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
            const count = parseInt(card.querySelector('.view-count-number').textContent, 10);
            showSnackbar(`"${name}" has approximately ${count} views.`);
        });
    }

    // Add event listener for "Join Group" button
    const joinButton = card.querySelector('.join-button');
    if (joinButton) {
        joinButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const telegramLink = joinButton.dataset.link;

            // Increment views in Firebase for non-pinned groups
            if (!isPinned) {
                const groupToUpdateRef = ref(database, `groups/${key}`);
                await update(groupToUpdateRef, { views: currentViews });
            }

            // Open Telegram link
            window.open(telegramLink, '_blank');
            showSnackbar('Opening Telegram group...');
        });
    }

    return card;
}

/**
 * Renders the group cards to the DOM based on the current filter and sort order, including the pinned group.
 * @param {object} groupsData The raw object of groups fetched from Firebase.
 */
function renderGroups(groupsData) {
    if (!groupListContainer) return; // Ensure we are on index.html

    groupListContainer.innerHTML = ''; // Clear existing cards
    let groupsArray = [];

    // Convert the Firebase object into an array, adding the Firebase key
    for (const key in groupsData) {
        if (groupsData.hasOwnProperty(key)) {
            groupsArray.push({ key: key, ...groupsData[key] });
        }
    }

    // Filter groups based on the currently active category
    let filteredGroups = groupsArray.filter(group =>
        currentFilter === 'All' || group.category === currentFilter
    );

    // Sort filtered groups
    if (currentSortOrder === 'latest') {
        filteredGroups.sort((a, b) => b.timestamp - a.timestamp);
    } else if (currentSortOrder === 'mostViewed') {
        filteredGroups.sort((a, b) => b.views - a.views);
    }

    loadingSpinner.style.display = 'none'; // Hide spinner once data is processed

    // Add the pinned group first if it matches the current category or 'All'
    if (currentFilter === 'All' || pinnedGroupData.category === currentFilter) {
        const pinnedCard = createGroupCard(pinnedGroupData, 'pinned-hacker99'); // Use a unique key for pinned
        groupListContainer.appendChild(pinnedCard);
    }

    if (filteredGroups.length === 0 && !(currentFilter === 'All' || pinnedGroupData.category === currentFilter)) {
        // Only show "no groups" message if no filtered groups AND pinned group isn't displayed
        groupListContainer.innerHTML += `
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
    if (!snackbar) return; // Don't show if snackbar element isn't present

    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}

/**
 * Switches between different full-page views (add group) within index.html.
 * @param {HTMLElement} viewToShow The view element to make active.
 */
function showMainView(viewToShow) {
    if (!homeView || !addGroupView) return; // Ensure we are on index.html

    // Hide all main content views first
    homeView.classList.remove('active-view');
    addGroupView.classList.remove('active-view');

    // Show the requested view
    viewToShow.classList.add('active-view');

    // Adjust header visibility based on view
    const header = document.querySelector('.header');
    const categoryTabsNav = document.querySelector('.category-tabs');
    const adBannerContainer = document.querySelector('.ad-banner-container');
    const sortOptionsContainer = document.querySelector('.sort-options');

    if (viewToShow === homeView) {
        header.style.display = 'flex';
        categoryTabsNav.style.display = 'flex';
        adBannerContainer.style.display = 'flex';
        sortOptionsContainer.style.display = 'flex';
        updateCoinsDisplay(); // Update user coins
    } else { // For addGroupView
        header.style.display = 'none'; // Hide main header on other views
        categoryTabsNav.style.display = 'none';
        adBannerContainer.style.display = 'none';
        sortOptionsContainer.style.display = 'none';
    }

    // Close side menu if open
    closeSideMenu();
}

/**
 * Updates the active step in the multi-step form (on index.html).
 * @param {number} stepIndex The index of the step to make active.
 */
function updateFormStep(stepIndex) {
    if (!formSteps || formSteps.length === 0) return;

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
 * Toggles the side navigation menu visibility (on index.html).
 * @param {boolean} show If true, opens the menu; otherwise, closes it.
 */
function toggleSideMenu(show) {
    if (!sideMenu || !sideMenuOverlay) return;

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


// --- Page-Specific Initializers and Listeners ---

// For index.html
function initializeIndexPageListeners() {
    // Navigation from Header Icons
    addGroupIcon.addEventListener('click', () => {
        // Check for coins before opening the form
        if (userCoins < GROUP_POST_COST) {
            showSnackbar(`You need ${GROUP_POST_COST} coins to post a group. You have ${userCoins}.`);
            return; // Prevent opening the form
        }
        showMainView(addGroupView);
        updateFormStep(0); // Reset form to first step
    });

    // Profile icon now directly links to profile.html via HTML 'a' tag

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
                // If it's a link to a different HTML page, let the default behavior happen
                if (item.getAttribute('href') && item.getAttribute('href').endsWith('.html')) {
                    // Do nothing, let the browser navigate
                } else {
                    e.preventDefault(); // Prevent default for internal view changes
                    const targetViewId = item.dataset.view;
                    if (targetViewId && document.getElementById(targetViewId)) {
                        showMainView(document.getElementById(targetViewId));
                    }
                }
            }
        });
    });


    // Back button for Add Group view
    document.querySelector('#addGroupView .back-button').addEventListener('click', () => showMainView(homeView));


    // Multi-step form navigation
    nextStepButton.addEventListener('click', () => {
        // Validate first step before moving to next
        const groupNameInput = document.getElementById('groupName');
        const telegramLinkInput = document.getElementById('telegramLink');

        if (!groupNameInput.value.trim() || !telegramLinkInput.value.trim()) {
            showSnackbar('Please fill in both group name and Telegram link.');
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

        if (userCoins < GROUP_POST_COST) {
            showSnackbar(`You need ${GROUP_POST_COST} coins to post a group. You have ${userCoins}.`);
            return;
        }

        const groupName = document.getElementById('groupName').value.trim();
        const telegramLink = document.getElementById('telegramLink').value.trim();
        const groupCategory = document.getElementById('groupCategory').value;
        const groupDescription = "Join our vibrant community!"; // Default description for now

        if (!groupCategory) {
            showSnackbar('Please select a category.');
            return;
        }

        // Deduct coins before attempting to push to Firebase
        if (!deductCoins(GROUP_POST_COST)) {
            showSnackbar('Insufficient coins to post this group.');
            return;
        }

        const newGroup = {
            name: groupName,
            link: telegramLink,
            category: groupCategory,
            description: groupDescription,
            timestamp: Date.now(),
            owner: getOrCreateUserId(), // Use the persistent user ID
            views: 0
        };

        try {
            await push(groupsRef, newGroup);
            showSnackbar('Group submitted successfully!');
            addGroupForm.reset(); // Clear form
            updateFormStep(0); // Reset to first step
            showMainView(homeView); // Navigate back to home
        } catch (error) {
            console.error("Error adding group: ", error);
            showSnackbar('Error submitting group. Please try again.');
            addCoins(GROUP_POST_COST); // Simple refund on failure
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

    // Sort Order Change Listener
    sortOrderSelect.addEventListener('change', (e) => {
        currentSortOrder = e.target.value;
        // Re-trigger render to apply new sort order
        onValue(groupsRef, (snapshot) => {
            const data = snapshot.val();
            renderGroups(data || {});
        }, (error) => {
            console.error("Firebase Read Error (sort change): ", error);
        });
    });


    // --- Firebase Realtime Database Listener (for index.html) ---
    onValue(groupsRef, (snapshot) => {
        loadingSpinner.style.display = 'block'; // Show spinner while fetching/processing data
        const data = snapshot.val(); // Get the data as a JavaScript object

        if (data) {
            renderGroups(data); // Render all groups if data exists
        } else {
            // If no data, still render the pinned group and empty message
            groupListContainer.innerHTML = ''; // Clear existing
            if (currentFilter === 'All' || pinnedGroupData.category === currentFilter) {
                const pinnedCard = createGroupCard(pinnedGroupData, 'pinned-hacker99');
                groupListContainer.appendChild(pinnedCard);
            }
            groupListContainer.innerHTML += `
                <p style="text-align: center; color: #777; margin-top: 50px; grid-column: 1 / -1;">
                    No user-submitted groups added yet. Be the first!
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
}


// For profile.html
function initializeProfilePageListeners() {
    // Watch Ad Button click
    watchAdButton.addEventListener('click', () => {
        fireRedirectAd();
    });

    // Profile Picture Upload
    dpUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileDpPreview.src = e.target.result;
                localStorage.setItem('userProfilePicture', e.target.result); // Store as Data URL
                // In a real app, you would upload this to Firebase Storage here:
                /*
                const storage = getStorage(app);
                const storageRef = sRef(storage, `profile_pictures/${getOrCreateUserId()}/${file.name}`);
                uploadBytes(storageRef, file).then((snapshot) => {
                    getDownloadURL(snapshot.ref).then((downloadURL) => {
                        console.log('File available at', downloadURL);
                        localStorage.setItem('userProfilePicture', downloadURL); // Store URL
                        profileDpPreview.src = downloadURL;
                        showSnackbar('Profile picture updated!');
                    });
                }).catch(error => {
                    console.error("Error uploading profile picture:", error);
                    showSnackbar('Failed to upload profile picture.');
                });
                */
            };
            reader.readAsDataURL(file); // Read as Data URL for immediate preview
        }
    });
}

// Update UI elements specific to the profile page
function updateProfilePageUI() {
    if (userIdDisplay) {
        userIdDisplay.textContent = getOrCreateUserId();
    }
    if (profileCoinsDisplay) {
        profileCoinsDisplay.textContent = userCoins;
    }
    if (profileDpPreview) {
        const storedDp = localStorage.getItem('userProfilePicture');
        if (storedDp) {
            profileDpPreview.src = storedDp;
        }
    }
}
