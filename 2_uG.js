/* =====================================================
   BOT AVATAR — EXACTLY ONE AVATAR PER BOT MESSAGE
   ===================================================== */
(function () {
    "use strict";
    const BOT_AVATAR_URL = "https://fpu.branding-element.com/prod/88870/ENGATI_PUBLIC/147645_15072026_073531_Screenshot_2026_07_15_at_1.01.59_PM.png-PSW2E.png";
    let processingScheduled = false;
    function isBotMessage(container) {
        if (!container)
            return false;
        return (container.getAttribute("data-msg-sender") === "bot" ||
            Boolean(container.querySelector(".engt-msg-bot, .engt-msg-smo")));
    }
    function fixBotMessageAvatar(container) {
        if (!isBotMessage(container))
            return;
        container.classList.add("upgrad-bot-message");
        /*
         * Remove duplicate custom avatars.
         * Only one custom avatar is allowed per message.
         */
        const customAvatars = Array.from(container.querySelectorAll(":scope > .upgrad-bot-avatar"));
        customAvatars.slice(1).forEach(function (avatar) {
            avatar.remove();
        });
        let avatar = customAvatars[0];
        if (!avatar) {
            avatar = document.createElement("div");
            avatar.className = "upgrad-bot-avatar";
            avatar.setAttribute("aria-hidden", "true");
            const image = document.createElement("img");
            image.className = "upgrad-bot-avatar-image";
            image.src = BOT_AVATAR_URL;
            image.alt = "";
            avatar.appendChild(image);
            /*
             * Always place the avatar as the first direct child,
             * so it remains beside the message.
             */
            container.insertBefore(avatar, container.firstChild);
        }
        const avatarImage = avatar.querySelector(".upgrad-bot-avatar-image");
        if (avatarImage &&
            avatarImage.getAttribute("src") !== BOT_AVATAR_URL) {
            avatarImage.setAttribute("src", BOT_AVATAR_URL);
        }
        /*
         * Make sure the custom avatar remains first,
         * even when Engati updates the message.
         */
        if (container.firstElementChild !== avatar) {
            container.insertBefore(avatar, container.firstElementChild);
        }
    }
    function processAllBotMessages() {
        processingScheduled = false;
        document
            .querySelectorAll(".engt-msg-container")
            .forEach(fixBotMessageAvatar);
    }
    function scheduleProcessing() {
        if (processingScheduled)
            return;
        processingScheduled = true;
        window.requestAnimationFrame(processAllBotMessages);
    }
    const observer = new MutationObserver(function (mutations) {
        const containsMessageChanges = mutations.some(function (mutation) {
            return Array.from(mutation.addedNodes).some(function (node) {
                if (node.nodeType !== 1)
                    return false;
                return (node.matches?.(".engt-msg-container") ||
                    node.querySelector?.(".engt-msg-container") ||
                    node.closest?.(".engt-msg-container"));
            });
        });
        if (containsMessageChanges) {
            scheduleProcessing();
        }
    });
    function initializeBotAvatars() {
        processAllBotMessages();
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeBotAvatars, { once: true });
    }
    else {
        initializeBotAvatars();
    }
})();

/* ~ BOT AVATAR */

/* =====================================================
   UPGRAD LAUNCHER, CALLOUT AND INACTIVITY OPENING
   ===================================================== */
(function () {
    "use strict";
    const CONFIG = {
        launcherImageUrl: "https://fpu.branding-element.com/prod/88870/INLINE_IMAGE/147645_15072026_073714_Screenshot_2026_07_15_at_1.07.03_PM.png-0atgo.png",
        calloutHeading: "Chat with us.",
        calloutText: "Get Instant Help!",
        /* Show callout after 2 seconds */
        calloutDelayMs: 2000,
        /* First automatic opening after 30 seconds */
        firstAutoOpenDelayMs: 30000,
        /* Reopen after 20 seconds following a user close */
        reopenAfterCloseDelayMs: 20000
    };
    let calloutTimer = 0;
    let inactivityTimer = 0;
    let mouseMoveTimer = 0;
    let userClosedChat = false;
    let lastActivityTime = Date.now();
    let activityListenersAdded = false;
    function getNativeLauncher() {
        return (document.getElementById("engtLauncherIcon") ||
            document.querySelector(".engt-launcher-icon"));
    }
    function getLauncherContainer() {
        return document.querySelector(".engt-launch-icon-box");
    }
    function getPopup() {
        return (document.getElementById("engt-popup") ||
            document.querySelector(".engt-popup") ||
            document.querySelector(".engt-chat-window") ||
            document.querySelector(".engt-chat-screen"));
    }
    function isElementVisible(element) {
        if (!element || !element.isConnected) {
            return false;
        }
        const style = window.getComputedStyle(element);
        const rectangle = element.getBoundingClientRect();
        return (style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity || 1) > 0 &&
            rectangle.width > 0 &&
            rectangle.height > 0);
    }
    function isChatOpen() {
        const popup = getPopup();
        if (!popup) {
            return false;
        }
        /*
         * Check common Engati closed states first.
         */
        if (popup.classList.contains("engt-hide") ||
            popup.classList.contains("hide") ||
            popup.classList.contains("closed") ||
            popup.getAttribute("aria-hidden") === "true") {
            return false;
        }
        return isElementVisible(popup);
    }
    function getCallout() {
        return document.querySelector(".upgrad-launcher-callout");
    }
    function hideCallout() {
        const callout = getCallout();
        if (callout) {
            callout.classList.remove("is-visible");
            callout.setAttribute("aria-hidden", "true");
        }
    }
    function showCallout() {
        if (isChatOpen())
            return;
        const callout = getCallout();
        if (callout) {
            callout.classList.add("is-visible");
            callout.setAttribute("aria-hidden", "false");
        }
    }
    function updateLauncherVisibility() {
        const launcherContainer = getLauncherContainer();
        if (!launcherContainer)
            return;
        const chatOpen = isChatOpen();
        launcherContainer.classList.toggle("upgrad-chat-open", chatOpen);
        if (chatOpen) {
            hideCallout();
        }
    }
    function triggerNativeLauncher() {
        const nativeLauncher = getNativeLauncher();
        if (!nativeLauncher) {
            console.warn("Engati native launcher was not found.");
            return false;
        }
        /*
         * Use click() first because Engati may attach a native
         * click handler directly to the launcher.
         */
        if (typeof nativeLauncher.click === "function") {
            nativeLauncher.click();
        }
        else {
            nativeLauncher.dispatchEvent(new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window
            }));
        }
        return true;
    }
    function openChat() {
        if (isChatOpen()) {
            updateLauncherVisibility();
            return;
        }
        hideCallout();
        if (!triggerNativeLauncher()) {
            return;
        }
        userClosedChat = false;
        window.clearTimeout(inactivityTimer);
        /*
         * Engati may animate before the window becomes visible.
         */
        window.setTimeout(updateLauncherVisibility, 100);
        window.setTimeout(updateLauncherVisibility, 400);
        window.setTimeout(updateLauncherVisibility, 900);
    }
    function createLauncher() {
        const launcherContainer = getLauncherContainer();
        const nativeLauncher = getNativeLauncher();
        if (!launcherContainer || !nativeLauncher) {
            return;
        }
        nativeLauncher.classList.add("upgrad-native-launcher-hidden");
        let customButton = launcherContainer.querySelector(".upgrad-launcher-button");
        if (!customButton) {
            customButton =
                document.createElement("button");
            customButton.type = "button";
            customButton.className =
                "upgrad-launcher-button";
            customButton.setAttribute("aria-label", "Open upGrad chat");
            customButton.setAttribute("title", "Chat with upGrad");
            const image = document.createElement("img");
            image.className =
                "upgrad-launcher-image";
            image.src =
                CONFIG.launcherImageUrl;
            image.alt = "upGrad chat";
            customButton.appendChild(image);
            customButton.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                openChat();
            });
            launcherContainer.appendChild(customButton);
        }
        let callout = launcherContainer.querySelector(".upgrad-launcher-callout");
        if (!callout) {
            callout =
                document.createElement("div");
            callout.className =
                "upgrad-launcher-callout";
            callout.setAttribute("aria-hidden", "true");
            const heading = document.createElement("span");
            heading.className =
                "upgrad-callout-heading";
            heading.textContent =
                CONFIG.calloutHeading;
            const text = document.createElement("span");
            text.className =
                "upgrad-callout-text";
            text.textContent =
                CONFIG.calloutText;
            callout.appendChild(heading);
            callout.appendChild(text);
            launcherContainer.insertBefore(callout, customButton);
        }
        updateLauncherVisibility();
        if (!calloutTimer) {
            calloutTimer = window.setTimeout(function () {
                calloutTimer = 0;
                if (!isChatOpen()) {
                    showCallout();
                }
            }, CONFIG.calloutDelayMs);
        }
    }
    function getCurrentInactivityDelay() {
        return userClosedChat
            ? CONFIG.reopenAfterCloseDelayMs
            : CONFIG.firstAutoOpenDelayMs;
    }
    function startInactivityTimer() {
        window.clearTimeout(inactivityTimer);
        if (isChatOpen()) {
            return;
        }
        const delay = getCurrentInactivityDelay();
        const remainingTime = Math.max(0, delay -
            (Date.now() - lastActivityTime));
        inactivityTimer = window.setTimeout(function checkInactivity() {
            const inactiveFor = Date.now() - lastActivityTime;
            if (!isChatOpen() &&
                inactiveFor >= delay) {
                openChat();
                return;
            }
            if (!isChatOpen()) {
                startInactivityTimer();
            }
        }, remainingTime);
    }
    function eventOccurredInsideChat(event) {
        const target = event.target;
        if (!(target instanceof Element)) {
            return false;
        }
        return Boolean(target.closest("#engtWrapper, " +
            "#engt-popup, " +
            ".engt-chat-screen, " +
            ".engt-chat-window, " +
            ".engt-launch-icon-box"));
    }
    function registerWebsiteActivity(event) {
        if (eventOccurredInsideChat(event)) {
            return;
        }
        lastActivityTime = Date.now();
        if (!isChatOpen()) {
            startInactivityTimer();
        }
    }
    function addActivityListeners() {
        if (activityListenersAdded)
            return;
        ["click", "keydown", "touchstart", "scroll"].forEach(function (eventName) {
            document.addEventListener(eventName, registerWebsiteActivity, {
                passive: true
            });
        });
        document.addEventListener("mousemove", function (event) {
            window.clearTimeout(mouseMoveTimer);
            mouseMoveTimer =
                window.setTimeout(function () {
                    registerWebsiteActivity(event);
                }, 300);
        }, {
            passive: true
        });
        activityListenersAdded = true;
    }
    function isCloseButton(target) {
        if (!(target instanceof Element)) {
            return null;
        }
        return target.closest("#engtClose, " +
            ".engt-close, " +
            ".engt-close-button, " +
            "[aria-label='Close'], " +
            "[aria-label='Minimize'], " +
            "[title='Close'], " +
            "[title='Minimize']");
    }
    document.addEventListener("click", function (event) {
        const closeButton = isCloseButton(event.target);
        if (!closeButton)
            return;
        userClosedChat = true;
        lastActivityTime = Date.now();
        window.clearTimeout(inactivityTimer);
        /*
         * Allow Engati's own closing animation to finish.
         */
        window.setTimeout(function () {
            updateLauncherVisibility();
            showCallout();
            startInactivityTimer();
        }, 600);
    }, true);
    /*
     * Observe newly created Engati elements only.
     * Do not observe every class change, because our own class
     * updates would repeatedly trigger the observer.
     */
    const launcherObserver = new MutationObserver(function (mutations) {
        const hasRelevantNewNode = mutations.some(function (mutation) {
            return Array.from(mutation.addedNodes).some(function (node) {
                if (node.nodeType !== 1) {
                    return false;
                }
                return (node.matches?.(".engt-launch-icon-box, " +
                    "#engtLauncherIcon, " +
                    ".engt-launcher-icon, " +
                    "#engt-popup, " +
                    ".engt-chat-screen") ||
                    node.querySelector?.(".engt-launch-icon-box, " +
                        "#engtLauncherIcon, " +
                        ".engt-launcher-icon, " +
                        "#engt-popup, " +
                        ".engt-chat-screen"));
            });
        });
        if (hasRelevantNewNode) {
            createLauncher();
            window.setTimeout(updateLauncherVisibility, 50);
        }
    });
    launcherObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    /* =====================================================
       DESKTOP EXIT-INTENT CHAT OPEN
       Opens chatbot when the cursor leaves through the top
       ===================================================== */
    let exitIntentTriggered = false;
    let exitIntentCooldownTimer = 0;
    function enableExitIntentChat() {
        document.addEventListener("mouseout", function (event) {
            /* Desktop only: mobile devices do not have cursor exit intent. */
            if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
                return;
            }
            /* Ignore movement between elements inside the webpage. */
            if (event.relatedTarget || event.toElement) {
                return;
            }
            /* Trigger only when the cursor exits through the top edge. */
            if (event.clientY > 5) {
                return;
            }
            if (isChatOpen() || exitIntentTriggered) {
                return;
            }
            exitIntentTriggered = true;
            window.clearTimeout(inactivityTimer);
            hideCallout();
            openChat();
            /* Permit another exit-intent trigger after 30 seconds. */
            window.clearTimeout(exitIntentCooldownTimer);
            exitIntentCooldownTimer = window.setTimeout(function () {
                exitIntentTriggered = false;
            }, 30000);
        });
    }
    createLauncher();
    addActivityListeners();
    enableExitIntentChat();
    startInactivityTimer();
    /*
     * Lightweight fallback for Engati display changes.
     */
    window.setInterval(updateLauncherVisibility, 750);
})();

/* ~ UPGRAD LAUNCHER, CALLOUT AND INACTIVITY OPENING */

/* =====================================================
   UPGRAD SMO — DYNAMIC TWO-COLUMN PILL TRANSFORMATION
   ===================================================== */
(function () {
    "use strict";
    const ICONS = {
        programs: `

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"></path>

        <path d="M6 10.2v4.4c0 1.8 2.7 3.4 6 3.4s6-1.6 6-3.4v-4.4"></path>

        <path d="M21 9v4"></path>

      </svg>

    `,
        eligibility: `

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path d="M12 3 20 6v6c0 4.7-3.2 7.7-8 9-4.8-1.3-8-4.3-8-9V6l8-3Z"></path>

        <path d="m8.5 12 2.2 2.2 4.8-5"></path>

      </svg>

    `,
        expert: `

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <circle cx="12" cy="7" r="3.5"></circle>

        <path d="M5 20v-2.5c0-3.2 2.8-5.5 7-5.5s7 2.3 7 5.5V20"></path>

      </svg>

    `,
        ai: `

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path d="m8 3 1.2 3.2L12 7.5 9.2 8.8 8 12 6.8 8.8 4 7.5l2.8-1.3L8 3Z"></path>

        <path d="m17 11 1.1 2.9L21 15l-2.9 1.1L17 19l-1.1-2.9L13 15l2.9-1.1L17 11Z"></path>

        <path d="m5 15 .7 1.8L7.5 17.5l-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15Z"></path>

      </svg>

    `
    };
    /* This mapping selects icons only. Button labels always come from Engati. */
    const ICON_MAP = [
        {
            matches: [
                "explore programs",
                "programs",
                "most in demand programs"
            ],
            icon: "programs"
        },
        {
            matches: [
                "check eligibility",
                "eligibility",
                "eligibility check"
            ],
            icon: "eligibility"
        },
        {
            matches: [
                "speak to a counselor",
                "speak to a counsellor",
                "speak with an expert",
                "speak to an expert",
                "counselor",
                "counsellor",
                "expert"
            ],
            icon: "expert"
        },
        {
            matches: [
                "i couldn’t find what i’m looking for",
                "i couldn't find what i'm looking for",
                "ai assistance",
                "something else",
                "other"
            ],
            icon: "ai"
        }
    ];
    let processingScheduled = false;
    function normalizeText(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }
    function getButtonConfig(text) {
        const label = String(text || "").replace(/\s+/g, " ").trim();
        const normalized = normalizeText(label);
        const match = ICON_MAP.find(function (item) {
            return item.matches.some(function (phrase) {
                return normalized.includes(phrase);
            });
        });
        return {
            label: label,
            icon: match ? match.icon : null
        };
    }
    function getPromptHTML(smoMessage) {
        const directPrompt = smoMessage.querySelector(":scope > .engt-msg-text");
        if (directPrompt) {
            return directPrompt.innerHTML.trim();
        }
        const prompt = smoMessage.querySelector(".engt-msg-text");
        return prompt ? prompt.innerHTML.trim() : "";
    }
    function getOriginalButtons(smoMessage) {
        return Array.from(smoMessage.querySelectorAll("button, .engt-button, .engt-button-base")).filter(function (button) {
            return (!button.classList.contains("upgrad-smo-button") &&
                !button.closest(".upgrad-smo-original-buttons"));
        });
    }
    function triggerOriginalButton(originalButton) {
        if (!originalButton || !originalButton.isConnected)
            return;
        originalButton.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    }
    function buildCustomButton(originalButton) {
        const originalText = originalButton.innerText ||
            originalButton.textContent ||
            originalButton.getAttribute("aria-label") ||
            "";
        const config = getButtonConfig(originalText);
        const customButton = document.createElement("button");
        customButton.type = "button";
        customButton.className = "upgrad-smo-button";
        customButton.setAttribute("aria-label", config.label);
        /*
         * Do not add the older black SVG icon here.
         * The supplied PNG doodle is added later by the doodle script.
         */
        const label = document.createElement("span");
        label.className = "upgrad-smo-label";
        label.textContent = config.label;
        customButton.appendChild(label);
        customButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            triggerOriginalButton(originalButton);
        });
        return customButton;
    }
    function transformSmoMessage(smoMessage) {
        if (!smoMessage)
            return;
        if (smoMessage.dataset.upgradSmoDone === "true") {
            return;
        }
        const originalButtons = getOriginalButtons(smoMessage);
        if (!originalButtons.length)
            return;
        const promptHTML = getPromptHTML(smoMessage);
        const messageContainer = smoMessage.closest(".engt-msg-container");
        if (messageContainer) {
            messageContainer.classList.add("upgrad-smo-host");
        }
        const shell = document.createElement("div");
        shell.className = "upgrad-smo-shell";
        if (promptHTML) {
            const prompt = document.createElement("div");
            prompt.className = "upgrad-smo-prompt";
            /* Preserve Engati bold text, paragraphs and line breaks. */
            prompt.innerHTML = promptHTML;
            shell.appendChild(prompt);
        }
        const grid = document.createElement("div");
        grid.className = "upgrad-smo-grid";
        originalButtons.forEach(function (originalButton) {
            grid.appendChild(buildCustomButton(originalButton));
        });
        shell.appendChild(grid);
        const originalButtonsHolder = document.createElement("div");
        originalButtonsHolder.className = "upgrad-smo-original-buttons";
        originalButtonsHolder.setAttribute("aria-hidden", "true");
        originalButtons.forEach(function (originalButton) {
            originalButtonsHolder.appendChild(originalButton);
        });
        smoMessage.innerHTML = "";
        smoMessage.appendChild(shell);
        smoMessage.appendChild(originalButtonsHolder);
        smoMessage.classList.add("upgrad-smo-processed");
        smoMessage.dataset.upgradSmoDone = "true";
    }
    function processAllSmoMessages() {
        processingScheduled = false;
        document
            .querySelectorAll(".engt-msg-smo")
            .forEach(transformSmoMessage);
    }
    function scheduleSmoProcessing() {
        if (processingScheduled)
            return;
        processingScheduled = true;
        window.requestAnimationFrame(processAllSmoMessages);
    }
    const observer = new MutationObserver(function (mutations) {
        const hasRelevantChanges = mutations.some(function (mutation) {
            return Array.from(mutation.addedNodes).some(function (node) {
                if (node.nodeType !== 1)
                    return false;
                return Boolean(node.matches?.(".engt-msg-smo, button, .engt-button, .engt-button-base") ||
                    node.querySelector?.(".engt-msg-smo, button, .engt-button, .engt-button-base") ||
                    node.closest?.(".engt-msg-smo"));
            });
        });
        if (hasRelevantChanges) {
            scheduleSmoProcessing();
        }
    });
    function initializeSmoTransformation() {
        processAllSmoMessages();
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeSmoTransformation, { once: true });
    }
    else {
        initializeSmoTransformation();
    }
})();

/* ~ UPGRAD SMO — DYNAMIC TWO-COLUMN PILL TRANSFORMATION */

/* =====================================================
   EXIT INTENT - OPEN CHATBOT EVERY TIME
   Desktop only
   ===================================================== */
(function () {
    "use strict";
    let exitIntentArmed = true;
    function isMobileDevice() {
        return window.matchMedia("(hover: none), (pointer: coarse)").matches;
    }
    function isVisible(element) {
        if (!element || !element.isConnected) {
            return false;
        }
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity || 1) > 0 &&
            rect.width > 0 &&
            rect.height > 0);
    }
    function isChatOpen() {
        const closeButton = document.getElementById("engtClose") ||
            document.querySelector(".engt-close") ||
            document.querySelector(".engt-close-button") ||
            document.querySelector("[aria-label='Close']") ||
            document.querySelector("[aria-label='Minimize']") ||
            document.querySelector("[title='Close']") ||
            document.querySelector("[title='Minimize']");
        return isVisible(closeButton);
    }
    function getLauncherButton() {
        return (document.querySelector(".upgrad-launcher-button") ||
            document.getElementById("upgradLauncherButton") ||
            document.getElementById("engtLauncherIcon") ||
            document.querySelector(".engt-launcher-icon"));
    }
    function openChatbot() {
        if (isChatOpen()) {
            return;
        }
        const launcherButton = getLauncherButton();
        if (!launcherButton) {
            console.warn("Chatbot launcher was not found.");
            return;
        }
        if (typeof launcherButton.click === "function") {
            launcherButton.click();
            return;
        }
        launcherButton.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    }
    function handleExitIntent(event) {
        /*
         * Desktop only.
         */
        if (isMobileDevice()) {
            return;
        }
        /*
         * Ignore movement between elements inside the page.
         */
        if (event.relatedTarget || event.toElement) {
            return;
        }
        /*
         * Trigger only when the cursor exits through the top edge.
         */
        if (event.clientY > 10) {
            return;
        }
        /*
         * Wait until the cursor has returned before allowing
         * another exit-intent trigger.
         */
        if (!exitIntentArmed) {
            return;
        }
        exitIntentArmed = false;
        if (!isChatOpen()) {
            openChatbot();
        }
    }
    function rearmExitIntent() {
        /*
         * Rearm every time the cursor returns to the page.
         */
        exitIntentArmed = true;
    }
    document.addEventListener("mouseout", handleExitIntent, true);
    document.addEventListener("mouseenter", rearmExitIntent, true);
    window.addEventListener("focus", rearmExitIntent);
})();

/* ~ EXIT INTENT - OPEN CHATBOT EVERY TIME */

/* =====================================================
   MOBILE-ONLY LAUNCHER IMAGE
   Desktop launcher remains unchanged
   ===================================================== */
(function () {
    "use strict";
    const MOBILE_IMAGE_URL = "https://fpu.branding-element.com/prod/88870/ENGATI_PUBLIC/147645_16072026_051439_Chatbot_Logo_Chatbot_launch_icon_logo__M__01.png-rRe65.png";
    const mobileQuery = window.matchMedia("(max-width: 600px)");
    function updateMobileLauncherImage() {
        const launcherImage = document.querySelector(".upgrad-launcher-image");
        if (!launcherImage) {
            return;
        }
        /*
         * Save the original desktop image once.
         */
        if (!launcherImage.dataset.desktopSrc) {
            launcherImage.dataset.desktopSrc =
                launcherImage.getAttribute("src") || "";
        }
        if (mobileQuery.matches) {
            launcherImage.setAttribute("src", MOBILE_IMAGE_URL);
            launcherImage.classList.add("upgrad-mobile-launcher-image");
        }
        else {
            launcherImage.setAttribute("src", launcherImage.dataset.desktopSrc);
            launcherImage.classList.remove("upgrad-mobile-launcher-image");
        }
    }
    const observer = new MutationObserver(function () {
        updateMobileLauncherImage();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    if (typeof mobileQuery.addEventListener === "function") {
        mobileQuery.addEventListener("change", updateMobileLauncherImage);
    }
    else {
        mobileQuery.addListener(updateMobileLauncherImage);
    }
    updateMobileLauncherImage();
})();

/* ~ MOBILE-ONLY LAUNCHER IMAGE */

/* =========================================================
   upGrad Engati SMO doodle icons
   Generated from the 10 supplied PNG icons.
   Paste this entire file at the END of your custom JS.
   ========================================================= */
(function () {
    "use strict";
    const SMO_ICON_MAP = {
        "check eligibility": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AJjUlEQVR4nO2d3XXaWBuF9zvru/+SCkwHJhWEqSCeCsJUEKaCKBXE7kCuILiCIRUEKhhcwYQKzlycV1gRksAgYB9pP2vpAo" +
            "GPhHh8/tDZWAgBQrDy27VPQIg2/neJg5jZ5BLHEZclhLA49zHsXE28mU0BzADcnuUAgoUVgPsQQn6OwjsX1MzGAOYAbjotWL" +
            "DzDOAuhLDsstBO+6Bea/6A5BwiNwB+uAOd0VkNamZ3AL51UphInT9CCPMuCupEUDN7A2AN4P+VpzYA7gHkIYT1yQcSNJjZCM" +
            "AUcZxR97mPQgg/Tz5OR4LmAD5Wdq8ATLo4ScGLV04L7A6GH0MI05PLP1VQP8F/K7sl54BokfTtqQ50MUi6q9k3k5zDwT/rWc" +
            "1TdW68ii4EHVceP19iAldw4Z/5c2V31Y1Xcw5BFx2UKdKkOnKnELTK+gxlijTovFunm0UENRJUUCNBBTUSVFAjQQU1ElRQI0" +
            "EFNRJUUCNBBTUSVFAjQQU1ElRQI0EFNRJUUCNBBTUSVFAjQQU1ElQAiAFvvtadCgk6cMxsbGZLAH8D+MfM1p6vRYEEHTBmli" +
            "FmaZXXs9+AaF3ZRfJBBRee15qjPuRtxZRpIEHJMbMFYo22RMy4OloeTwDJAHxqeEmRpUWDBCXG+4LvffsIYIIj0zr21JoA8I" +
            "SYCLM+pvxzQSWo/4fTdNAvwHJPjTiqPP5gZneviTb0a3qP3XC3gg2AaVdxiV1DI6hPcSyxG+XXZzZmNmlJJa6TNzez8SE1nW" +
            "e25mi+pk+IctL0OaswjeKnGJacQHy/jU225x19qfmbvK1QM3tjZnPEQOG6a7pBDJm9Y5YT4BJU1BBCyBDjLMu8N7O6NLmi1l" +
            "wD+NBQ5ANiuCxlk16FSdB7AN+vfRIX5jsOGzVPa/Zl5W9+zGzkI/6mWvMZwO8hhKSiMWn6oH7RJtc+D0ZCCEsz+wLgc2l30d" +
            "RPvDbN0NxFegCQpSRmAY2gop0QQubNd/lbn/dmtkbz1NEKcepocebTOxtMTbzYzxRxgFOmSc4vIYRxynICEjQpfDoq2/OyFY" +
            "B3PrhKHgmaGCGEpsHkBi+1Zqe/9nZNJGiaTBEn2YtM+O8Axn2pNctokJQg/i3Syb+gkQKqQQU1ElRQI0EFNRJUUCNBBTUSVF" +
            "AjQQU1ElRQI0EFNRJUUCNBBTUSVFAjQQXMbOahYXMzy3wtPQW6m2nA+KK7HDG5BIh353/wfRTrl1SDDhRPtvsHL3IWbJjiby" +
            "QoOd78Tjosr8gD/dzwkkVXx+oCCUqM9wW/AvjbzEJTWMMrysuwmwdasAHwVwiB6kZoCcpNNUjtl7CGQ/F47zWaa81iyQhV9C" +
            "JANkgys3sML92urVasXottWMMhhR+YB5oxirklhHDShthnCaUtO7KcWaWcoWyzPddl+dq/8b+bIGY0NR13gZjRdLIDpWNm1W" +
            "OcWiZTE08z93Zh9r3vKXbDGr42/dCBJ9vliD+KUBfqUCTbTZhG600wCbq49glciUXbky1hDXl1RynZrims9gkJJdsBRH3QEM" +
            "LCzN5hIMtpnfkhIQshhHuXrzxneWtmmWc2vUEUtilykTpFuQ0aQYFtbdGbVIyOmWI3gfqzmf1ET5PtAK4mXrTg/cWs5qmv6F" +
            "EeaBUJmhAtuUxVHhDnNRfnPaPzI0HT4w67o/qCFXpQa5aRoInh4k1rnupFHmgVqkGSOIwQwtzM3iJ+0zTBgbMBKSJBE8Vr0g" +
            "V6Pn+sJl5QI0EFNRJUUCNBBTUSVFAjQQU1ElRQI0EFNRJUUCNBBTUSVFAjQUWx0C4zszum4DBAN4sMHjObArhH6a58M/ud5b" +
            "Y9CTpQapLttrDICaiJHySe8bREjZyId+XTIEHJ8dCwpZnlTWENryhrZGYLNC+0W6H+bv2rIUGJKQl5ixjGkJ9QVob6PNCCYs" +
            "kI1Z35VH1Q/0AU3PBCtcbchjUcegC/pjnqIxcBrzXZxNxCFB42QXPQVZ+3Scs1GSFGcVf/ZnxkmFd5+3nsZzXU8LDJtU/gSk" +
            "yanmgJa8jbCnxFHmhd2VQwCdqLddxH0Pq+G8Iabj1L9Rd8wv0e7cl2f6WSbAcQ9UE9IGuE4QXYHhIeW6TWlUfen8xsXsxZeo" +
            "59jnoxgSj5NBUxC2gEBYDQnjY8WEIIP/0bn2+Vp3IXc4b2FOUkk+0AMkFFMx7W8IRfIxZvEKeOmnhClDPZ7hNTH1TsZ4rmXK" +
            "YyRYryXcpyAhI0KVpymco8ILEU5TYkaGK4eI81T/UiD7SK+qBpMkMc1Y99myPhFOU2JGiCuIjZtc/jEqiJF9RIUEGNBBXUSF" +
            "BBjQQV1EhQQY0EFdRIUEGNBBXUSFBBjQQV1EhQQY0EHTi+0C73BJO1mc19bRgFEnTAmFmxGO+j77pBXFJCc9uebrcbIJ4Bmu" +
            "PX9U0Fz0z3lUpQcswsR0yiW3YRi1iXB1ohP/UYXSJBifG+4EffYGYPxy7NbssDdZ4RV4Aujin/XKgPys2o8viTr4N/FXvyQI" +
            "G40G7MJidAVIN6v2iO5ovYR74DaFsaXJcXn5vZ+JB+4gG15grAjFHMAqYadIZhyQnE99vYZPsKzqfK7hscsB7pFXmgi0NO9F" +
            "owCSrqmWI3rKGxqTezsZkt0ZxstwLwLoVkO4BL0ByHpWb0iQ1it6aRlrCGvPqTMV5r/kB9WO0GpCnKbdD0QUMI64Gm2+3tS3" +
            "ou0yNeJtSB2NTnAO68Nr1Hc4pyksl2AJGgwLa2WFz7PEiZIYbdluMVP5jZHPUT7kCsNbMDIx4pYWriRQstTX2TnEWKcrJyAh" +
            "I0KXzE/bDnZUWyXTIpym1I0PTIEL/1qeMJPUq2AyRocpSa+rKkvckDrUI1SBKH4U39yKeZxjhwNiBFJGjCDGHWQ028oEaCCm" +
            "okqKBGggpqJKigRoIKaiSooEaCCmokqKBGggpqJKigRoIKaiSooEaCCmokqKBGggpqJKig5hyCjs5QpkiDUdcFdiHoovJ40k" +
            "GZIk0mlccnR+x0Iei68vjmmAxLkTb+md9Udp8sqIUQTisgriz8t7J7BWDS15WG4lfcgQV2s6HenurAyTWon8BjZfctgEU1fU" +
            "30jxY5H7uooE6uQYHtSa6xG8y/QUxdy/sQwyJe8CTCKWKoWd3nPqIRFNj+5s63TgoTqfNHV/E7nU0z+Qn92VV5Iln+7DIbqr" +
            "MadFug2RgxNbg6ohP95hnxByE6TW/ufKI+hLAMIYwQa9NV1+ULOlaIteboHNHindegtQfRvGgvucQvhFxEUCGORTeLCGr+A5" +
            "4u65cy4FG8AAAAAElFTkSuQmCC",
        "check fees": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AIcUlEQVR4nO2d/1XbOhiG3++e/g8bkE4AG+BOUDaoOwFs0HSDMMFNNwgT1J2gYYKGDWAC3T8k9xrFjpNgS2/w+5zjA3bA/m" +
            "w91g9Hks05ByFY+Sd3AELsQoIKaiSooEaCCmokqKBGggpqJKigRoIKaiSooEaCCmokqKBGggpqJKigRoIKaiSooEaCCmokqK" +
            "BGggpqJKigRoIKaiSooEaCCmokqKBGggpqJKigRoIKaiSooEaCCmokqKBGggpqJKigRoIKaiSooEaCCmokqKBGggpqJKigRo" +
            "IKaiSooOZD/YuZXQFYZIxFiJo759waaAgK4BzAdZ54hHjFef2LinhBjQQV1Hzo+fx7kijE1PnW9cFOQZ1z88FDESLCzDoFVR" +
            "EvqJGgghoJKqiRoIKavlb8KJjZHDtaboKS7zkazcpBBTUSVFAjQQU1WeqgAIpo/QHqScXGHYDPjfUiRxC5BL2K1tfOuSpHIK" +
            "IdMyvwWtA4zZKQvIgP/U7Pos1V6jhEL1W0fhbSLik56qB38Qblnnx0pMlW2o1NUkHN7BzATbT5IWUM4iDitLkJaZiM1HXQBb" +
            "aL95NsHIWEugpLnWhF+FmFn88A1vB17OeU8Q3EAq/roWdhW5ksAuccnHOAv7iuudSfDbG07R8+4QY7xtgLvIwLeOnic+lb1u" +
            "F/r3Kfx4HnXLWcSzHwMTr3n0TQkLDPY5/oiIlUdiTUscsaQJn7vPY897aM5XnIGy2roDvkXOW++HsmzmZAMeNlcwo3KYDVmJ" +
            "LuEnTURpKZ3cDnPHG98xEp6zEHYmbnZrYC8BPARc+fvwD4FZb7sNTrLz3/ewHgp5mtUjc+DqSET7MmZwCqkMbjMUYOCmCG9r" +
            "tu8OJhhNyiK8d/lfvDJ9psz2tR7rge7+G6rPa5FsfkoIMJCt+S7UsI9kQoe2KfvzEhZmEfu26AMvd1OFLS5o17nlVQ+NZo1V" +
            "g2PbmDg28YnKqci0Mves+xzsM+T1HSGfZ7irGJHFmkFLTaI8DREjihnBuM2IjB7kYYs6R9N1jbUjEKWoE41wznctUR+zrFTR" +
            "USuytHOoVrt7cLxwg6Riv+Cb4l+9E5V7gwCRQjoeVctXz0CH+RRv/2JxyjwHYrGfCtZNrWvXNu7ZwrAHyET/OnoY8xlKC/AH" +
            "yCl3LmnLtzzm0G2veYLNH+CCyJnDU7JD2Dj5Ea59wmpPkMXtZP8E68maEErZxz1YlICaC1vyPgc4CkctY0JI1zoc8h1pMgyF" +
            "phoC6UUx7ysWzZVuaQsyYcu2z5aJk2Eh4mKaiZldj+hujeEfRLDTHcR5svQsyTY5KCYjuXeoF/gM7CHNtfkybvLMzA5AQNwx" +
            "auo82LnEV7TIgl7id7mWPIRW4mJyhOp463bNlWJo4hO1MUtIjWHxifPoSY4iEXRfpI8jIpQcND78to8ypHLHsSx3bJ/OB+DC" +
            "YlKNrHdlepgziAqmXbpOqhUxf0hbF4rwmxxa15CfqOiYtH2n4CDeIYVcQLwcLUBC2i9VPMQYscQeRiaoKKE2NqglbR+ik0OL" +
            "ZmAswSRSamJuh7gOYr2RRMTdA4cU8xB5Wg75i4eDwzs1mGOPYixBb3+FcR/45pS9widRAHULRsk6DvldCNLR73M+7ULW8jju" +
            "2RqVtgCiYlaKCK1j8zFvMhpnjMVJU8kMxMUdBly7YycQz7ULZsWyaOITuTEzSM04+L+TumbmwhlniIxyPzHANjMTlBA/Fwij" +
            "PwjUl6F1Olv5VJCuqcW2J7/Pktw/jzEMNttPkpxDw5JilooGzZtsxZ1IdjL1s+KtNGwsNQghZmVjC2hrsI48/jMT8XyDQfUm" +
            "OeqHi8/gPDeP19MbNZKAWKIfY3lKDX8NNl/zGzjZktTkTWEts91i+RWNJwrBW2x0u94ARyzyDlwsw2AP7AuxAP7T6KMYr4C/" +
            "g61B8zq5jHcjfmQ4pJJmkj52xL0CzzRO2LmV2ZWQUv5S365/M/mLHroNcAfoe7i+YxTpPw6OZry0eXANZjNpzCvtfYzjkB4C" +
            "vrY6XwkokFgN8YKKfs4tg3zcUXbobdd88tfD31hnGQmnNuaWYA8G/00QX8WzjuAcyHys3CzTrHdmu95itrqz1U3dqqIzFP8L" +
            "NH1xx3szVmuS2w5wzLO2YKLqGXKOza/wx6iULbfoedAnzPhNBraP6/Fn03bn1dirHPb6Trwv8amo4D33ScVJL5398Qd92q3m" +
            "fu9Wc03mSB129A6RO9mcDs16NtHv1nADcD7D+PoGG/XXeeXoWoVyH2Cjr6N0nOt0QLbD9vpJ/a2vlpzWfwrfy2lxwcyyN8Q2" +
            "jmyB/Cd0yV/gIv0fhPGcbOQXftH3odN/2C9tfMvLlYj47RmYMe+5jpYJxzlZn9APClsfnSzApHnovUOJ9j3AF/HxVdheU8LP" +
            "WXElX4+Qwv5toRP3DvIuSe19HmH865ZDMCJhM0cAffcDqLtlWJ43gzQbgKJxj7AZTR+gsST0WetDdTSNT47ovrN4KHL9H6Kn" +
            "VJkKO73VbHW/bG0hTpSJPknaaTCxrqcXGLvkgdh+iliNZfXIa+AanroDVrvK58XykXpYNiTqhcglZ4LehnqC7KTpXjoFMe8i" +
            "FOAAkqqJGggposdVDn3Bxc49AFKcpBBTUSVFAjQQU1ElRQs7ORZGbzRHEI0UpfK/5bkiiE6EBFvKBGggpqmkX8M4BfuQIRos" +
            "HfTtEWBi0JQYmKeEGNBBXUSFBBjQQV1EhQQY0EFdRIUEGNBBXUSFBBjQQV1EhQQY0EFdRIUEGNBBXUSFBBjQQV1EhQQY0EFd" +
            "RIUEGNBBXUSFBBjQQV1EhQQY0EFdRIUEGNBBXUSFBBjQQV1EhQQY0EFdRIUEGNBBXUSFBBjQQV1EhQQY0EFdRIUEGNBBXUSF" +
            "BBzX/zKLv3Xv/UVQAAAABJRU5ErkJggg==",
        "check payment options and scholarships": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AQZUlEQVR4nO1dv4skxxX+ShhsR7vGgTHY7AgMTgy3AoFskLl26kSrSOGN/gLtOXB6fU4Uai83qJXYoe4S4+z6bIMlMGgXHF" +
            "hGoN5EksFws1jIBtkqB/Vmt6/6VU93T/2a6fdBMTPdPVWvqr9+79Wr6iqltYZAkCueSy2AQNAHIaggawhBBVlDCCrIGkJQQd" +
            "YQggqyhhBUkDWEoIKsIQQVZA0hqCBrCEEFWUMIKsgaQlBB1hCCCrKGEFSQNYSggqwhBBVkDSGoIGsIQQVZQwgqyBpCUEHWEI" +
            "IKsoYQVJA1hKCCrCEEFWSNr6UWYE5QSi0ALOhn+/sxgEP6frv1l3cAlFrrJrRsuUIIuiWUUm1yFfR5CEO69fdbE7O/A6ABUE" +
            "78/85DCGpBKdUm1wJujXcQUazZYhYEtbQcp/GAZ01rTjhPLUBK7CxBlVIFfbXNaVv7HcWVahSucEO+FczDYmvlR1rrhzGFyg" +
            "0q5+UXqVNR4sa05qrl1riE8RkBQ74Vfa/XF2ita1hQSi0BvM3kday1XtnXzwnZEpQ05OPUcgB4Qp8rPKvx1t+bbXrZ9BCeo6" +
            "s9f8aReW7I0sRTRyWUaWtruQa8xjuPqLkqdMn5QMhpkCVBwd+0PlyAMaet7yutdXadDaVUia7bcqG1Pk0gTpbIzsT3+GMVnt" +
            "V4W5nW1KDIwgfW4SsARY4PUypkRdC5+GPkwtToBvDvaq3P4kuUL3Ibi3+ILjnv7xM5CSW65Hwi5OwiGw1K/tg96/CF1vqYuX" +
            "xnoZQ6AfCudfgKwGLuISUOWRB0Lv4YmfYGXSvx6twD8i4kN/E9IaVyn8hJqNAl5ztCTjeSExTGH7OHJB/tmz+mlPoVgFesw5" +
            "cAJKTUg6Qmfi7+mFLqNQC/BaCsUy/soZXwimQEnZM/ppT6AsA3rcPva61/nEKeXUJKE8+FlB7sITlrdMkJAC9R3FfQgyQEVU" +
            "qdojvEd4k9mznuqGcbVSRRdhbRTTyFlGp0tede+WNKqSMAH2HzfIe9GiXzjRQatAI/WrQ35CT8EV1y/pO5rgovyu4iKkGVUm" +
            "fgh/jKmHKEhlLqTQDftw5rAC8CeGAdPyJXQMAgmol3TEC+gpk13gQss/0O0nnoTphS6mUAf0A3pHRXa33miF7sXWjNG7TWwR" +
            "MMQRoYLdJOywBlFTBmc8WUp0mO44B1fcqU+YF1zSlzzVmMe7FrKU4hJqRk35CHnstYwHS+OFLaaRWonu8yZX0B4JC5lntggz" +
            "04u5rCFwCcOLRY56ZtUcZpj8Z0Ja9kAPCao5zXHNcXzLV1akLklsJmbrQaR5zCU/6HZM57tSXMJGj7+KnHeh6RprTLeHfD/z" +
            "jLcpKaFDmlsJnzJtebr+Ug3jpVay0JMwAQ5CGh/D9g8n864H8LzrqkJkVOKVzGPCnOPeZ/5iBmDdMjXl+35LSqRzm4Ds9XAF" +
            "7eop3K1MTIJYXJ1IR2gvl9PfmXrWv6zL8X806m/Ssm/zdH5HGIrhu0gkcffZdTCHIeOkyvT5+PI95pq/wlc9PXyVv0AMCnTP" +
            "4fTciH0/JVanLkkPxnyJve2nMZtZX/J2Rqqx5iaphOiRfNBOA3TP5fAjiamB/3UM8+7OQ3Mz6k5N1cwUzCcJHQlXx2zl52mP" +
            "bJVgISduLbxeNN43wpDY9hEyqDC830pQYee+wkBxdS2ppMjrrNOuzk86ZxjVt5zL8AP/rSR8yl9wbjQ2dfeMp74ajHbDtMvm" +
            "4aF2rx1rDgQzHr9C/cuBI1jA8cROuAHy36CsDPPZbB1bVMTZRUyUeDHjtM+9YOPmmUvmB8tBsHE1L6kpGhd7RoQjncxJoVWr" +
            "HdOSUfDcoRaGviwHS4+mYkFVEbiu+YfRqorCVTVpWaLCnStg3JmaOtRouweXzdW6hohExvOkz7UcAya6bMIjVhYqdtGrBgGn" +
            "ArU0Tugm3e2nl7C/aPkOkIW44WeWzfOjVhorf/xMbzPgHZoY2vtTISBa0xYAJywLI5SzK5jXcx+Wy4SUOIRHbOnK1TspnmcE" +
            "9APopU/gJdP7yJ7eKkTFMazdtoEfo7QiskDFJj5ATkgHJwlqVMTZxo9R/ZWNwTPdp5J63pmi6nSaMm1RIINFo0QQ6XO7VITZ" +
            "4o9R/ZWJwpHmWCYTpCfbHN6B0hRsZJE5ADysNZrSp1O0Wp+4hG4kaLzsdoOvS/O5SsIzSgnoMnIAeUy1YOQV78yy0NbZytJi" +
            "Bj8ySPKrVJJzmPAPyPkS9oSGmgbAUjV5FaruD1HkiuyROQqWGz7AgxsnITkIOMFk2Uz5ZtmVqm4HUe0CiTJyA7/tvuCC1SN0" +
            "BL1l8zMk6egBxIxqanPfcpFYMI6jArG0eLkNEkj4E33vsE5AAych2lfU3XBHUuDdizucFS96ylRDvFnYHfyvCS/l+7/u8LtE" +
            "bSi/TzRwB+QN9/COAb9P0A3TWU1jjXGayTT4vcnqG7vv0s0Ld2ZYURO1IQoSu4G/IRDDknL5BFa71/l36etE6tV8z7OvjVjM" +
            "fi31rrFzzkMxnUnqfo7h01K7AEJS04eEcKWkWuQne3DsCs3Haqta6Y/x0BeJV+fgfAT+j79wB8m773abkQ0ABej1heB9T+Jf" +
            "j2BExn7hcAPoskUmg8dp5x+I+DR4vQP8ljBeA9mA7R01ZK7eO40pdI6HfC+Pz1BhkrZBCS81zvUT4ot7nBI+B625hjOnYI4A" +
            "5u1t7kcADgpZ7zsaBhNDkA/AfAh/T9IwB/pe9/0Vr/KbZgwLWfWcK0pwtPYB6efVuJuhfPLGDr2C8zV/wXwOf0vcENAf8M4B" +
            "8AkEMnpw8tP/OXcPvOVwB+D+BvseQaC73lCtlKKW0dul633yaofWFstDtQF/T5FEZ7AMDftda/iytSGJA1OoPbz9wZaK236i" +
            "P0EXTTDhS+8T6Mib3WcjAvnV1GliMZaJeTM/RvTyNYw3JWa2zuSJzTde/BkK197nMAP+3pPM12mWsMW8t0V9MiVCeps4kChY" +
            "wKGL+uocONZoLzDp/1/tonUUo16Jqw57m89hnUTqfgBy8A827/J9idsJGt/bfa66nPxPvQDA0cTxRm/uIXzGAC1z7tVGLHwk" +
            "bohiG3soxMmxTX5zzdBLuAh63zdZ8A+5gwbEOHh8hosszI+tlTJ5st8xtu4qeANkxl1T7F+D62zl1qrRdbF5wZKGxUAnij57" +
            "ILmHhmzfy/wLP7OrXRwMwPSB4HpZGut63Dd/XEsF5QE08E5yY0n7fOc9Puspkp5KkNNu00sgIzfxNmFZExK/atYDpbRew6Wn" +
            "Jzq0IvfGtQnwJXLhJij5e5xrBV98p2Xak9yg2EHpIaJJrwDQ+vAMUmaC8JHRXa2bAThvmZta1VBhJ6bOqUE6kNuDm/DUa+Wx" +
            "aFoENI6LgxyV+UG1nHTa9Mr29Swfx30//ahGunvsnfbWUQVZvCvbKhprousiJoDwkXdK7gbkZq0o2o27LnhqxJwvrW6A/SN3" +
            "RDex9WmIhJtUGGZUYkXT9sJYzyKigdWnlEJWgvCbGDy1xTnTZpsTO74QeQs5lCKNz4sLtCUicBoxOUCqxdhWKHdlcjWTf1sG" +
            "v0mLIeclYuQo8khuvBiW3uF477niVBe0noePrL1IRsybdJQ621Xy8J4H7RzeeeUa41ByaHfbaUpxhA1LQEpUK5DkHZatQsw0" +
            "4Y5meWA4nD5bMMJDdHCq9bno+UZwHjd3IPTxYE3RR2WjKCVQkbdMiTXw19iBwPaLD6wb3ARhGqzBGy5UfQISR0NGjUsBM96d" +
            "UGYtZj5EKi7WTAj+jVQtB+4TgSLuhckapBMWw0p8GEzgYCb/+9oWzuYUsaa86doBwJi9Z5zkdZBpZpif7RnEF+Zk/+dt51RD" +
            "Jw2jvpiF3WBOVIOKBBGwQwhzAmsO4hpiYNtPBMkGVkQnidDpeSoM8hArTWJzALNDyg1D7XALhv/eUIjkUipkApdaiUqmAWpr" +
            "3tuOwJzDSvpd5uxn/BHGNXYwkIu7wjmgq4e0j5ZLWeoEME2l0Nw/xMbxoOXf9zq32jJsqwYOpZxJajJU/eGnQTtFmvqbQOHz" +
            "DHBkMpdULvRN0D/y7QFYzmPtbMsjxboLB+R59grI0FuLIOHzOXZo8sCAoARJIn1uE7NMt8MJRSxzTD/1243zl/BEPMUm+xmN" +
            "lANIHzd8F+MHbSxGdDUEI58FgHA/3MCxg/80TP7M3SXUVWBNXmPZR3rMO36R0YJ5RSpzCa6o7jkisAr2utj3WEtUkF/pAVQQ" +
            "kluv7TGdcLVUoV5Ge+Bfc75/dhOluVRxnHIJVptX3O0K5MEGRHUDK99tuBBwDWb4hCKbUgP/Mx+v3M5yP5mW3Yvl/0zgk9zP" +
            "YDm/xt0CnIjqCEM5gFc9u4BeCciPkx+tc2ukjoZ9pl3k4QgyyYY01kGbwgS4KSxjtB19QfYNiiWynNWc0cO4ksg13e5a52Cr" +
            "MkKABos0DBEl2Scng/rDTDQXLb2n8Zq3zS1nZnMfZIljdkS1AA0GbDhgLdG77GEwDPwyzwmhNsQtweG8/dAtwQcRWpbO/Imq" +
            "DAtUaqrMMfwnSAikxNF7cEzKRlYcaA1h69Zx2+0BkslzMV2RPUgc8yJSaA60iEHc+9RcswhkTFHAtdZlDsKkE34VgpVUY0qx" +
            "xKdP3ne5sGHaaCRtFuWYefaMe+VqFBI3tLpdRWlmNfCXoAY+oeK6VWRNaooR7SoiVz6m3fJCVy2h2jK0TsnLVkKUiepzAr4P" +
            "Wt9LcR+0rQNtZkbWhINBq0WY7QNvWAIenWPikNWJyDH+I9jekGteZCPHbIMwlzIOgaBwDeUko9jKxNT3GzY0kbbyilmqluCP" +
            "mz5+iadcAsw15NyXeiLOsFJLwRc43Yu3yEQm39PoYJT3Hj86/ADJsWMYZAtdYrImGNLpmOYNyQC5heft2n9YgIS0quuQcP9J" +
            "b7Fo0ByVT3yHNJ55vWsYa7kEWqWdYjZ2SXmPASGsyIimtpmEF5eKzDIYbt8tHQDT2jelf0e8jaR8vIdVr0yFVh4NukzH+L63" +
            "OpyReSoD3/X6cyQV2WA8k2Jp0PJYPnutSMLCuMfL2kj6Cz8EG1MXncDsan6xlSEWWpYDTPg/4rB+ESN/NcowbjKRJhz4u4gi" +
            "FX7aucWRAUuCbGXevwVu89bSHLSmt9CuBbJBPXierDIxhiLnS6ea6l9XtNTq8Pyr50kgZBa31Ge2S2n/wTpdShjjtndC3PCs" +
            "bXPCNNfoybXT7a80jr9adP7TQV1Ib2PNyzEFp8VgQllDCxujUOYHr8SWf8aNN7b1LLMRD2dL4rBJprMBsTvwZpIHt2VBFfkp" +
            "1GYf2uQlmgOWpQwJjMdlD5RCm1k+/sJIJt3utQBc2VoI31+wjdaWqC4QgWQZidiSfUqQXYJ+iAY/5zJahgRzBXE79Cd5kdQY" +
            "aYJUEpXleklkOwGWLiBVljVzXoYeLXOQSRsKsEvYVnR4MEewox8YKsIQQVZA0hqCBrKJrRLBBkCdGggqwhBBVkDSGoIGsIQQ" +
            "VZQwgqyBpCUEHWEIIKsoYQVJA1hKCCrCEEFWQNIaggawhBBVlDCCrIGkJQQdYQggqyhhBUkDWEoIKsIQQVZA0hqCBrCEEFWU" +
            "MIKsgaQlBB1hCCCrKGEFSQNYSggqzxf2JrWWs7LU2hAAAAAElFTkSuQmCC",
        "connect to alumni": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "APH0lEQVR4nO2dO5LjyBGG/1KsXHW7shpzgmmdoDknWK4jdzAnGO4JlmuuJY6lCDlC34BzggFPsGxP3oI3YHsKOSmjCj1gsv" +
            "Ak6gEgvwjEDF9AovpHVlVWVZYiIghCrPwptAGC0MQPoQ2woZR6BHDP3j4T0TGEPUI4VAxVvFJqDWAN4BHA+5avvwDIAeREtH" +
            "dsmhCYYAJVSiUAttDCvBt4mhOADMCOiM5j2CXEhXeBKqXuoYX5ecTTvkKLdDviOYUI8CpQpdQKwB7DPWYbLwBSaavOB2+9eK" +
            "XUFsA31IvzBOALgJ8A/I2IVPUA8AHAJwDP0B7TxnsAuVIqHdN2IRxePKhSKgPwsebjA3T13KvDY0S4BfBQ85VPRJT1OacQH8" +
            "4F2iDOE3R1nN94/g20UG2eWUQ6cZwK1IjnH5aPvkKLc5Set4kI7GEPUf0k4ajp4kygpkP0zfLRMxGlDq53D2CHa2/9CuCRiI" +
            "qxrym4x6VAC1y3D52Ik113D+BH9vaBiFYuryu4wUkv3vTYuTgPrsVpSKHDTVWejEcXJsboHtRUtQUuOy2vABJfoz1mLP939v" +
            "aJiBIf1xfGw4UHTXHdo974HIo0gfov7O0H8aLTw4UHLXBZvQfxXDWe3HkbWBiXUT2oqVp523M75jW6Yjw2Dy+tQ9giDGfsKn" +
            "5leS9kDHLHXt9JNT8tXAv0EHIanGmL8nH7VQBThIGMLdCEvc5HPv8Qcvb6MYQRwjDGFigfaoxh2hu3gS8lESLG9XS7GGe5i0" +
            "AnxBJWdXIP2rbmSYiIJQg0Ya9PIYwQhrEEgfIqvQhhhDCMsQXKvdNq5PMPIQltgDCcsQVasNcxhHS4DXkII4RhjJ1ZJAfwVH" +
            "m9Gvn8vTAz7XmnqPB07eokhxfoiMYZutNWAChuXe6yBMYWKO8x3yml1gGXXNjG3nPfRuDyIXmbTK2UAiqZUqCzpcQYmguGi9" +
            "lMZ1zOIPpKREEmaVhmVr0QkZdmB/OgfXiBzpayl2Uqbnrx3Fv+aGY5ecUsS+Yzq/jkkRh5D73Q8A+l1FEptTFTBxeJCw+aAP" +
            "iDve11TZD5gx5xKVDfs/pXlZfl/8usfU/8+x14BrBdnFclotEP6CqK2LFxca0e19/6un5HGx+hVx9k0J0mbm/dkQNYhbbf1+" +
            "FkVWeNFwWAD+S452qq9n+zt0/QS4+j7YCYMltDe1u+KtXGATq3QOHMqBhw6CG2uH76z9BCcXXN1HJNArAO7Ql63sc9gA10M6" +
            "XNo+4A3Ie22VlZOC7ovEakowvG/EGtf8DQhXzjfa1gb7LwMk1D2+rk/h0XbtlZcfbkm2vsa66Rhy7gEcsy6SDUfG7e1EfBlq" +
            "srbQVaDH3yzXm3xnvYzn2c2x/L3HfS8EA6q6GC3a+nQm3ypKVQd+jQPoXuSGQNwiTzB5ydOFk5rBoe/Mk3bcrDW4blhuReNg" +
            "7m3xxa3GX8sMtk419pQanATZqhX2o+PkB702ijF22EyFG/hhbqw8infoGOteYjnzd6zEhdBvsDPOm06EF2+TDedGOOW/PVn6" +
            "CD8Nmtdk2ZlhrqFTq4PzmRBt8nyQTW1+gWnC55hW5n7kmS015QM1ABTFSkwQVaxYxfl+3Nsu0J6A7WGbpTcJxaIfumYTeVyY" +
            "k0KoEK42HapTkmLtIlLJpbJEaAK1wn872D3qon8WzSIMSDzpyaqYeAFu4q9hCUeNCZYwS4xnUStffQoanBmJChUwZ5UNaZmQ" +
            "MFZt75amiTDhrYqEQLTtBDznsn3rjH0FqC9iHGqR8FdCwxCT3E5+KA9qS2+14NOFfBznF2YnMHQ+7RPotmjscWMxzPh31a4r" +
            "nPvUJ3vvg5Mu8Cha7G5+wx244jHE6wDihS22yofY/f55bfOymn2jZow4hElUPL51OgbRLKpOKGXWjo2bduG+l9UeQAz5lhRv" +
            "MNK/e8ht0z9K4Cp3DAXk0XbfcJe3PPmR5sBtRNMC6wgNWERqi2hzMPbZuDe91Z7nPb8P17S9kUTm20GLG1GD3L2ekNf4i6Gi" +
            "QNbdvI91nnjJKa79u04XQ5uc1g/oeZXfXW8Y/3aKtFQtvVwe6k5/dtoaes5rtczM61wUeSUlwHclOKfDjMBaQ7Rb+ytx98jJ" +
            "7cyF4pVZhObiukO0W8s/uRj9XXpBLKnGuDPSF83dAxtEcI7I1sNYrVu8Rw4DovwBEd+g3oENe0aKO2KTDqPTEjvLYvpnDgut" +
            "ca7UOL+kV0eZtQYY9gJOazVgG7Ot6q+JotAvNG97sMeFwwyl1CavZJLXkC8E0p1TTNbmt5L2X/Vsk6G3cDjbOZaEbB6RuYRP" +
            "vb/K3eoXnw5Ak6rWPGhUp6sSH/7cZ87yN7/4U8LU6U6XYzgogK0iM6H9As1I/4LtTqjLSMfe8OwL8sv9/dYmcfRKAzhIjyil" +
            "D5jPoqHwEUSqmtUuqe9MrYtp1aTuRxBa0IdMYYoT4C+IT6DczuoBM/FCYJBG9z/5m9zsa0sQ0R6AIgooyIEnQT6t8bTvUKz2" +
            "nURaALwlTNj9ADEHwJSMlfG07hZtZ8AyLQhUFEZ9JLPBI0C9XG1oFJjYhAFwoT6nOHnxwoQLpxEejCMUJNoWOoTULdejGIIQ" +
            "IVALzFUFPYg/0nX4F5jghUuKAm2L8NZc/Ye3UKM8F4zJVSahXKewLiQYUWQooTEIEKkSMCFaJGBCpEjQhUiBoRqBA1jWEmpV" +
            "TuyY6YmUuKyUnSFgd98mKFINQgVbwQNTKStDDM6t3qFj8lBb5nmo5moWBVoAWuM2kIE8esylybo1OTTSn1Ar3kPAu9sld2+Z" +
            "gpxlNu0G8HPxsHaKFmt9o0BBHozDAec4fbhck5QGea8epRRaAzwiT42qHbBr0vuExK0TVi43W7cxHoTFBKZbDvdFxygF5SnN" +
            "d5QeN9V2jf3PcrPGU9FIHOgBZxPkNnTS56njOBzslUt2W6l53qRKATp0GcL9Be7qY2oxFqBnsT4MUkhnCGBOonjFJqA7s4n4" +
            "nocYwOTWUJyM+Wj9+bB8QZ4kEnikm3+Lvlo2ez+M3FNVPYtyb65CoMJQKdKEqpI65zlToTZ+W6Ka5F+gqd7Hb09mjwKt6kAN" +
            "yyNIBCA0YkXJwH1+IE3tLnfGFv38FRzqagHpTtWlYmptrFNBYcI0qpApfZlF+htyIsAtoAAO/GtiG0B00r/79IAyge1U7Nbh" +
            "u7AGlpUst7m7EvEtqDnlE/6iEe1YJSao/LIPorEQV5mM2E9mr46WTSPI5GMA9qPEHTkFzVo+4akv8vBlOr8BEer/k6GRl7/W" +
            "CiC6MRsopPO37vDsBn1CT/Xxgry3uZZxveMB0mnr5x1I3OggjUiKxucsL/Gn5aTf6fjGvVJODe6RQiJSIjZ69XY548lAdtak" +
            "z/F8BvaE6sulShrtjrGLYJ4jYkY548lEDThs/+AuA/6JYBeKlCLYlBoDl7XbeZ2CC8C7Smc8RFuOmZqnopQl1c6C2EB7VV77" +
            "+x1+/LrRlFqBfw0aMYPKhTvArUhCCuxo8B/NPy9W31xUChzs3j8E25nE51iwHfHtTmPTMTiOf50Z9sG9wyof6M+n1/nmcY4I" +
            "/xfpw6AW8CNd6Mx8iquc+3lp/Z3gPwJtRdwwZVtb+dETF40KvQ15gn9+lB17juHL2Ngph4ns2LtgZ+LTupPUcQH3RBzl7HKN" +
            "Bi1LP72JTejPcXAKhynAHcs+8k7Dtkfnff81q9vj+VA/oh5+XzGNgmbs92zPN78aCmLcnjY1fb6pH2ejy7yQN6zpLh550Rue" +
            "W91LMNb5iQIYdvRnsbnp6yDB2ffOhG97nr95d2GAE01kQebcmZLcXY13DuQU3niC/seqGaBV2kvV9q+SibYdhoCNxD3cHBPM" +
            "w2TK3I51Nko1/Iw1O2wbU3TAc8nQQ9NzS4Fwt9wN6eTzxe/95iA7mwIVRhtlZJqK/q09ACCX1A1zC8XI4er5/5ch6ub8TW68" +
            "xu/P0Z0h4F9DDn4LK94bq2h8NZO9j1zfAGfe9qoOZpDdYxiOWAjj/ycnEq0hpxEoC1q2v6Hursvec46aW0fAz6DkC+5E4T6U" +
            "7mJ8tHH81kmVHLRim1hT1pwzMRjRtaquLhSU+ghx0LDGw/mnPY2qNHiCfNLOVCprxXI/398ppr5M7vL3QB9yioRxFpbdnUiZ" +
            "Sgm1m92+xGmE3n9VLuwQu3Z6HZOk0iUl022wYxlWW0bfKqxglsGjzmWzvXV3lPLjdTQwIrL/kqY8ZMrMnQLcPyK75PeE7Qfa" +
            "nGz0Tkbanz5AQKNIr0FVqks59pXofpHO3QnG15CAfoPkQx8nkbCZ36ZhCk12PberBl7z71alBEkJ4nmwJ4h+vpi0M4APhARC" +
            "vf4gQm6kFLWqq0Z5jFd16NigzjUVPoJctdd/4o89nvQ4iyyqQFCrytc8phF+kJulrKfdoUM6a8yp3mqrHSHABiK6vJCxR48x" +
            "I5rhfklXyBnki7aG86RSbZBuWYdtcjrhOrlnyGTkKW+rNKGINZeNAqHUItUu1PiFl40Cqkx4UT6M2mbDwA+KaUOopHjZ/Zed" +
            "AqZtZ3huYg9Ml8JwvdYwUudnt7RByrNsfgCD03IO8dow49ROdxGNA2jm8bt04RYNgUWpR5BxunfhzRY9LQrD1oFdPT36B+az" +
            "9O696WI9mVoH4ntzlzgp5H2li2ixFoyQChlhzwvao6Qq9gLG60pc/Y+Vxp3ARscQKtYjpJG9THT7tyMP923k+9YT5ByQu+Px" +
            "BTphwUaKoh6kUaun0YwwHd69/BvlKxz7HqeL26ua0E3V5OQpeJgzK+R3NfILX9btEe1IZpE67Rb+y65AN1iK/WbII1yu7EsW" +
            "OaWHtce1TrZmQi0BbM2PUK2uslaK6qWgVq1vb8wt5e3FzWmm3Er/YaFYEOpJK7NMH3jQMy7gEsvzvjslPkbCPWmGmYP3Gxne" +
            "IPHm2aFV2qck5Nfv5FTgkkorPZ7/4b+6iMsACY4VBn5NgS+GYhDIkB85DzIemLMhKB+oUPXbpbTz4deBk8VNf0i0D9wnvuIl" +
            "B7ztO3B1kEKgSlrVMpAhWiRgQqRI0IVIgaEagQNSJQIWpEoELUiECFqBGBClEjAhWiRgQqRI0IVIgaEagQNSJQIWpEoELUiE" +
            "CFqBGBClEjAhWiRlZ1huWbUiq0DVEjHlSIGhGoEDUiUCFqpA3qlw+hDZgIbwnUJDeTEDVSxQtR8399UVa+cSMbBgAAAABJRU" +
            "5ErkJggg==",
        "download brochure": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AHT0lEQVR4nO3dr3MdVRiH8eftROAIri6pwzXMVFQw9P4HBIVsIlEUzwxhBk+qkE0lLv0LSBgEjtbhmjgcjcO9iLuE2zt792" +
            "7unrvnPXu+H0PbW7an6ZP9vWfN3RGJ6l7uAYh0UaASmgKV0BSohKZAJbSd3AMYk5ntA4fAbt6RbOwKOHf3d7kHMhar5TRTE+" +
            "fbzMNI4drd93MPYiw1beKPcg8gkT0zm+UexFhqClQKVNU+6JIb4HXuQfT0JPcAcqk50NfuPss9iD7MrI4DhRbaxEtoClRCU6" +
            "ASmgKV0BSohKZAJTQFKqHVfB50t6ZLhqWqOdCHwC+5ByHdtImX0GoKtJTr7n1M6e/SqZpA3f0ceM78JpFSXQPHumFZJIhq1q" +
            "BSJgUqoVV1msnMToGD3OMY6LTZn65CNfugZnYEvMg9jkQeuPtV7kGMoaZN/H7uASS0n3sAY6kpUClQVfugS66Bs9yD6Om73A" +
            "PIpeZAr9z9JPcg+jCzagPVJl5CU6ASmgKV0BSohKZAJTQFKqEpUAlNgUpoClRCU6ASmgKV0BSohKZAJTQFKqEpUAlNgUpoCl" +
            "RCU6ASmgKV0BSohKZAJTQFKqEpUAlNgUpoClRCU6ASmgKV0BSohJZ88jAzOwB2Uy83gf3cA0jowMxyj6HNVeqJdZMFama7wA" +
            "nwdaplyko/5h7ACjdmduLup6kWmGwK8GbN+UeShY3j0t1nuQfRh5kVNU+7uydbvSfbB3X30t5+VtJ43+QewB1cplxY6oOkl4" +
            "mXty2vmO+OlOKIciI9S7mw5G/5MLNz4POWj47d/SzpHyZZmNkZ8LTlo5fufpTyz9rGaaYj2r/bXzSvgpGCmdkJI8UJW3pPUn" +
            "NEf8H8nezLPilwf1XofNfUVuKELZ2ob97GO6N9TXrRHPFLQXLECVu8ktQR6Yco0qLkihO2fKlTkZYvZ5wwwrV4RVqu3HHCiC" +
            "+T7ThwugFmOnCKpSPON+4+2kpltLuZmjXpEfMgF2lNGoyZHbIiTuZbw/HGMvbruJsQL5iHuegG2G9Clkw6/n3eMN/SjfrvM/" +
            "r9oM2mfMbqNWnEW/WqEC1OyHTDckekD1GkWUSMEzLeUa9I44gaJ2R+5EOR5hc5TshwkNQ6iOBfpKlac8B6kPrxjU2EeGiuWZ" +
            "MetXykNemWmNk+q+OcRYgTggQK4O7nwHHLRw+ZfyElkeYb/pzVcYa5aBImUIDmhubWSJubZGWg0q7ohQoUOiN9qkiHKS1OCB" +
            "goKNJtKDFOCBooKNKUSo0TAgcKijSFNY/fHEaOE4IHCreRft/ykSJdY02cx+5+MeqANhA+UAB3P6H9mfunZpZsmpUJOmV1nG" +
            "cjj2UjIa4k9dXxPHYxX/CxTOVrVcQa9D/NYwZta1I9c79gKnFCYYGCIl1nSnFCgYGCIl1lanFCoYGCIl3WEec3pcYJhR0ktT" +
            "GzC+BJy0fFrjXuaszJvMZW7Bp0wSEVT1bW/B0nGSdMYA0KZV/KGyLCxArbNoU1aJWzl9QQJ0wkUKgr0lrihAkFCnVEWlOcMJ" +
            "F90GVT3SftiPOVux+OPJxRTDJQuI30NbC39FGRkXZN5sWEn3ydbKCw9rHaYiLteAfVpOOEie2DLlszD9R5CY8zL3yTLZt8nD" +
            "DxQKEz0j2CP3OvCS0qCBTKnGJHcc5VESiUFani/F81gUIZkSrO91UVKMSOdM1Zh6Pa4oQKA4XbSJ+1fJQt0pLmSxpTlYFC9z" +
            "xQzEMZzcKVr0lcVEip2kChM9InYz1zP9XLsqlUHSjknb1Eca5XfaCQJ1LF2Y8CbYwZqeLsT4EuGCPSNfMlPVOc71OgS5pIn7" +
            "d8lCrScwqfL2lMCrSFuz9jC5OVNYFX/Yj0XU36ftChUs7UMcVZP8agNWiHVLOXKM7NKdA1hkaqOIdRoD1sGqniHE6B9nTXSD" +
            "vifK44+9NB0h31maysOdL/uuX3TPLZ9W1SoHe07sUEzX+rmVhh2xToBtZcqly+nxMU58YU6IbWrEkXKc4BdJC0oY55oBYpzo" +
            "EU6ABrIlWcCWgTn0DL5v7S3WfZBjQhCjQhMzsErnTLXDoKVELbWfyJmX0JfNX89Hfgnx7L+AB43Pz4J3f/Od3wpDSpG7pdg5" +
            "rZp8CvgA0YnwOfuftvA5YhhdpGQ4tH8Y8GLpjm/380cBlSruQNLQb618AFp16OlCd5Qzttv7jgssfClm+cUKD1St7QDh36nM" +
            "szM50GkJWGNqQrSRKaApXQFKiEpkAlNAUqoSlQCa3zNNOGTs2surnUBYDkU6dvI9B1j0CI9KZNvISWIlBd2pRVBreRYhP/GD" +
            "gFPgL+RMHW7j7wMfA37a/6uZPBgbr7NfDF0OWItNE+qISmQCU0BSqhKVAJTYFKaApUQus8zdRM1iqSzWKg91s+b5tJWGTbbl" +
            "u81/aLIpndtrg4s8ge8JbhD96LDOHAg+YK5fuThzVTl/wAvAM0Q5uM6YD5/aTfLk6dpNntJDSdZpLQFKiEpkAlNAUqoSlQCe" +
            "1frn+RGqsIccwAAAAASUVORK5CYII=",
        "explore programs": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AKu0lEQVR4nO2dv48bxxXHv0+QixgBRHVxJQpWn3MVF76IqpLOl0ruRMDucypSpDB8ARIgRQCdewuiOruy9BeEF7mwu7vOhQ" +
            "3xKjuVeAgQFxL8XMzMccU77u+dfTv8foABcTySOzv72dl5s293RVVBiFWu9F0BQvKgoMQ0FJSYhoIS01BQYhoKSkxDQYlpKC" +
            "gxDQUlpqGgxDQUlJiGghLTUFBiGgpKTENBiWkoKDENBSWmoaDENBSUmIaCEtNQUGIaCkpMQ0GJaSgoMQ0FJaahoMQ0FJSYho" +
            "IS01BQYhoKSkxzte8KpICIjADsA5j4t+YADlV12VedUkF4f9D6iMgYwAGAPQDX1v59BuAJgANVXcSsV0pQ0BqIyA5cj3mv5F" +
            "cew/Wox93VKk0oaAVEZALXY96u+RNHcD3qvKUqJQ8FLYGITAFMUSzmiX/9bcHnjgDMVHXWqGJbAKP4HERkKiILAI+QL+cRgD" +
            "uquqOqOwDu+Pc2cRvAIxFZePnJBtiDrpGJyKcAbhR8PHdsWWGsegbgEIz8L0BBPT4in8IJtR6Rr/MYFaLzTLRfVtQZI3+Pqm" +
            "51ATAGMAOgBWUJJ9mowbJG/jeWJZY3AzDuu336Llvbg/qIfIriXu0UTpbWDr9+GDGF662LhhFP/bLnbSx7cPS9h8QucGd75i" +
            "juwRYAphHqM/XLKqrPHMCk7/aLvr36rkC0Fa0mwl4P9duztONYKb1XoOONPqoo5sRAnSdwp0jLiLqPBmPiIZTeK9DRRh58MI" +
            "KIwZvlklSQVJC8keUMq8Bn0XG1GuHXKczLFq1Teskpfe8h7G1Kr2PVo8JO33VuZb37rkDDjTZBhcBiiGJuWO8pBjSublIGeY" +
            "ivmLxxqIkmZfh22EfKySl97yHsOVpplwkSnaIy34PWSN6Y6ZaedUkxOcWsoF0mb6ROUskpfXfhlxyuxkg8Io/YloOfDzbTg/" +
            "aZvJE6g05O6XsPQcIDfIsFAws0h9JQ0ZM3Ui8YSHJK7EYZXPJG6gXGk1NiNcLgB+upFxgNTjsNklJM3kgdc8kp27Q3slTahi" +
            "aOem2v1ARbmLyRekGPcUMrh3gmb2wHvSSnDHXPYumvIOLcdeUelMkbDh9M7Pgy8q9ZjuHGb8cAjjXB4K9Cckr9s38V9poxDA" +
            "yae+45ws55XKIN1ssxEr3IDdWD4tJudLHw5DaAb4eyO2epdup7fTpqo9Yj/7yFTUqKuUhczBHKjbeqlnnibXaAcvHJDDnxyY" +
            "UxaIWbtJ76nmBW8LlBIyKHAP6c85FTuA0xX3t/Anf0yRunf6qq+/VrZx8f+R+gOF65/Oa+a+bvo9yevxXJG3A9wabx5BQlek" +
            "Cs8g82jVuT7EUvaYeyySn72e+d96A+Kj3G5tNbyd6+2h81ANfjjbGKyke4OOf3L1X9S83lHAD4ZO3tOym26SZKHKHP4C6ZXg" +
            "CvP4amKPwfwW28weCnQUZ4fRpo4l/HKD7sXMZdEfmH1kuWHtX4TmqMUdwO52372hjUjxceFXy597Gn7+3H/s+Jf83KWHSmoy" +
            "mncNfyzLXgyR1+J5lgczb79ZqyD4oKY9H7qnp4/r2soP6Hersy0J8ECD1dEG6MlYxFgVtfhPvRL+ECprAORfVNOkjKnNQpe+" +
            "HjhdupbzyT1HaqXM44D/61aAVicAY3DgdWZ4KWAP4I4A8tL+uxqk5b/k0TVLgitzBlr/BUZ8W94AQuUgvijVFvnNcFoZdb+A" +
            "KspoYWeTsXcH6IOkTzHekMLlKdNfwdc9S43Lnw6Fv6XHzFKwNjcoJVT3eh9ysaI1bBt8GeL+9X/PpTuN7iSWpjTn903Edxm4" +
            "Sx+6xsG9RKt6sw4G1C9nA7968LX2BhasZvmDBWBlZj5YV/XcIlisxj1isWMU7qNMoHbfBowHC4zY7zznu/1HqY1Gh8dqjKsp" +
            "oIev4jIscoN7VTuYsnNujr5g9tCTpHtV5UAfwHwD1VPW1cAdIZInIDbgro9wCk4OOt3yOrq2d1fgrgb3DjyMsQOKEXIvKdiL" +
            "zXUT1ITUTkPRH5DsBzuG21Sc4zuG19U1WnbcoJdCfoUlUP4IKGPFEB4G0Az7yodzuqDymJiNz1Yj6D2zZFYo5VtdVeM0unTz" +
            "tW1aWv/AhuXJLH2wA+F5EXIpLs2RWriMi+iLwA8DnctsjjqaqO/LbtNJaI+TjusvORIwAPROT/IvJZlxUigIh8JiL/A/AA5Z" +
            "NZWptbLqLP58X/F/kZVL8C8KGIvKSo7ePFfAngQwC/zvnoEm5b9UKfgn6rqtcBfADg+5zPXYUT9WcRmfuoktRARG74NvwZTs" +
            "yrOR//HsAHfht9G6WCl9CnoAAAVf1CVW8B2IVrlE3zXiHyfy4iXzPyL4+PyOcojsgVbhvsquotVf0iUhU30rugAVX9yot6E+" +
            "4MRJ6ov8Mq8qeoG8hMFT1DsZhHcFNFt1T1q1h1LMKMoAFVPVXVCZyoTwC8yvl4mKL6gZH/Ch+R/4DVVNEmXsG18U1VnVg8aW" +
            "JO0IAX9U+q+gaAh8gX9Tdwkf9WT1FlpooewLXJJl4BeKiqb/g2NidmwKygWVT1Iy/qfeRH/mGKaqsi/0xEXjRVtATwTy/mR3" +
            "Fq14xBCBpQ1UMfVd4H8GPOR0Pk/1JEvkwx8vcR+ZeZqaK8iPxHuGt9rqvqX+PUsB0GJWjAi/oWVpH/Jq7CJRc/T2WKKkwVwU" +
            "XkeyieKtpV1beyF6INiUEKGshE/rsAvkG5KapBRv4VkjfCjSV2rUXkdRi0oAEv6rsoN0U1qOSUCskb2amid4YuZiAJQQNhik" +
            "pVr6A48jednFIheSNE5FesThU1ISlBs2Qi/4cAfsr5aIj8X1iI/H1EHqaK8iLyn7CaKhpERF6HZAUNeFHfRLkpqt6SU9aSN4" +
            "qmiu6r6pspixlIXtBAZorKTHJK3eSNoUbkddgaQQOXJKdsIhv5z9uM/CskbwDGkjdis3WCBjJTVGMUR/630UJySo3kjXEKU0" +
            "VN2FpBAzGSU1JK3ojN1gsa6CI5JcXkjdhQ0EvITFF9jBrJKSknb8SGguagqn+vkZySdPJGbChoCSompySdvBEbClqBteSU8N" +
            "SOwq8hoeSN2FDQGnhR30F+ckqSyRuxoaANuCQ5JdxKMtnkjdi0Jehs7e95S787GHzkf90XRuQtkTegL42qzkRkAf8c8TbuC0" +
            "kI0JKgwPktuedt/R4hAMegxDgUlJiGghLTUFBiGgpKTENBiWkoKDENBSWmoaDENBSUmIaCEtNQUGIaCkpMQ0GJaSgoMQ0FJa" +
            "aJKej6DRB2Ii6bNGN9W3X6hOMsfT7t+JqIUFLj+G10be3t9J52vOE6JXO33iYXuLCNYl5zFnsM+nTt73vsRe3it829tbfXt2" +
            "G3dVAtc3OMlhYmMgHw77W3z+D20kW0ipAyjAEc4uLh/U7MHjSqoADg7yx8O+pCSVsc+XupRqMPQUdwveX6nklscwZ3x+doET" +
            "zQwzyoX8EJgJPYyya1OQEwiS0n0EMP+trCRaYApuAh3ypHAGaqOuurAr0KSkgRPNVJTENBiWkoKDENBSWmoaDENBSUmIaCEt" +
            "NQUGIaCkpMQ0GJaSgoMQ0FJaahoMQ0FJSYhoIS01BQYhoKSkxDQYlpKCgxDQUlpqGgxDQUlJiGghLTUFBiGgpKTENBiWkoKD" +
            "ENBSWmoaDENBSUmOYXQ5fpmu5rxpYAAAAASUVORK5CYII=",
        "i couldn't find what i'm looking for": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AUE0lEQVR4nO1dPZLkOHb+qFh/8gbNPcHmnKA5lhxFTI2viOHcoMaUJbYjVzknWFboAFttyhrWCbbqBGKZ8rIMOTIEGUBOZT" +
            "++hx8mQCCz8EUwuskCmQ8PH94PCAKNUgoVFaXiH3ILUFFhw59yC3BraJqmBdA6ih2VUs/JhbkBNNXFh6Npmj2APTQRO3P588" +
            "rHvQA4ApjMv89KqekiAW8IlaAeaJqmgyZih/VEDMULNGknAJNS6rjR7xaFSlAGTdPsANyZ48fM4pzwBOARwKNSas4sy2aoBD" +
            "1D0zQ9yiKlhCcAIzRZb9qyfniCmqSmB3AP4LvA218AzACezb8zALhiSBPD7sxximVbhIcPb9BWdbhVq/phCWqIOQD42fOWN3" +
            "wbEybJws8SsM4cnzxv/QrgcGsJ1ocjaCAxT4nKmGtYyBC2g7byf/G45Qnaok7ppNoOH4agJvE5wE3MV2i3mY2UEkznuoMOR1" +
            "yW9QE34Po/BEGbprmHtpq2GPMJ2kU+rnj+KaY8/Qvy/3NM5P+rBu3N0Nc97AndG3SdhtDnl4KbJqghzgi7a3yAbkQvkpAYce" +
            "94dghOCdeEgBjXM2R5BdBfpdtXSt3kAd1oynJMAFrPZ91BE312PDPmcYQONXoAOw8ZWyOj7ZmH3O0S3I65BUhAzJ0hn9RIzw" +
            "C6AFIeNySl7XiEtoIuufce9d/nbiff46ZcvInLHsHHmm/QScPBcv8OOq7r4T+8Q3/j5Jpnc5yjxftEkvaC3zhAJ3H0+X/AvH" +
            "Q4QNZFr1bE25sjdw+JaDl7rHTn0GQ5IMxaTuaeHhdYJGiLdwcdkkwBv6+gLbytXjvoDnu1Lj+7AJHIOVoa4d7RgIMnGWZDyL" +
            "sN6tOZ35ojEbW3dL4RHjFuJWh8cs42ywbtyl0W82ieny1mMxbWh6xH6BBGek4LHX5IcWmRJM0uwAUNt7MofJIUbhpcuu+8wf" +
            "rcdWRk7+EOA2YISaDRmdShiyRpdgESkHO03Dc4GneSGrekAzoEcBFVjC+N97gKkmYXYGUDSY3DxptwDz2JVqfkw4Oo4pAS5K" +
            "SyKJJmF2BFo0guqrc0ohRrHiVSX9MBexJ0tOhGuq8YkmYXILAhQskpWYmTO29z1ymiblxDSoNw314g6WPuOil1RQS1kK0Xyh" +
            "8sjXX1VtOipzuLNR0t9wTFsZvVJ7cAnkrfhxDNYmlnXNFrvgv01UJOIh859x1qADarS25leih7J1iEUSgvkXPiGuZWD6wYUg" +
            "Kf3R9zdursivRQ9MSRTSgrNciYux4Z9SeFOmyMKegwW9KUXYEO5XI9ehZ6v9QQY+565D4s7pvVjRAeZIlHi53NZCYG/5350/" +
            "eKTOY1M3f+ypR9UEr18aWTcbb0jTSj/oRnvK8kkvzTYYuOflNK3ZOyrZGPzoT6QW096Tl377b0+gkeSRHkBIq1Dgnk3GPdTC" +
            "TqFR6hPUabUNZe+P2eKctl9jM2dvXZiSgoknPtE1MuKIGKKF+L8Ol5IUeyuQDgX/eyiRD4sGlTV5+djJ6kO3KWRbBaCyJHlK" +
            "270FKusazRiQo+EVpYR9MWM1N2s6w+OyEZ5XG9dmDKcZZgoeRIMtmGbGzHJBxco7ssalRSwDMRAu/qpw9JUGjXuSAdU06KO6" +
            "P3bNjfzJxb+FMM2QXW9850StcUQPGd+sp6SeHRQn7wXsO7nrdEUM5K+Sos+utL2F+XKkPKaDPsDWEHh4WNSVKvREgwHNOHIq" +
            "ivEsBnolGVBffEixGJJ5rAPuM/Jkl9QyquXPeRCOq0nghIoC4kp+3TiOSNciZLCzkpiyIH5ESoZcpR3U8fgqCC9Vy8igOfGA" +
            "2RZZEs55hRP1znnREpIQTv6n313yWte05ihlRc6MFzZDmkmLMvQEdcxxkiPp+z1LQNOEMyJq13bsWbijtdh0DimAlKVyo5jX" +
            "xSeBPLinIjI5wV5ax5srdLJSi+d5FCaJwpceMrFDax2UdXFz6fI19LynBETqanEpROXdfMlOGsZxdRBs61F/HJAyPrnEpOXx" +
            "eOZRK5aLNoMmVW9o5RCPc2gzZKVIUwMqxynaY+vbFEtBGfzfX+QlkXnSmyLqjBWOhCsORJXn/mJqizouAzzIsamZGDG1aafa" +
            "003pfQ8Z08csTK+Bl8rByNHMLze1LGy7DcAkFpb31myoy0cRPIYXtjNMG+7lGH9euGjivlTRbumOfT+nDt4my7WyAoVfRA/s" +
            "4lL6sa1SHHHu5ZSgP8XF3oEZxgMAQaYujh7PncdMfWo+5tTDmyEhQergq8e0821Qv2BRAUzqa/Ocg5w6yEh/cdOg4MsRRWxL" +
            "tMZ4pN0NbVkcC7+f6WCDrQhmLKjLThN5BrB/ckkUkg8gxHbMnUKbhhUxPU/AaNyyePMmNsOXLuF9+R84kpc0fOH5NIcgal1F" +
            "Hpb3T+DL3zB4fPWH6v8wJt3a0yKv2N1Cu5vA8Usw0svwYjOf9sVqA+x0TOu9hC5CToZ3I+nZ+Yj+YoCSZsBKXUrJTqAPyEJa" +
            "EoXqATFd+P3yZyHkrQT47nxQDX0TrH734yH9xFQxaCGvJRTOS8owVc1ikFzG/uAXyxFLsLICew/Npz9r1R0F30r0KVXv/eZe" +
            "kn5tbQzmZFLgu6qIRa7gtEy0juNjmM2x+g3f5X8udfVMBubsbC0M23aN1t6Bj5Qu4PwWT7bdMpLw1XrMhF0Jacc+SjFU3VCN" +
            "4wbv8OwPcAfgXwk1JqDHwMV34KuL8n57TDxATVOQ3LuDJRCfqnmA8LQEfOZ6YM3cEtO0FPMBYrWJ6maUYsG/nJ1wKabXaoXl" +
            "KGPQu5mqZpicd4xrcegYYvFyFnknSO+fxEiLOKIegamJU9fmb+dB/wmIG5loygil9FpCXnMznnrOxq5CIorcRMzhe9MGGclR" +
            "yWZWe+BFjPeyz19hCYnK3BGzmnxmNO+eNFWlAslUCVdDVwrBs1eD5jj6X1fGOupQDtQM4RCBOKRMHmBPUcJ6NKuErrGWNRMz" +
            "M4PmE5JnwIGT24ANRCt+cnqWXIYUFbekGIda4axoqkIueTr/WNAGoc2o1+F0A5Lp5i0zgnNoyX4JKXryvISbP2NyxfAZeGaJ" +
            "l8qQRd/aalEDyCf1ff+9zsIGfIK9WtQMexo42FlkrQq4XJtimxvN/Vm4RoYp5xIudVxuNrkWug/iZhLN9ALp/2ZvchpxRzfk" +
            "hyAtWCxsY9luQafIhVycmjVIJahzYKRk/OX5VSB897H3G9bj1ZUlsqQbMObayBiR3pPM3B894ey7dE10JOYGn151gPzkHQmV" +
            "6I+eYhI+jQz1vATKeBe14h5KTWcdMRhM0J6vnm4RpdfEfOJ5+bmqa5w9Lyfino5YX1rR7zGUhUlJLFu15t0gYsEbQOu6ZpBo" +
            "/7OnL+uuFbIh+0jr8nnXmWi6Av+DYh2OPbNy8LN9I0zb4QlyeBJjifsW7q2eaftTjg+v6Jm3kWLQzIlSS5JiBwRGyZayUh1o" +
            "yrOdJzLoaQG9C2oxb0JaYMuQg6kfOWKUMrGvVTggSIZflKsqAtveDx7VjUJCqXi5/JufSty7nb7FIJEwn30DKvncgxQy98MM" +
            "cSKAI6cs59O9aS8ymmAKUQlIsxn/HtJxJRPyWIDRN3HcwB4I9ZTXd431wWMBvIQi+2VZK15NCRcy70SvvtWOylSgKWVrEu/w" +
            "J+Jd8ul7yBdevgt2XiEcyiZCUc4NdnuiNlOqZMG1OOnG+SqLvozk+UtqY08Sh6HmTTNDvz5ebv8LP43wH4VwBzgS8rOuba5C" +
            "jzpiKHKDkJSl1Bx5ShLrBYgp5N9uC+3HThOwC/m1eepYDq+kUth486cj7FFiInQSdy/on53NinTCk4YBmPnfAC4AF6+ZwnyE" +
            "NSfy2hfqaz0dVPHpky1vW1oiBznLNmDcpN9yv3rMcdI6eCZctEc8/M3DMXUJ+ekSvL2q25FfFIKuiz1HT2BmRk5IjWe9y3A7" +
            "8+vvPexPWhMi10jo3Wbs093W4i539hPkumceinkmI1YZrdF+Uxk0npmK7D0uWHrDYSFaY+NFQ5kDI7bLV2a+ae2mJpPQam3J" +
            "GUmXLKTWQbiGxHhC/pfc/oIcvQEzx2ksOG29BktaBKD0nQ4aaeKUpnpX8uaFimI+eTCp8swVmfzZMl473oKAS3vE5Pzl9Voo" +
            "k8uV08sFyO8BNDPloG2GbZlzUIbijTUV1rIG2Bgbk2np8YEtPsfUQilEDQRzhiMNOAD6RMSVY0Biixk04EphCs55NaTpwemN" +
            "vH6AIZZCeocR/Uxf3IJEsDczt37VpBrdK88e9zH/cN5ydCcvRVJZzgkp2gBoPrmsWK9kkk8ofr7YoTwoJqc7go62A8ER2Y56" +
            "wn91m171er65A7Cz7LDOl452LiAXTWTzP64Kw5stxcBt4GPmOgz9i4DjNTBzowv2N0PyeXLVfDMkrqGCWNPo2JjFtngx8q85" +
            "ZH6HSb1UfQp6/e++Ty5WpYQVmTqyebclyPX7V7cEK5nY0H+U1St5HcnFFYeCShE82byJiblB4KmwIU22aSm5u7qqDDFlYmyP" +
            "uCLuqbSOadb0dHhO0bb4KgRhlcLLpQBvj9NJ9p799Qbs4Fnss1mjKTQMxNO5mg50Vo4Ws0PhJBW0+3I7nHMaPsnKXxPY5IuJ" +
            "MzkZPr3JKOOSvbfViCGsVw1ojr3XvBGmWbkuewpDYLuxU5e0GGBekEIo+b6jM3GS2K5HouFx9JCu8zyn5aiMJFzBkJttK2yC" +
            "Xp6p4p2/lY2dRHY4QpDmbw+Hdy+Q3a0syk7AD9bQ/FLyp8q8JoMAPwHXTY0pnLszkmteH6SyE7jpg3Rs9YTiP8SW39JWpOK+" +
            "nR470TIcjxXzZLWsoB2XIuJoib8hNTNstYc3bleSjXOxGykHTIXY+M+hPJKXT0gSk7c2U3kT+3Aj0ULCVCXNwkZfbKkLe478" +
            "8T647zQDZySmTustUhtxI9FS0prmfK7iyW9BmZBvM31tcOcpImkVN62bAwBJvWJbcyA5QuWYNeKC+R9IiMr0U30NMe/AiIi5" +
            "yclxqz1ye3AIHKl0jHjiFaSH2TLh/2MdhRuEciJ5tAbV6n3AIENoAtxuyFe3qhAW7GmkIPYUlWU3TTNnKW0nmzC7CiMdaQdG" +
            "+5R0EPq3S567ZCFy3sLwSOUr0s5Mw6v3YhZ24BVjaMjaSStdg5XP7J7be56+dR/xbu9/6PEtEgJ52bzQfwrmtuAS5oJOuQku" +
            "U+lzs8NW6Xu46M7HsPYlrDFshxanHkVOqKCWqUbSOpOKRk7pMa6vyYoT/pYJ+zYR17Sz2pB5CspmvoKVsdb5agZ4qXrIrLmr" +
            "QeFum8ETchq5GrtxCKi6FF6we71ygmIbpJgp41gi2+/N3WCIFEPVnW0RC2iyB7Z541WogkEdP6+3AMPZVMTqUKns20BmbGzg" +
            "HLT2MB4H8A/LOyzMYxs48G6G+/uWfY8AZtjY5wry6yh7b8LdZtUvYAHWdPUgEzG+wAec3SX5X/Rrf5kLuHJLCkPkNKreMZIX" +
            "HfVscpxLBaPNhDnlPYc7HV36w9cwuQiKT/4tHgo4uo5lmtIcaUkZTO7BrviZ/0UkLBMvRU6nFTLh74w00/w89Fv0E32qA8lm" +
            "8xE3k7aCvdIf7WOE/Qsk/wXCXPyHQPftWPE96gX2JsO9k4Am6RoBOWxPlPAP/ouPUB+lsmV/xIf6/F+z5Ip7iyddx2HqdO0N" +
            "+Yzyt+9x46FLF1xgfolxdOsheJ3CY8smu/BxNznrnqifk751Z7FOgK8R4b+9RjwhXFmmKdcwsQsfFa8PEXXWOo82zgU8yWla" +
            "xnpByF+tFjxg195pJdgBUNNpiG+sZCCKQbLM8JIerJsh6gh6CSEdYQssP7Ig++8t0UMU/HVcWgwtebvwH4bwD/Rq6/KKX2Hs" +
            "/soC3Uz4HivMLsuYn3LzVn5RlLnsWuO+j4dW/OpXFLCV+hY+cp8L6rwNUQ1Ow+8Xfhz/+H5Vqn36uAhMdkw705Qkkiga6/Hy" +
            "vrf4V2+aNvh7hWXBNBn+FPnC9KqeGC39pDE7UL+M3UeIWOiceQjnftyLUddxCMa/clyv/iwi2hDQHuzW+30EQ9HZ8ueXYA3m" +
            "DGQ6G/SZ83+t2iULwFFVz7GzSBBsiE+QqdNEQd/zOE3Z8dO1zuul+gY9hTTPv8UQlJcQ0E5Vz7r0qpg4kb/wPAPwm3X+TqQ0" +
            "F2HTklP+c4TSYBANxqYhMTRRNUyNqflFIdKddBJw3Umn5VSt0lEq9iAxRLUItrXyweZsq3AP6LXH5VSrUJxKvYCKVsQ8NhZK" +
            "4NltiMm9vIPaPiilCkBfV17Wfl7wD8jVx+hba21zlJogJAgQRd4dp30BkwndHzQ01Crh8luviRuWZz7SOW5PytkvM2UJQFra" +
            "69gqIYglbXXsGhJBc/Mteqa//gKMKCVtdeISE7Qatrr7ChBBc/Mteqa68AkNmCVtde4UI2glbXXuGDnC5+ZK5V117xDbJY0O" +
            "raK3yxOUGra68IQQ4XPzLXqmuvYLGpBa2uvSIUmxFUWHWuuvYKK7Z08SOWZKuuvcKKTSxo0zT3AP6dXK6uvcKJ5AStrr3iEm" +
            "zh4kdU116xEkktaHXtFZciGUGra6+IgZQufkR17RUXIokFra69IhaiE7S69oqYSOHiR1TXXhEJUS1ode0VsRGboEdU114REd" +
            "FcvFmjs7r2iqiIGYNyW76MXEHj2n8kl1+hl/SuqPgDqV917ugF49pHpmz09eQrrh8xCcrtrCEtKltde4UXUidJgN4JbsT7fu" +
            "Z0R4yatVeIiE3QActPOlyoWXuFiBRvkkJ2hPtNKXUfVYCKm0KKJKmDdusuPFRyVrgQnaBKqaMh3g/QO6hRvAL4RSnVx/7tit" +
            "vDVp98tOb0+JE2Qq24HNnXB62osKGE9UErKkT8P0jJ4wH0M4uWAAAAAElFTkSuQmCC",
        "request a call back": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "ATpElEQVR4nO1dPXLkuBX+6HIu3UC9J1BvOXaJGzgebeJUnBNYe4LhxK7y9MQOlpO7yj2xg+WcYFsnMJU7aJ0ADvB6RIEPIE" +
            "jij934qlAzzW6BD8CH9x6AB6AQQiAjI1X8IbYAGRkm/DG2ACqKotgA2PQeHYUQhyjCZERHEdvEF0VxDaAEcE/pSvPTrwD2Qo" +
            "gmjGQZKSAKQYmUJ0K+m/jnzwDqTNTLQFCCFkVRAnjEdFJy+AqgEkIcHeSVkSiCELQoii2AHYA7x1k/ASgzSc8X3kfxRVHUAH" +
            "7HODmfAXwG8JMQojglAD8C+Ejfq7gF0JLLkHGG8KZBiTR7mIn5BKAB0NqM1InsH5ivvgghqulSZqQOLwQlk95CPyL/AmA3Z/" +
            "qoKIoKwK/MVz8JIdqp+WWkDecENRDohP8A+OsSv1HzjmchxGZunhlpwqkPSibYRE4A+AvkSH42aIrps/L4ht6fcUZwpkGLom" +
            "gAPDBfPQP4H4A/Kc9/EEJ0C953DaDDWzfiBcB2Sb4uQdNq1wC29Kj//z6OAPruzoGedamUJRqEEIsT5EBHMOkA2SgV893ewX" +
            "u5fBsXZZohSwmghvS9j5r6mJtaquNHyA4YvHyxkk9yNsrvWuY3pYP3H3zka/HeDRGGK1eItL8EwgYhJ/12y2lYB0QpfeSred" +
            "c1kYLrFDFTB7kQcnZkne2DGkbr2jlJjZ/6ixBiN0sIc77vhcP1eoqyOkA/dWbCE6TZB179yz42eBvBdTfjHSc8Q5K1Eeewwj" +
            "ZTk9zDUnMyGkj1z44Arh1oNuf5Ku941JRZfece0hctAWwWlqmE9LN3mOdKNAjg7vhMcypuy5BhlJwjDb1zQKDaR769/CsNCV" +
            "oE9AWp/qf6vu1aiTq1cq7B+1+TRuSQPpOax+IG1uS7cUiOHV6nhCqXGnqmPKcZkv25EnVOA6mFPkxtKPADm9ZBg3nJdw2pR1" +
            "abAdzeZcf1Wq4JFcD5nce5mk9jou4dNJSXfNeUIN2AxoKodWxZR8tiWWBuELKo4SFHrWp+nYPG8ZLvGhPVxRhRu5TNvm1BOd" +
            "Pua2BTp5rvWpMlUZ0NKJ3KblG4UtPrFg8QNJr5iIX+ka98157I9HMuUH88kVQd2RSKK1DpsNIqJv/GU76L1//PIVHd6OIFjk" +
            "jIZx8rCKc9nTeyr07gu3OtOZGVMU1P1bFlFGKcoFwDbzxUFtcRVrVOv9Y0ok2b6PIZBOeCO7wJDN6Jrzzl+xi74lNK1Na6+d" +
            "MWERckpjbsxmMlbZievIp1+nNIVE9cm58GT1Hqi93y0Tv5o48vwmN0N+WtRjVdYfn2kCPktJOar/rsoiGEOAoZhaZupQFibu" +
            "/W9KYKkQYX8LSersn37OInHbUB1/5RNKlu01ypfH4W4bb0chqzcZBvxTxbFId6rhAyjvY981V4TarpQarPFnSVAf6mnbhplW" +
            "Tm/FJLMIQYBpOBEYobvS8mx8SK2TAydKnme87JQNImxPsHWz6KongE8EnRssU0vbwcRVHsAPxNefxRCFEvzLfG8Picn4UQ+y" +
            "X5zpRli9etyJzZPMWeRj3E17C957MQYtEgdhRMj2kQSZ0rcoTcHhJkCRSSiDXm7wQ9UPtUS+thhuyVRqbK63sZQdTKq2MQlG" +
            "Thtoc0DvIdRGd5LMOG3tfNJKUp7X0TZKze4NkF5IQI2kMsKoVb4Vg0PYRAfrZB67hOp7le71oV/GT+7MD1scT5oG8fRD41jo" +
            "6P+U15/E0IUS7MVy3n4u3PzDs6ADcWP33B26NvTthi2jbnF0gttxMetxwXRXGAnHLq40kIsXX+MqV3lBj2jk1MDUpycdND1c" +
            "I8WyW/2oPcHSP3aWvyIyy1NiRRK9i7Ch08Tp9Bv3nSfR2OETQ2OUmuDYYDmw4LTFoggm57hNq7Ig3VR21B1mZJHVmUjYuCcm" +
            "rqV0FQkq122WNDEDRQvVRMWfrJW5Q8eB/baTij+sKUCXqt0RizKp/p/asOwSOy6DSqt0EMePfLWV2u5ipEwUclATPW02mCXB" +
            "18RJsIdwEh18+34KORriDX0N0PYqQv/aI8q52t1yu9oUSiGrQnY6vKiIlTRBhOlRxjl8txHd2D9w+9aFJ4mq8WYkUmvicjN4" +
            "dp7fdwZXRVmSkl6AcxvkjKjeo3S/NdjYk/Qcg16S/K41uKITCidzWOitqBaEmB6mkDefRjH1cA9h5C5rj6Xz6vbKGdkgvqxY" +
            "x1euj33TSxyxOgrjqm3M43D8JDmOQbDSr4iJnwYf4jEBO3cRRFcQ9ZeerqxwsWbilJHVRX9xgOZG4pYswlKstn9mB6gdoDqt" +
            "hawNBjO0bebe/7a+gDHLxNvaSYoPdJF2k45j0N847N7PyYF7RK5nXsyjVURslURttrEN1W2osiZ6++KqYu3E6s80Hhzez8mB" +
            "eoPaCNXbEjFaJ2KAHg7xptIYi0F0fOXn05j2uwaJPZcbxc5rWaeexKHakMrsfqUjO3os4lgR9gdo7fwVm2ak5e3DRTq3y+oh" +
            "sukoSQ++l/GfnZC+S2jkqcw80XC0DlVwdHN7Stw9U7WgyvT581GB0QVPCxn+WczAOixXCUesITpEkPvucoVQi5r0slUO34NW" +
            "onuJ2j6HQT9erkbjk141CgQrfgA3s/CiGSubszMXBatHSYP6cQ1NNqRqEjaLs044DYY0jOF8idAHV4cVaDBkOrU7nKnJTC16" +
            "X56wiqsv/Kce9yAtpCzE2+lxpXJYNAvqjazq4VkZr/ZDPPEpQaV+1dSWlRWktWHe8TOVcdOhcQnCJyGZLHmflySgamYBHfvW" +
            "spKgxNe53JaQ/NwLF0mP8Rw/HMJB6ZCNoqn288BbzORaV8fhaOd2VeCL4pn0vH+audYFL+UzQo4NCJXgIy76rvWUcQ5RzQKp" +
            "9dKyE1/0luhJagpJ7VUVgqZp4rYBtaiDOB6hLduMxcM1hdTlBCo3y+odC12FAL+JLnOmdjsLLmYeVQ9UPdEJSc6BRH82qMah" +
            "4YzYRGw20cv0ZtH2caFBj6og9RzirPWDO8EpQbGVe2LwiETWwBMoxQCWp93tQoQWleUfUhYm+TaJXPN1mrJ41OfWC7Mmm7q5" +
            "MLLIjpi3bMsxR84wwGSwawtgTlBkvRtCgVWNXqVXhJMiZA5Y+VH2pFUJoTbZTHd5EDSNTBW2x5VgnNpLmPoG7VD7VyyaYc3J" +
            "DaYKmxfJZhxoAoKcUzWBOUzKp6osdDrO0gGnluKAQvwx6l8lmNtI+KqUff1JbPQoE7We1DYkEtqUOtq2S0JzCRoAlq0SP8XZ" +
            "14KSiVz74I2imf3Q2SFNTMs2ZGPk4g5LmYasjYbTb146BBpTpp3np6nerrdjZ/NJmgGi0aewRdgTf1ZXhRVgV17vjF41YZla" +
            "BWMwVzj1+sLZ8FAXUa1tTnFSYjKuVzcluzZxHUoEWrpQLNBZl6NX71BvnKbRbUVqp5Pw+CEmr4PJt8HioMZXqI2XFWhOcUD7" +
            "eYTVDSooM1esRdAj2dhalil6eeBlDJ6NvS3CmfrWYLBlchTgFpywOG2wR+iBnhrrnK+wlyS/JFn83UB810HCGPR/RaL3Ov2F" +
            "xEUHpxheFd4ovv0lwKzX2SX4UQOeopMDT3rVopscWXKGjmIe8S2LvEHXv9zuayhQzn4Nb7O5s/dHXLR8U8izrFQxVQMV99yv" +
            "OjwaH6/2qopBZOCEpk+Kg8vkLkJUcalapyAfIaljxoCodS+dzZ/qGze5I0Z06+i23qSS51fvQKeRI/JGYHpLi+yKtinqVAhA" +
            "pDs3KLBCemzw2ae1Fb2793SlCaNlAvM03B1B/BT+LfFUXRBBfoslCqD6as9/u4CrFGmqb+AH4S/yFHPnlFqXxWZ3yMcE7Qnr" +
            "ZS0cS+jIF67nvmqw95OdQ9yLV7pzxup+Th5TLZVE098H3elrtT/dfYWv4MwdXnJL/f223HQohHDAcmdymYU5JNjcYCpJbP00" +
            "/uoBL0eeqGvMVLncbMZWP/znz1Ywo7BzXLofkYcQcgd+6/yuPPpBys4fW+eGpk7pItH/eVz0EJ/j71NmvSxaiYZ5MjprwSFA" +
            "DoWG515HaDNPzRIzJJfaFUPn+bE+HmnaCEZAM3DHOkmaTLoIbvNXMy8eqDvnkRH3IFpOOPbsHfWJd90hkgH3QHucy5n+p7fs" +
            "8nFEGB7wGyH5THz5B3aUYPJM4kTQ9BCQoARVG0GIb/Rw9wPiGTNC3EIOg1ZLiVSoDJUxC+cG4kJXN7Dzlw4c73b1PcMAcAzi" +
            "6xn5Ig/RL1wvvZl957lPGYupwjZSghOxpXBjUdIeMormPL/aYMESvvUVNJ29iV0pNxlSSF1JI7S2KqqUupbLErstFUUDK9GP" +
            "KChoOmMXex5WPkvTbIOyW1KSiL4D5oH+SPthguNz4JIZKZfzTICcg1/UeRxiyESU5ALpi0vc8bSDfAdLvcZ8hLeuOUL3YPge" +
            "zxnBltYsvGyNkycgpIjRVd6xvkawBsDH9XQVouk39aRSlT7EqlCtINmurYsjGyNoZGjGYSIQc4s4lFHZDLQzX7ZdByxW7wXg" +
            "VVmkqxquAEyHBKjxHkudfIMplMkGZ/P0LUJpTFiN7Ylg0/uaIDyFpBP8IP14CSUJwcizoKpG86Zva9d8boDc1UDGdCk5p+6s" +
            "m6NTTiwbfM0I/YG4fvqA0d8VTO0lsZYzeyplK4Sk+VpKbBk1eTr+nMzgdsMc1+9AY2NDpH0iRGyxqZa0PjtTCMome+rwrdic" +
            "nsm+ZYj3A8sI3esIbK2GhMS8okvTeYQ2c+GyIvFUOuAprMfufK7EdvVIuGWBtJx0z+Im1K+XdMvv+KUM5mxOzvl1qO6A1qUR" +
            "E6kraxZRuRm4s16Kd6aifD+DKm1wGLRiavZj96Q1pWQqUpfBNbthG5tyON19maZQsieB+wjMhnY/bvz5KgVAGrJCnJXls0Xq" +
            "WSijTmPcwjaB1pg8xTMvKORVG1mGD2ozfeBZF0A7vYzCP9rrP4bQXzwCyW2T8FfBtdnLMj6NpJSvLfW5JvjMT3vTw3I1o2lt" +
            "mvLDqPUaboDXahJD0FZpgaz0S0jSbfcoT8KZp9I0mjN9alklQh6phG7aiRWWIy+Y4NWFIz+wfd30UNWF4KzRU4gDzyuxIJBB" +
            "Hbgja2bSAb8hQjewDQiRknclDw8g7Ag+FnwYOt6bCOT8xXH4U8rv0tYmsRBz2zwkz/5hIS7OYpQ5v9UiPHZvDb2BXoqMCZpO" +
            "N1lJTZB7+QUQ9+F7viHBY4k3S8jmyWJ5tQ9YWhT9qpvwl1eJh3CHlyMne89y2ALh8CBgghjkKICsBP0F+m9QBZX48BRGqUzz" +
            "eDYzlj92oPvbKC3tdKLp40cl0Fi0rSvP+aeeeb952NBj1BSE36I/jjFH/PlyW8QsizWzfgj0MH5Hbk34qi2Pu4AENYzB6cHU" +
            "EBQMizk0oMSQrIyxJCmK9VQNiZ/XcADjHuFzhLggJvSMpV+qd8gddbCCFaIQ/L+AV8x76CvK6nC3kZ79kSFBgl6UNRFG0iZ+" +
            "Ung5Bm32bgetYEBb77OSX4Cr9DPuZ7gIBmf1DvQrkm8ewJCrypcI6kt5AkLYMKtQIEMPvq3ww6w0UQ9AQiKTdXegVptvLgiY" +
            "FHs3+vfG65l19cguy50U8FWWPCeDCy1R4k8Mf1lIPfxS5w5IrWBVF4PxVk7QnjwcgdR7je36sB1kf2d7ELGrmSr5mK6muCyZ" +
            "u8LinBbg/SYOsxpLug/o49DDh6IVNIMJ8KktwpyqmlqWZfU98bNu/YhUslwbz57KCrwJze1KGN2f8z85tWl+dFjeJNEPIalh" +
            "L8vN8t5JyfOurM6EHIOIgN5LHhHG4A/BPD6312ujxXveXDByy2SiRzJn3KoMWPHYaXtgkARe/zsxBio8sna1AF4nVS/z34ye" +
            "kHSG2aV58MEEIchLw9UK3HQvlpbcona1ADiIQN9Ldm8Bu9Mt6ArNJ7AP9QvjJqTyBrUCPEa7CJzqf6UBTFwUes5DmB3CHOZR" +
            "pducsEHQGZ/EcAP4M3+acBVF4m1YACSlQr9E1Y3A+aTfwEkKnaY+j4n/ANcj9+F0yoxEEzH/9WHr9ArtR1Y3+fNegEkDYtoY" +
            "/uuQPw3xiR5ymi58OrqG07cdagM0F+ZwO9Nn2G1KZtGInSguFK869CCOv55KxBZ0II0Y1oU68bzlKGgZxPkKtN9nllDbocFt" +
            "oUAD5Cruuf9QQ/BS7vMSTnM6TfOan8WYM6QE+b6ib3AeADwh2IEAW0pfs3DMn5AhkZNrlzZoI6hMVa9BXkjtLu3PbnF0WxA3" +
            "/S4AtkXOhhVr7ZxPuBYS26j2fIEW0TRCgPGHFvniDJOdutyQT1DJoH3EEOmnR4hmzkVfmoVLYGQ5MOOCAnkAkaDGTSd+Ab84" +
            "QXyAGG9TxhDJDW3EFuPebwhQJulr8rEzQcaCXqkZKJqIBclWoA7FPSqrQIYZL/vUuXJRM0AoioFWRDm0w/8KpV9zZr175AFq" +
            "CGXt4nyIWJWYMh7XszQePCouH7CEpWMuUVJZN8nyHdEueaPhM0EdAE9yP0fh2Hr5ArNq0rzUWkLCH3aI3J4kVrvpEnEzQtTN" +
            "BaHL6Bbgahf2GKBegdV1NC7szcWr4z2PRYJmjCIAJVkNpsbFAVAsGnwzJBVwKac7yH1HZTNetSPEGSsgn83kzQNYJWqU5kNa" +
            "1ULcETXqe5Ok/vGEUm6BmAXIGTD7mhf6e4BM+QfmsL6bu2qcy9ZoKeMXrXK+pwSIWIOmSCZiSNHG6XkTT+D+NES00HA83mAA" +
            "AAAElFTkSuQmCC",
        "schedule now": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AGlUlEQVR4nO3c4XHaSBiH8fe9yfe4A9OB6eCUCo4ODleQdHBcB04FwR2QCsJ1gDsgHdgVvPdBi0derbC1FvE/+PnNaMaAtG" +
            "x8zwmEZDwiDFD1x1tPADiGQCGNQCGNQCGNQCGNQCGNQCGNQCGNQCHtJIG6+4W7N+4+e+U4c3dvlObi7hevHKdx9/krx5id21" +
            "wGRcSki5nNzOzezCItTeU4N50xdpVjXGRzWVSOs+zOxcwuKuey64yzrJzLojPGfc1c0jjdudxUjtFkc5lN3tPkA5qtOpMOM9" +
            "tUjhPZ0lSM8SUbY1s5l/0Ec2myMfaVc9lm43yZYC5ROZdNNs5q6p5+xXvQ0+z6f+1zX040zinGPIff7yAOkiCNQCGNQCGNQC" +
            "GNQCGNQCGNQCHtw9gN0imtY6fHZtnti9eerkzm7j52G6W59H5nlXPJP3ucVYzzVnPZR8R+zBN4OiMwvEJ7Dntp7Sm2qzGDAw" +
            "PurD0jdvNssCNPW7KwTL0cPT1a3IOml/GtscfEr3Fn7fUN9/kDvYMk4sQbuDKzbfGSvcLLevcyt+6ytfa96NEreaz/tqD2Cq" +
            "L8+WuuIFKaS5OPUzmXrY14iVSaS3reZWG7w9K77O/JHjQdEH0uFH4dEU1ErCNiW3gceFZEbFNDjZldF1b5nF9Ynr/ErwobXU" +
            "fEeoL5AY9SU6VIV90beaCL7PZ34sSppLa+Z3c/afAx0PS3KR+zldenmBjQsc5uf+z+nVR3D9o7goqIzYkmBZjZYGOPLXIuHt" +
            "IIFNIIFNLOPdDeqbNKDxONc+oxz84pAt3Y01/+TeU4Xzs/31WeIMjnsq6cS/ff8NPaLz0Ya2ftOefSmGOsOz8/WMW/Kf0uu3" +
            "P5OrDqc7r/hgdrf9+TerxYJF3H96P7YESMvugxjTWz9lrMfYy8/i8bp0k/7qJwIcELxzhcv3ofETVhHcaZW/p2kDObi73m7O" +
            "AU/63dPb9i6dNhTicJFBjjWKDn/h4UvzkChTQChTQChTQChTQChTQChTQChTQChTQChTQChTQChTQChTQChbTR3w964O4LO/" +
            "49ocDBrvYvhKsCdfeVmf1Tsy3eJ3f/NyJWY7erfYlfVm6H92tZs1FtoJeV2+H9qmqm+j1o5s6m+wtKnIcLm+A7ZqcK9Atfy4" +
            "iu0t+41eBjJkgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUE" +
            "gjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUE" +
            "gjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUE" +
            "gjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEgjUEirDfQhuz1/7URwdvIm8mZepDbQXXa7qRwH56vJbufNvMhUgf7l7k3lWDgzqY" +
            "W/srtfHeh+4IlKbgr3bdx9WTMJnI/UwKbwUKmZocb2hx8+HH6IiL275yvOzWyb35nWvTWzvzt3fzSzb+6+skLseBdmZnZZuP" +
            "82IvYD2/SOX56sGxGPi7UxRmfZdR/P1r2wdrcdLCxHlp2ZXRzpKG9o2308fw+a75qv3H1mBRFxb+0b4bvS44C1bTSplZ7U1l" +
            "V299MGs5pn1v8/YD1Uf2dPujKz+8K2LO9zube2icE9Z2pnXdh21l3H04qP3H1j/SOwTxGxtWe4+8L4TPS920VE6SDpiXRw9C" +
            "O7+3tELJ6sVwi0tOFPM5sP7aqBMdz9cPxymT3U2xH2PgdNK9xmd1+a2TYNDFRLDW2tH+dt6VW6twftDLK39qOjrqNveoFjOn" +
            "HmB0YP1r737HVVPJOUVlwUHroysx1njTBWamZn/TjNzBZDO73BU51pd3tdeOjSzH64+3roIyjgwN1n7r629rgmf1k3M7s+dg" +
            "BefInPnmBpZt+OrHJn7ccFu5cc6eP8pb3l3MyWVt5jHlxHxProWM8F2nnCjfXfkwI1Hqx9Wd8+t+KLrmZKA82sf3QPjHVr7Q" +
            "HR9kVrH/ukf+DT/8bavelbn61g+b2WjbWfAI3q7UUv8SXpAGmRlj+rBsG5+8/aMDdHrmY6qjrQ3kBtsLNJBsPvbl8bZG6yQI" +
            "FT4K86IY1AIY1AIY1AIY1AIY1AIY1AIY1AIY1AIe1/0ehX1vjveIkAAAAASUVORK5CYII=",
        "speak to a counselor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AKqElEQVR4nO2d7XXiSBaG39rT/3EGzUZgbwRWRzBMBI0z8EawOIJlImgcQeMIRo5gIIKFDEwEd3/UxUOXqoT4kupK73OOzh" +
            "wJelyIh1u3PlTlRASE5Mo/ui4AIXV86boA1nHOFXWvi0jZTkn6iWMV3wwVsQDwAOAOwOOJ/4t3AB8AVgBKitsMCprAOfcAL+" +
            "QEp8vYlHcAS3hhVzf6G6ahoAc45+4ATAE8A/ja8p/fApgDWIjIR8t/O1soKD6j5TOA712XRXkFMGdUHbigKuYczavwHTSHBL" +
            "DZHyKySfz/xwAOjwI+hx01/HvvAJ6HLOogBdWqfI5mEfMNXsir5YkH+W0B4LcG/+QVXtThVf0iMqgDvir/ACA1xwo+F71roT" +
            "z7vHd1pEwf8JJ2fg/bPAYTQTVqLlFfnb/CN1LKVgoVoF1ZU9RH9ncAExlINB2EoPrFL5HO/d4BTCWRS7aN5q4LpH9MO/jyLl" +
            "sqUmf0fqjTOfcM4E/E5dwC+CYiRS5yAoCIbESkAPANvowhIwA/nXOzNsvVBb0W1Dm3APDfxMsvIjLuqjpvgoiUIjIG8JJ4y3" +
            "/0M/aWXlbxR1rpW/gczlTXjbb8l4gPIPS2ld87QVXOEsB95OU3+NzN5Bepn22BeNfUGkBh9bOl6GMVP0dczlcRMd36FZEPEZ" +
            "nAR8yQe/jP3it6JajmY7Fq/UlEpu2W5nboZ3mKvPS9bzlpbwTV1npKzkXLxbk5+plSkj63XJyb0YscVPs5/4y81Es5D3HOTQ" +
            "H8iLz0LeceiqaYF1QbDhtU+zlf+1St15FIbXYAxpZzbqAfVXxshOh9KHICnznpe3B5BH9vTGNaUK3ewuHALfws+KExQXXU6V" +
            "HvkVnMVvE1VXsvcq9zSOTipqt6yxF0hqqcL0OVE/h8gjQcFh3BcP+oyQiqs33+F1zeAniwGimuiXNug+qQ6D9zmhDTFKsRdB" +
            "a5ZnYI8wZMI9dmLZfhKpiLoIno+a7T04jinCtRbUCai6IWI+is4bWhM2t4LWtMRdBEy53RM0Ekippr0VuLoBNUW+6zDsphhV" +
            "lwPkI8P80WaxF0hV+n0m11xjlJEGnRr0XkoaPinIyZCKqNo3Cep9n+vRYJ79G93ksTmBEU8eFL82PNLRC7R2aGgi0JWgTna2" +
            "tdJl2g92gdXC7aL8l5WBI0fA6H0bM54b1qstxOFpgQVJ9oDCnbLodhyvDCsZWhc8GEoIhUSUOeFHIqiXtloiVvRdBxcB5Ozi" +
            "XHCe/ZuItCnIoVQcNfu6lFFzIhvGeMoFckvJlmhuoyIrxnFPSKhMObZReFME4ZnDdd5blTrAhKBkr2gia6QzYtF6MPVPJ2C1" +
            "1N2QsagyNIp2Npit0hJgUlw4GCkqyhoCRrLAhayZ0szWfMBav3LHtBE0t1j9suRw8YhxcszGfIXlAybKwIGi6KVXRRCOMUwX" +
            "lse5vssCLoJjgfd1AG64yD800HZTgZK4KanImTGSZnhFkVNLaLB6knvGcU9IqYHEfOhcS9oqDXQruadsFlM4/OZkB4r3ZWdt" +
            "ozIahSBudFB2WwShGclx2U4SwsCRo+OmtqhYyuSKzIYuaRbcuCAkBvNqy6IbF7REGvjc5nfAsuMw89TniP3izNDTUjqBL+8r" +
            "9a32bllui9CdeqNxM9AWPLLwKAc+4DXMC2EbEFbEXkrqPinIW1CApUlxN8ZJ9oFb0n4Rr15partBhBx6huomBqUdY24CYKHa" +
            "E3+DW4fM9c9G8SW0S+WpMTMBhBgc8ousKvuai5DQJuQWKjiR38JmebLsp0CeYiKPAZRcN8agRg0Xph8mOO6qohc4tyAkYjKP" +
            "AZKVaodqP8LiKmulKuhXNuAuBncNn0FpFmBQVqd/c1WZ1dQiLtAYzv/myyit+jN/6P4PIIwFIj7CDQz7pEVc5Xy3ICxiMoUF" +
            "vVv4rItP0StY9zbgHge3DZdNW+x3QEBT7H6Ceozhf9rl9cr0nIuQMwsS4n0ANBgc8JzbFZO72WNCEnADxbmZB8jF4ICgAisg" +
            "DwEnmpl5LWyPmi96IXmM9BQ2q+uDcAU+vVnubcC8T3Oupd3t07QYFaSdfwudmm1QJdCe1KWiL+VGvv5AR6VMUfol9UOF4P+C" +
            "92pR3aptAyh7s97+mlnEBPBQU+Jf135KURgJ/OORN9pc65O+fcEn6EKLbxwUtf5QR6LCgAiMgcwBOqXVCAz+E2Oc+C0rJtEM" +
            "83dwCeRGTWYpFap5c5aIju9blAekWSLYBZLq1frc7nqA4+7FnDN/h60ZVUR68j6B79IgtUh0X3fAXwwznXaUR1zk2dcxv46j" +
            "wl5x8AiiHICQwkgh6iE0wWSAsA+OpzAWBxaxE0uk/1qNtcawsfNctblic3BifoHufcDH706diOa1v4rp0SQHlpP6o2zAo9Jq" +
            "j/oQD+xzLve66ZYrCCAp+yPKOZqHu28N09K/gGzGb/wj66aVTc9xCM9XjQ45iQe3bweejc+uDCJQxa0D0Hok7RXKBbQTEPoK" +
            "AB2oKeIt61c0ve4HPeQT4NkIKCJtCoOsHf+eK1I+sWmtcCWDJaxqGgDdFx8IeD4w7VR3tTvMPv97TPXVdW5wO0DQW9EirwWE" +
            "83FPA6UFCSNYMYSSJ2oaAkaygoyZovbfyRg+G9B/3vHbjXkTXW8D0RJXxPxMXDvk24WSPpoB9xgvY7vUk7vMHPU7hZP+7VBd" +
            "Xulhm8mE3Ht4ltdvCizq7evSYiVzngq+05AOEx6GMO4O5aXl0lgur49QLNpq6tDg4O79ngDr+Oon098v4d/NzVi+cVXCxozS" +
            "O+e7bwv6olR1f6gaZxE/gZYHWyvsKvcnJ2IDpbUG0ElUi3xt/hc5LyrD9ATKBPKMyQnpewhn9E5SxJz+oH1Qm5JeJybuEXkS" +
            "0oZ/8RkVK3Afod/rsPuQdQqjMnc3IETayBvufikE7som7MEU/5ztpD4KQIelCtx+R8EhHzax+R8xGRD11E4iny8gg+kp60WM" +
            "ZJETSx984OA3oMljTjIA0Mg9lJOwM2jqD6FCTlJI04WIsgXNXlUV1qRKMIqr+GvyIvDXZHDdKMxM4jAPCvJoGtaQSN7fH4Qj" +
            "nJMdSR2CJujfYNPRpBdSmYH8Fl7jBMTiLRfnk6th5WE0E3qI4WmNuUlHRLYhPgrYiM6/5dbRWv+UMo5wvlJKeizoR7CHw9tp" +
            "jwsRx0GpzvV70g5BzmqLbqp3X/ICmohuRwovGCHfHkXNSdRXD5N3UtSl0EjYVeRk9yKTGHktV8naBFcL5m7kkuRR1aB5eL1P" +
            "tPEZR9nuRahC4VqTdGBdWcIBxDLS8oECGHlMH5KDUdLxVBx+EFzu0k1yLhUnSWU0rQIjiPTUQl5BJCp4rYm5qOxW8uKQkhET" +
            "ZN3sSlb0jWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNR" +
            "SUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUF" +
            "CSNRSUZA0FJVlDQUnWfGn4vkfnnNy0JIREYAQlWUNBSdZQUJI1TqSaWjrnxojsGU/IDdmIyCa8GBWUkFxgFU+y5v/bMb2HxR" +
            "XyiwAAAABJRU5ErkJggg==",
       "talk to a counselor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACoCAYAAAB0S6W0AAAACXBIWXMAAC4jAAAuIwF4pT92AA" +
            "AKqElEQVR4nO2d7XXiSBaG39rT/3EGzUZgbwRWRzBMBI0z8EawOIJlImgcQeMIRo5gIIKFDEwEd3/UxUOXqoT4kupK73OOzh" +
            "wJelyIh1u3PlTlRASE5Mo/ui4AIXV86boA1nHOFXWvi0jZTkn6iWMV3wwVsQDwAOAOwOOJ/4t3AB8AVgBKitsMCprAOfcAL+" +
            "QEp8vYlHcAS3hhVzf6G6ahoAc45+4ATAE8A/ja8p/fApgDWIjIR8t/O1soKD6j5TOA712XRXkFMGdUHbigKuYczavwHTSHBL" +
            "DZHyKySfz/xwAOjwI+hx01/HvvAJ6HLOogBdWqfI5mEfMNXsir5YkH+W0B4LcG/+QVXtThVf0iMqgDvir/ACA1xwo+F71roT" +
            "z7vHd1pEwf8JJ2fg/bPAYTQTVqLlFfnb/CN1LKVgoVoF1ZU9RH9ncAExlINB2EoPrFL5HO/d4BTCWRS7aN5q4LpH9MO/jyLl" +
            "sqUmf0fqjTOfcM4E/E5dwC+CYiRS5yAoCIbESkAPANvowhIwA/nXOzNsvVBb0W1Dm3APDfxMsvIjLuqjpvgoiUIjIG8JJ4y3" +
            "/0M/aWXlbxR1rpW/gczlTXjbb8l4gPIPS2ld87QVXOEsB95OU3+NzN5Bepn22BeNfUGkBh9bOl6GMVP0dczlcRMd36FZEPEZ" +
            "nAR8yQe/jP3it6JajmY7Fq/UlEpu2W5nboZ3mKvPS9bzlpbwTV1npKzkXLxbk5+plSkj63XJyb0YscVPs5/4y81Es5D3HOTQ" +
            "H8iLz0LeceiqaYF1QbDhtU+zlf+1St15FIbXYAxpZzbqAfVXxshOh9KHICnznpe3B5BH9vTGNaUK3ewuHALfws+KExQXXU6V" +
            "HvkVnMVvE1VXsvcq9zSOTipqt6yxF0hqqcL0OVE/h8gjQcFh3BcP+oyQiqs33+F1zeAniwGimuiXNug+qQ6D9zmhDTFKsRdB" +
            "a5ZnYI8wZMI9dmLZfhKpiLoIno+a7T04jinCtRbUCai6IWI+is4bWhM2t4LWtMRdBEy53RM0Ekippr0VuLoBNUW+6zDsphhV" +
            "lwPkI8P80WaxF0hV+n0m11xjlJEGnRr0XkoaPinIyZCKqNo3Cep9n+vRYJ79G93ksTmBEU8eFL82PNLRC7R2aGgi0JWgTna2" +
            "tdJl2g92gdXC7aL8l5WBI0fA6H0bM54b1qstxOFpgQVJ9oDCnbLodhyvDCsZWhc8GEoIhUSUOeFHIqiXtloiVvRdBxcB5Ozi" +
            "XHCe/ZuItCnIoVQcNfu6lFFzIhvGeMoFckvJlmhuoyIrxnFPSKhMObZReFME4ZnDdd5blTrAhKBkr2gia6QzYtF6MPVPJ2C1" +
            "1N2QsagyNIp2Npit0hJgUlw4GCkqyhoCRrLAhayZ0szWfMBav3LHtBE0t1j9suRw8YhxcszGfIXlAybKwIGi6KVXRRCOMUwX" +
            "lse5vssCLoJjgfd1AG64yD800HZTgZK4KanImTGSZnhFkVNLaLB6knvGcU9IqYHEfOhcS9oqDXQruadsFlM4/OZkB4r3ZWdt" +
            "ozIahSBudFB2WwShGclx2U4SwsCRo+OmtqhYyuSKzIYuaRbcuCAkBvNqy6IbF7REGvjc5nfAsuMw89TniP3izNDTUjqBL+8r" +
            "9a32bllui9CdeqNxM9AWPLLwKAc+4DXMC2EbEFbEXkrqPinIW1CApUlxN8ZJ9oFb0n4Rr15partBhBx6huomBqUdY24CYKHa" +
            "E3+DW4fM9c9G8SW0S+WpMTMBhBgc8ousKvuai5DQJuQWKjiR38JmebLsp0CeYiKPAZRcN8agRg0Xph8mOO6qohc4tyAkYjKP" +
            "AZKVaodqP8LiKmulKuhXNuAuBncNn0FpFmBQVqd/c1WZ1dQiLtAYzv/myyit+jN/6P4PIIwFIj7CDQz7pEVc5Xy3ICxiMoUF" +
            "vVv4rItP0StY9zbgHge3DZdNW+x3QEBT7H6Ceozhf9rl9cr0nIuQMwsS4n0ANBgc8JzbFZO72WNCEnADxbmZB8jF4ICgAisg" +
            "DwEnmpl5LWyPmi96IXmM9BQ2q+uDcAU+vVnubcC8T3Oupd3t07QYFaSdfwudmm1QJdCe1KWiL+VGvv5AR6VMUfol9UOF4P+C" +
            "92pR3aptAyh7s97+mlnEBPBQU+Jf135KURgJ/OORN9pc65O+fcEn6EKLbxwUtf5QR6LCgAiMgcwBOqXVCAz+E2Oc+C0rJtEM" +
            "83dwCeRGTWYpFap5c5aIju9blAekWSLYBZLq1frc7nqA4+7FnDN/h60ZVUR68j6B79IgtUh0X3fAXwwznXaUR1zk2dcxv46j" +
            "wl5x8AiiHICQwkgh6iE0wWSAsA+OpzAWBxaxE0uk/1qNtcawsfNctblic3BifoHufcDH706diOa1v4rp0SQHlpP6o2zAo9Jq" +
            "j/oQD+xzLve66ZYrCCAp+yPKOZqHu28N09K/gGzGb/wj66aVTc9xCM9XjQ45iQe3bweejc+uDCJQxa0D0Hok7RXKBbQTEPoK" +
            "AB2oKeIt61c0ve4HPeQT4NkIKCJtCoOsHf+eK1I+sWmtcCWDJaxqGgDdFx8IeD4w7VR3tTvMPv97TPXVdW5wO0DQW9EirwWE" +
            "83FPA6UFCSNYMYSSJ2oaAkaygoyZovbfyRg+G9B/3vHbjXkTXW8D0RJXxPxMXDvk24WSPpoB9xgvY7vUk7vMHPU7hZP+7VBd" +
            "Xulhm8mE3Ht4ltdvCizq7evSYiVzngq+05AOEx6GMO4O5aXl0lgur49QLNpq6tDg4O79ngDr+Oon098v4d/NzVi+cVXCxozS" +
            "O+e7bwv6olR1f6gaZxE/gZYHWyvsKvcnJ2IDpbUG0ElUi3xt/hc5LyrD9ATKBPKMyQnpewhn9E5SxJz+oH1Qm5JeJybuEXkS" +
            "0oZ/8RkVK3Afod/rsPuQdQqjMnc3IETayBvufikE7som7MEU/5ztpD4KQIelCtx+R8EhHzax+R8xGRD11E4iny8gg+kp60WM" +
            "ZJETSx984OA3oMljTjIA0Mg9lJOwM2jqD6FCTlJI04WIsgXNXlUV1qRKMIqr+GvyIvDXZHDdKMxM4jAPCvJoGtaQSN7fH4Qj" +
            "nJMdSR2CJujfYNPRpBdSmYH8Fl7jBMTiLRfnk6th5WE0E3qI4WmNuUlHRLYhPgrYiM6/5dbRWv+UMo5wvlJKeizoR7CHw9tp" +
            "jwsRx0GpzvV70g5BzmqLbqp3X/ICmohuRwovGCHfHkXNSdRXD5N3UtSl0EjYVeRk9yKTGHktV8naBFcL5m7kkuRR1aB5eL1P" +
            "tPEZR9nuRahC4VqTdGBdWcIBxDLS8oECGHlMH5KDUdLxVBx+EFzu0k1yLhUnSWU0rQIjiPTUQl5BJCp4rYm5qOxW8uKQkhET" +
            "ZN3sSlb0jWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNR" +
            "SUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUFCSNRSUZA0FJVlDQUnWUF" +
            "CSNRSUZA0FJVlDQUnWfGn4vkfnnNy0JIREYAQlWUNBSdZQUJI1TqSaWjrnxojsGU/IDdmIyCa8GBWUkFxgFU+y5v/bMb2HxR" +
            "XyiwAAAABJRU5ErkJggg=="
    };
    const normalise = (value) => String(value || "")
        .replace(/[’‘`]/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    /*
     * Broad selectors are intentional because Engati class names can vary.
     * The script still changes only elements whose visible text exactly
     * matches one of the 10 labels above.
     */
    const BUTTON_SELECTORS = [
        ".engt-smo-option",
        ".engt-smo-button",
        ".engt-quick-reply",
        ".engt-quick-reply-btn",
        ".engt-button",
        ".quick-reply",
        ".quick-reply-button",
        "[class*='smo'] button",
        "[class*='quick-repl']",
        "[class*='suggestion']",
        "button"
    ].join(",");
    function getButtonText(button) {
        const clone = button.cloneNode(true);
        clone.querySelectorAll(".upgrad-smo-doodle").forEach((node) => node.remove());
        return normalise(clone.textContent);
    }
    function decorateButton(button) {
        if (!(button instanceof HTMLElement))
            return;
        if (button.dataset.upgradDoodleApplied === "true")
            return;
        const label = getButtonText(button);
        const icon = SMO_ICON_MAP[label];
        if (!icon)
            return;
        button.dataset.upgradDoodleApplied = "true";
        button.classList.add("upgrad-smo-with-doodle");
        const img = document.createElement("img");
        img.className = "upgrad-smo-doodle";
        img.src = icon;
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
        img.draggable = false;
        /*
         * Remove any older black SVG/icon that may already exist,
         * while preserving the new PNG doodle.
         */
        button.querySelectorAll(".upgrad-smo-icon, svg, i, " +
            "img:not(.upgrad-smo-doodle), " +
            "[class*='material-icon'], [class*='fa-'], " +
            "[class*='smo-icon'], [class*='button-icon']").forEach(function (oldIcon) {
            oldIcon.remove();
        });
        button.insertBefore(img, button.firstChild);
    }
    function applyDoodles(root = document) {
        if (root instanceof HTMLElement && root.matches?.(BUTTON_SELECTORS)) {
            decorateButton(root);
        }
        root.querySelectorAll?.(BUTTON_SELECTORS).forEach(decorateButton);
    }
    function start() {
        applyDoodles(document);
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE)
                        applyDoodles(node);
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    }
    else {
        start();
    }
})();

/* =====================================================
   SMO LAYOUT BASED ON NUMBER OF BUTTONS
   Less than 5  = Vertical
   5 or more    = Horizontal
   ===================================================== */
(function () {
    const CONTAINER_SELECTORS = [
        '.engt-smo-container',
        '.engt-smo-options',
        '.engt-quick-replies',
        '.engt-button-container',
        '.upgrad-smo-container'
    ].join(',');
    const BUTTON_SELECTORS = [
        'button',
        '.engt-smo-button',
        '.engt-smo-option',
        '.engt-quick-reply',
        '.upgrad-smo-button'
    ].join(',');
    function updateSmoLayout() {
        document.querySelectorAll(CONTAINER_SELECTORS).forEach((container) => {
            const buttons = Array.from(container.querySelectorAll(BUTTON_SELECTORS)).filter((button) => {
                return button.offsetParent !== null;
            });
            container.classList.remove('upgrad-smo-vertical', 'upgrad-smo-horizontal');
            if (buttons.length > 0 && buttons.length < 5) {
                container.classList.add('upgrad-smo-vertical');
            }
            else if (buttons.length >= 5) {
                container.classList.add('upgrad-smo-horizontal');
            }
        });
    }
    updateSmoLayout();
    const observer = new MutationObserver(() => {
        clearTimeout(window.upgradSmoLayoutTimer);
        window.upgradSmoLayoutTimer = setTimeout(() => {
            updateSmoLayout();
        }, 100);
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

/* =====================================================
   SMO LAYOUT BY BUTTON TEXT AND BUTTON COUNT

   Every button contains "year" = horizontal row
   Otherwise:
   1–5 buttons = vertical
   6+ buttons  = two columns
   ===================================================== */

(function () {
  "use strict";

  const GRID_SELECTOR = ".upgrad-smo-grid";
  const BUTTON_SELECTOR = ".upgrad-smo-button";

  let updateTimer = null;

  function getButtonText(button) {
    const label = button.querySelector(".upgrad-smo-label");

    return String(
      label?.textContent ||
      button.getAttribute("aria-label") ||
      button.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function updateSmoLayouts(root = document) {
    const grids = [];

    if (root.matches?.(GRID_SELECTOR)) {
      grids.push(root);
    }

    root.querySelectorAll?.(GRID_SELECTOR).forEach(function (grid) {
      grids.push(grid);
    });

    grids.forEach(function (grid) {
      const buttons = Array.from(
        grid.querySelectorAll(
          ":scope > " + BUTTON_SELECTOR
        )
      ).filter(function (button) {
        return (
          !button.hidden &&
          window.getComputedStyle(button).display !== "none"
        );
      });

      if (!buttons.length) {
        return;
      }

      /*
       * This also detects:
       * 1 Year
       * 2 Years
       * 3-year program
       * Years of experience
       */
      const allButtonsContainYear = buttons.every(
        function (button) {
          return getButtonText(button).includes("year");
        }
      );

      grid.classList.remove(
        "upgrad-smo-layout-vertical",
        "upgrad-smo-layout-grid",
        "upgrad-smo-layout-years"
      );

      if (allButtonsContainYear) {
        grid.classList.add("upgrad-smo-layout-years");
        return;
      }

      if (buttons.length < 6) {
        grid.classList.add(
          "upgrad-smo-layout-vertical"
        );
      } else {
        grid.classList.add(
          "upgrad-smo-layout-grid"
        );
      }
    });
  }

  function scheduleUpdate() {
    window.clearTimeout(updateTimer);

    updateTimer = window.setTimeout(function () {
      updateSmoLayouts(document);
    }, 120);
  }

  function initialize() {
    scheduleUpdate();

    const observer = new MutationObserver(
      function (mutations) {
        const hasSmoChange = mutations.some(
          function (mutation) {
            const target = mutation.target;

            return (
              target instanceof Element &&
              Boolean(
                target.matches?.(GRID_SELECTOR) ||
                target.closest?.(GRID_SELECTOR) ||
                target.querySelector?.(GRID_SELECTOR)
              )
            );
          }
        );

        if (hasSmoChange) {
          scheduleUpdate();
        }
      }
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener("load", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();
/* =====================================================
   AUTO-EXPAND BOT MESSAGES — REMOVE READ MORE CLICK
   ===================================================== */
(function autoExpandReadMore() {
    "use strict";
    function expandReadMoreButtons(root = document) {
        const elements = root.querySelectorAll("button, a, span, div, [role='button']");
        elements.forEach(function (element) {
            const text = (element.textContent || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();
            /* Only target the actual Read More control */
            if (text === "read more" &&
                element.dataset.autoReadMoreClicked !== "true") {
                element.dataset.autoReadMoreClicked = "true";
                /* Automatically open the complete bot message */
                requestAnimationFrame(function () {
                    try {
                        element.click();
                    }
                    catch (error) {
                        element.dispatchEvent(new MouseEvent("click", {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        }));
                    }
                });
            }
        });
    }
    /* Check already available messages */
    expandReadMoreButtons();
    /* Check every new message added by Engati */
    const readMoreObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    expandReadMoreButtons(node);
                    const nodeText = (node.textContent || "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .toLowerCase();
                    if (nodeText === "read more") {
                        expandReadMoreButtons(node.parentElement || document);
                    }
                }
            });
        });
    });
    readMoreObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    /* Fallback for delayed Engati rendering */
    setInterval(function () {
        expandReadMoreButtons();
    }, 1000);
})();
/* =====================================================
   CAROUSEL DATE FORMAT
   2026-09-30 → Sep 30, 2026
   Applies only to customized carousel cards
   ===================================================== */

(function () {
  "use strict";

  const CAROUSEL_SELECTOR =
    ".upgrad-download-brochure-carousel-root";

  const ISO_DATE_PATTERN =
    /\b(\d{4})-(\d{2})-(\d{2})\b/g;

  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec"
  ];

  let updateScheduled = false;

  function formatDate(year, month, day) {
    const monthIndex = Number(month) - 1;
    const monthName = MONTHS[monthIndex];

    if (!monthName) {
      return `${year}-${month}-${day}`;
    }

    return `${monthName} ${Number(day)}, ${year}`;
  }

  function formatTextNode(textNode) {
    if (!textNode.nodeValue) return;

    textNode.nodeValue = textNode.nodeValue.replace(
      ISO_DATE_PATTERN,
      function (originalDate, year, month, day) {
        return formatDate(year, month, day);
      }
    );
  }

  function formatCarouselDates(root = document) {
    const carousels = [];

    if (root.matches?.(CAROUSEL_SELECTOR)) {
      carousels.push(root);
    }

    root
      .querySelectorAll?.(CAROUSEL_SELECTOR)
      .forEach(function (carousel) {
        carousels.push(carousel);
      });

    carousels.forEach(function (carousel) {
      const walker = document.createTreeWalker(
        carousel,
        NodeFilter.SHOW_TEXT
      );

      let textNode;

      while ((textNode = walker.nextNode())) {
        formatTextNode(textNode);
      }
    });
  }

  function scheduleDateFormatting() {
    if (updateScheduled) return;

    updateScheduled = true;

    window.requestAnimationFrame(function () {
      updateScheduled = false;
      formatCarouselDates();
    });
  }

  const observer = new MutationObserver(
    scheduleDateFormatting
  );

  function initialize() {
    formatCarouselDates();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();
/* =====================================================
   SMO BUTTONS — HORIZONTAL WHEN ALL CONTAIN "YEAR/YEARS"
   Paste at the absolute end of the JavaScript file
   ===================================================== */

(function () {
  "use strict";

  const GRID_SELECTOR = ".upgrad-smo-grid";
  const BUTTON_SELECTOR = ":scope > .upgrad-smo-button";
  const HORIZONTAL_CLASS = "upgrad-smo-all-years-horizontal";

  let updateTimer = null;

  function getButtonText(button) {
    const label = button.querySelector(".upgrad-smo-label");

    return String(
      label?.textContent ||
      button.getAttribute("aria-label") ||
      button.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function updateYearButtonLayouts() {
    document.querySelectorAll(GRID_SELECTOR).forEach(function (grid) {
      const buttons = Array.from(
        grid.querySelectorAll(BUTTON_SELECTOR)
      ).filter(function (button) {
        return (
          !button.hidden &&
          window.getComputedStyle(button).display !== "none"
        );
      });

      /*
       * True only when:
       * 1. At least two buttons are present.
       * 2. Every button contains "year" or "years".
       */
      const allButtonsContainYears =
        buttons.length >= 2 &&
        buttons.every(function (button) {
          return /\byears?\b/i.test(getButtonText(button));
        });

      grid.classList.toggle(
        HORIZONTAL_CLASS,
        allButtonsContainYears
      );
    });
  }

  function scheduleUpdate() {
    window.clearTimeout(updateTimer);

    updateTimer = window.setTimeout(function () {
      updateYearButtonLayouts();
    }, 100);
  }

  function initialize() {
    updateYearButtonLayouts();

    const observer = new MutationObserver(scheduleUpdate);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener("resize", scheduleUpdate);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();

/* =====================================================
   EXACTLY 2 SMO BUTTONS

   Special pair:
   - Request a call back
   - Schedule now
   Remains vertical.

   Every other 2-button SMO group becomes horizontal.
   ===================================================== */

(function () {
  "use strict";

  const GRID_SELECTOR = ".upgrad-smo-grid";
  const BUTTON_SELECTOR = ":scope > .upgrad-smo-button";

  const HORIZONTAL_CLASS =
    "upgrad-smo-two-horizontal";

  const SPECIAL_VERTICAL_CLASS =
    "upgrad-smo-callback-vertical";

  let processingScheduled = false;

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function getButtonText(button) {
    const label =
      button.querySelector(".upgrad-smo-label");

    return normalizeText(
      label?.textContent ||
      button.getAttribute("aria-label") ||
      button.textContent ||
      ""
    );
  }

  function isRequestCallbackButton(text) {
    return (
      text.includes("request") &&
      text.includes("call") &&
      (
        text.includes("back") ||
        text.includes("callback")
      )
    );
  }

  function isScheduleNowButton(text) {
    return (
      text.includes("schedule") &&
      text.includes("now")
    );
  }

  function updateTwoButtonLayout(grid) {
    const buttons = Array.from(
      grid.querySelectorAll(BUTTON_SELECTOR)
    );

    grid.classList.remove(
      HORIZONTAL_CLASS,
      SPECIAL_VERTICAL_CLASS
    );

    if (buttons.length !== 2) {
      return;
    }

    const labels = buttons.map(getButtonText);

    const containsCallbackButton =
      labels.some(isRequestCallbackButton);

    const containsScheduleButton =
      labels.some(isScheduleNowButton);

    const isSpecialCallbackPair =
      containsCallbackButton &&
      containsScheduleButton;

    if (isSpecialCallbackPair) {
      grid.classList.add(
        SPECIAL_VERTICAL_CLASS
      );
    } else {
      grid.classList.add(
        HORIZONTAL_CLASS
      );
    }
  }

  function updateAllLayouts() {
    processingScheduled = false;

    document
      .querySelectorAll(GRID_SELECTOR)
      .forEach(updateTwoButtonLayout);
  }

  function scheduleUpdate() {
    if (processingScheduled) {
      return;
    }

    processingScheduled = true;

    window.requestAnimationFrame(
      updateAllLayouts
    );
  }

  function initialize() {
    updateAllLayouts();

    const observer = new MutationObserver(
      scheduleUpdate
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();

/* =====================================================
   UPGRAD TARGETED CAROUSEL INTEGRATION
   Applies the custom carousel design only when that carousel
   contains either a "Download Brochure" button or a
   "Connect to AC" button.

   Every other Engati carousel remains completely default.
   Titles, descriptions, button labels, and button actions are
   preserved exactly as supplied by Engati.
   ===================================================== */

(function () {
  "use strict";

  const TRACK_SELECTOR = [
    ".engt-carousel-vertical_continuous_scroll_seamless",
    ".engt-carousel-vertical-continuous-scroll-seamless"
  ].join(",");

  const CARD_SELECTOR = ".engt-card.engt-card-thin";

  const ROOT_SELECTOR = [
    ".engt-msg-carousel",
    ".engt-carousel-wrapper",
    ".engt-carousel-container",
    ".engt-carousel-vertical",
    "[data-testid*='carousel']"
  ].join(",");

  const ACTION_SELECTOR = [
    ".engt-card-btns button",
    ".engt-card-btns .engt-button",
    ".engt-card-btns .engt-button-base",
    ".engt-card-btns a",
    ".engt-card-btns [role='button']"
  ].join(",");

  const TARGET_TEXTS = [
    "download brochure",
    "connect to ac"
  ];

  const CONNECT_AC_TEXT = "connect to ac";

  const ROOT_CLASS =
    "upgrad-download-brochure-carousel-root";

  const CONNECT_AC_ROOT_CLASS =
    "upgrad-connect-ac-carousel-root";

  const TRACK_CLASS =
    "upgrad-download-brochure-carousel-track";

  const CARD_CLASS =
    "upgrad-download-brochure-carousel-card";

  let processingScheduled = false;

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function getActionText(element) {
    if (!element) return "";

    return normalizeText(
      element.innerText ||
      element.textContent ||
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      ""
    );
  }

  function findCarouselRoot(track) {
    if (!track || !track.parentElement) return null;

    return (
      track.parentElement.closest(ROOT_SELECTOR) ||
      track.parentElement
    );
  }

  function getCards(track) {
    return Array.from(
      track.querySelectorAll(CARD_SELECTOR)
    );
  }

  function getCarouselButtonState(cards) {
    const state = {
      hasTargetButton: false,
      hasConnectToAcButton: false
    };

    cards.forEach(function (card) {
      Array.from(
        card.querySelectorAll(ACTION_SELECTOR)
      ).forEach(function (action) {
        const actionText = getActionText(action);

        if (
          TARGET_TEXTS.some(function (targetText) {
            return actionText.includes(targetText);
          })
        ) {
          state.hasTargetButton = true;
        }

        if (actionText.includes(CONNECT_AC_TEXT)) {
          state.hasConnectToAcButton = true;
        }
      });
    });

    return state;
  }

  function removeCustomClasses(root, track, cards) {
    if (root) {
      root.classList.remove(ROOT_CLASS);
      root.classList.remove(CONNECT_AC_ROOT_CLASS);
      root.classList.remove("upgrad-carousel-root");
    }

    if (track) {
      track.classList.remove(TRACK_CLASS);
      track.classList.remove("upgrad-carousel-track");
    }

    cards.forEach(function (card) {
      card.classList.remove(CARD_CLASS);
      card.classList.remove("upgrad-carousel-card");
    });
  }

  function getOrCreateProgress(root) {
    const nativeShell = root.querySelector(
      ".engt-carousel-inline-dot"
    );

    const nativeTrack = root.querySelector(
      ".engt-carousel-dots"
    );

    if (nativeTrack) {
      if (nativeShell) {
        nativeShell.classList.add(
          "upgrad-carousel-progress-shell"
        );
      }

      nativeTrack.classList.add(
        "upgrad-carousel-progress-track"
      );

      nativeTrack.setAttribute("aria-hidden", "true");
      return nativeTrack;
    }

    let generatedProgress = root.querySelector(
      ".upgrad-carousel-generated-progress"
    );

    if (!generatedProgress) {
      generatedProgress = document.createElement("div");
      generatedProgress.className =
        "upgrad-carousel-progress-shell " +
        "upgrad-carousel-generated-progress";

      generatedProgress.setAttribute(
        "aria-hidden",
        "true"
      );

      const progressTrack = document.createElement("div");
      progressTrack.className =
        "upgrad-carousel-progress-track";

      generatedProgress.appendChild(progressTrack);
      root.appendChild(generatedProgress);
    }

    return generatedProgress.querySelector(
      ".upgrad-carousel-progress-track"
    );
  }

  function updateCarouselProgress(root, track) {
    if (!root || !track || !track.isConnected) return;

    const visibleWidth = Math.max(track.clientWidth, 1);
    const totalWidth = Math.max(
      track.scrollWidth,
      visibleWidth
    );

    const maxScroll = Math.max(
      totalWidth - visibleWidth,
      0
    );

    const visiblePercent = Math.min(
      100,
      Math.max(18, (visibleWidth / totalWidth) * 100)
    );

    const rawProgress = maxScroll > 0
      ? Math.min(
          1,
          Math.max(0, track.scrollLeft / maxScroll)
        )
      : 0;

    const availablePercent = Math.max(
      0,
      100 - visiblePercent
    );

    const thumbLeft = rawProgress * availablePercent;

    root.style.setProperty(
      "--upgrad-carousel-thumb-width",
      visiblePercent.toFixed(3) + "%"
    );

    root.style.setProperty(
      "--upgrad-carousel-thumb-left",
      thumbLeft.toFixed(3) + "%"
    );
  }

  function bindTrack(root, track) {
    if (
      track.dataset.upgradDownloadBrochureCarouselBound ===
      "true"
    ) {
      updateCarouselProgress(root, track);
      return;
    }

    track.dataset.upgradDownloadBrochureCarouselBound =
      "true";

    track.addEventListener(
      "scroll",
      function () {
        window.requestAnimationFrame(function () {
          updateCarouselProgress(root, track);
        });
      },
      { passive: true }
    );

    if (typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(function () {
        updateCarouselProgress(root, track);
      });

      resizeObserver.observe(track);
      track.__upgradDownloadBrochureResizeObserver =
        resizeObserver;
    }
  }

  function formatCarousel(track) {
    if (!(track instanceof HTMLElement)) return;

    const cards = getCards(track);
    if (!cards.length) return;

    const root = findCarouselRoot(track);
    if (!root) return;

    const buttonState = getCarouselButtonState(cards);

    if (!buttonState.hasTargetButton) {
      removeCustomClasses(root, track, cards);
      return;
    }

    root.classList.remove("upgrad-carousel-root");
    track.classList.remove("upgrad-carousel-track");

    root.classList.add(ROOT_CLASS);
    root.classList.toggle(
      CONNECT_AC_ROOT_CLASS,
      buttonState.hasConnectToAcButton
    );
    track.classList.add(TRACK_CLASS);

    cards.forEach(function (card) {
      card.classList.remove("upgrad-carousel-card");
      card.classList.add(CARD_CLASS);

      card.querySelectorAll("img").forEach(function (image) {
        image.setAttribute("draggable", "false");
      });
    });

    getOrCreateProgress(root);
    bindTrack(root, track);
    updateCarouselProgress(root, track);
  }

  function processAllCarousels() {
    processingScheduled = false;

    document
      .querySelectorAll(TRACK_SELECTOR)
      .forEach(formatCarousel);
  }

  function scheduleCarouselProcessing() {
    if (processingScheduled) return;

    processingScheduled = true;
    window.requestAnimationFrame(processAllCarousels);
  }

  const observer = new MutationObserver(function (mutations) {
    const hasCarouselChanges = mutations.some(
      function (mutation) {
        return Array.from(mutation.addedNodes).some(
          function (node) {
            if (node.nodeType !== Node.ELEMENT_NODE) {
              return false;
            }

            return Boolean(
              node.matches?.(
                TRACK_SELECTOR +
                ", " +
                CARD_SELECTOR +
                ", " +
                ACTION_SELECTOR
              ) ||
              node.querySelector?.(
                TRACK_SELECTOR +
                ", " +
                CARD_SELECTOR +
                ", " +
                ACTION_SELECTOR
              ) ||
              node.closest?.(TRACK_SELECTOR)
            );
          }
        );
      }
    );

    if (hasCarouselChanges) {
      scheduleCarouselProcessing();
    }
  });

  function initializeCarouselIntegration() {
    processAllCarousels();

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener(
      "resize",
      scheduleCarouselProcessing,
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeCarouselIntegration,
      { once: true }
    );
  } else {
    initializeCarouselIntegration();
  }
})();

/* ~ UPGRAD TARGETED CAROUSEL INTEGRATION */
