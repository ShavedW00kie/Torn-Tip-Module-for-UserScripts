// ==UserScript==
// @name         Donation UI Module
// @namespace    https://github.com/ShavedW00kie/
// @version      1.2
// @description  A reusable module to inject Buy-Me-A-Coffee and Torn-Tip links.
// @author       ShavedW00kie (Torn: ThaWookie [2954173] )
// @match        https://www.torn.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    "use strict";

    /**
     * SupportModule
     * A reusable class to inject a fixed support widget into Torn.
     * To integrate into other scripts, copy this class and the instantiation logic below.
     */
    class SupportModule {
        constructor(config = {}) {
            this.bmcId = config.bmcId || "bittick1c";
            this.tornUserId = config.tornUserId || "2954173";
            this.xanaxItemId = 206; // Torn's internal Item ID for Xanax
            
            this.init();
        }

        init() {
            // Guard clause: Ensure we don't inject multiple times if called repeatedly by React observers
            if (document.getElementById('thawookie-support-module')) return;

            this.injectStyles();
            this.injectUI();
        }

        injectStyles() {
            const styles = `
                #thawookie-support-module {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 999999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    font-family: Arial, sans-serif;
                }
                .tw-support-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 15px;
                    background-color: #333;
                    color: #fff !important;
                    text-decoration: none !important;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: bold;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    transition: transform 0.2s ease, background-color 0.2s ease;
                    border: 1px solid #555;
                    cursor: pointer;
                }
                .tw-support-btn:active {
                    transform: scale(0.95);
                }
                .tw-bmc { background-color: #FFDD00; color: #000 !important; border-color: #FFDD00; }
                .tw-torn-tip { background-color: #8ab63d; border-color: #6a8c2f; }
            `;

            // Standard fallback if GM_addStyle is missing in the environment (e.g., restricted TornPDA execution)
            if (typeof GM_addStyle !== "undefined") {
                GM_addStyle(styles);
            } else {
                const styleNode = document.createElement('style');
                styleNode.innerHTML = styles;
                document.head.appendChild(styleNode);
            }
        }

        injectUI() {
            const container = document.createElement('div');
            container.id = 'thawookie-support-module';

            // Buy Me A Coffee Link
            const bmcLink = document.createElement('a');
            bmcLink.href = `https://www.buymeacoffee.com/${this.bmcId}`;
            bmcLink.target = "_blank";
            bmcLink.rel = "noopener noreferrer";
            bmcLink.className = "tw-support-btn tw-bmc";
            bmcLink.innerHTML = `☕ Buy Me a Coffee`;

            // NEW — replace with this:
            const tipLink = document.createElement('a');
            tipLink.href = `https://www.torn.com/item.php`;
            tipLink.target = "_blank";
            tipLink.rel = "noopener noreferrer";
            tipLink.className = "tw-support-btn tw-torn-tip";
            tipLink.title = `Opens Items — search "Xanax", tap Send, enter ThaWookie [${this.tornUserId}]`;
            tipLink.innerHTML = `💊 Send a Xanax Tip`;

            container.appendChild(bmcLink);
            container.appendChild(tipLink);

            // Append directly to body to avoid React rendering wipes
            document.body.appendChild(container);
        }
    }

    // Instantiate the module once the DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => new SupportModule());
    } else {
        new SupportModule();
    }

})();
