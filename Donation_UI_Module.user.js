// ==UserScript==
// @name         Donation UI Module
// @namespace    https://github.com/ShavedW00kie/
// @version      1.4
// @description  A reusable, React-resistant donation/support UI module for Torn.com with an animated Buy Me a Coffee button.
// @author       ShavedW00kie (Torn: ThaWookie [2954173] )
// @match        https://www.torn.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

/*
 * Donation UI Module
 * Version 1.4
 *
 * Reusable support/donation UI for Torn.com userscripts.
 *
 * Features:
 *   - Animated Buy Me a Coffee button
 *   - Animated coffee cup with squash-and-stretch movement
 *   - Animated steam
 *   - Animated coffee fill
 *   - Hover-to-fill coffee effect
 *   - Periodic diagonal button gleam
 *   - Animated liquid-style label transition
 *   - Torn Xanax-tip button
 *   - MutationObserver persistence against Torn/React DOM changes
 *   - TornPDA/mobile-compatible DOM implementation
 *   - Reduced-motion accessibility support
 *
 * License: BSD-3-Clause
 *
 * Copyright (c) 2026 ShavedW00kie
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function () {
    "use strict";

    /* ============================================================
     * CONFIGURATION
     * ============================================================ */

    const DEFAULT_CONFIG = Object.freeze({
        bmcId: "bittick1c",
        tornUserId: "2954173",

        containerId: "thawookie-support-module",
        styleId: "thawookie-support-module-style"
    });

    /*
     * Unique counter used for SVG clipPath IDs.
     *
     * SVG IDs are document-global. If multiple instances of this
     * module are ever created, sharing a clipPath ID can cause one
     * SVG to reference another SVG's clipping path.
     */
    let coffeeInstanceCount = 0;

    /* ============================================================
     * SUPPORT MODULE
     * ============================================================ */

    class SupportModule {
        constructor(config = {}) {
            this.config = {
                ...DEFAULT_CONFIG,
                ...config
            };

            this.observer = null;
            this.observerAttached = false;
            this.isInjecting = false;
            this.destroyed = false;

            this.init();
        }

        /* ========================================================
         * INITIALIZATION
         * ======================================================== */

        init() {
            if (this.destroyed) {
                return;
            }

            if (!this.getBody()) {
                if (document.readyState === "loading") {
                    document.addEventListener(
                        "DOMContentLoaded",
                        () => this.init(),
                        { once: true }
                    );
                }

                return;
            }

            this.injectStyles();
            this.injectUI();
            this.attachObserver();
        }

        /* ========================================================
         * DOM HELPERS
         * ======================================================== */

        getBody() {
            return document.body || null;
        }

        getContainer() {
            return document.getElementById(
                this.config.containerId
            );
        }

        isContainerConnected() {
            const container = this.getContainer();

            return Boolean(
                container &&
                container.isConnected
            );
        }

        /* ========================================================
         * STYLE INJECTION
         * ======================================================== */

        injectStyles() {
            if (this.destroyed) {
                return;
            }

            if (document.getElementById(this.config.styleId)) {
                return;
            }

            const styles = `
                /* =================================================
                 * DONATION CONTAINER
                 * ================================================= */

                #${this.config.containerId} {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 2147483640;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    font-family: Arial, sans-serif;
                    box-sizing: border-box;
                    touch-action: manipulation;
                }

                /* =================================================
                 * GENERIC SUPPORT BUTTON
                 * ================================================= */

                #${this.config.containerId} .tw-support-btn {
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 40px;
                    padding: 10px 15px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: bold;
                    line-height: 1.2;
                    text-align: center;
                    text-decoration: none !important;
                    cursor: pointer;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }

                #${this.config.containerId} .tw-support-btn:focus-visible {
                    outline: 2px solid #ffffff;
                    outline-offset: 2px;
                }

                /* =================================================
                 * BUY ME A COFFEE BUTTON
                 *
                 * Visual design ported from the supplied animated
                 * coffee-button implementation:
                 *
                 *   #FFDD00 yellow
                 *   black foreground
                 *   6px radius
                 *   6px 12px compact padding
                 *   11px / 600 typography
                 *   animated glare
                 *   animated cup
                 * ================================================= */

                #${this.config.containerId} .tw-bmc {
                    position: relative;
                    overflow: hidden;
                    isolation: isolate;

                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;

                    width: 100%;
                    min-width: 170px;
                    min-height: 40px;

                    padding: 6px 12px;

                    background: #FFDD00;
                    color: #000000 !important;

                    border: 1px solid #FFDD00;
                    border-radius: 6px;

                    font-size: 11px;
                    font-weight: 600;
                    line-height: 1.2;

                    text-decoration: none !important;

                    box-sizing: border-box;

                    transition:
                        opacity 0.15s ease,
                        transform 0.15s ease;
                }

                /*
                 * Keep all actual button contents above the
                 * animated specular highlight.
                 */
                #${this.config.containerId} .tw-bmc > * {
                    position: relative;
                    z-index: 1;
                }

                /*
                 * Subtle interaction feedback.
                 *
                 * Hover is deliberately opacity-based rather than
                 * relying on desktop-only behavior for functionality.
                 * The button remains fully usable through touch.
                 */
                #${this.config.containerId} .tw-bmc:hover {
                    opacity: 0.9;
                }

                #${this.config.containerId} .tw-bmc:active {
                    transform: scale(0.97);
                }

                /* =================================================
                 * COFFEE CUP — SQUASH & STRETCH
                 * ================================================= */

                @keyframes tw-coffee-cup-hop {
                    0% {
                        transform:
                            translateY(0)
                            scale(1, 1);
                    }

                    18% {
                        transform:
                            translateY(0.5px)
                            scale(1.08, 0.9);
                    }

                    32% {
                        transform:
                            translateY(-2px)
                            scale(0.94, 1.08);
                    }

                    50% {
                        transform:
                            translateY(-3px)
                            scale(1, 1);
                    }

                    68% {
                        transform:
                            translateY(0)
                            scale(1.1, 0.88);
                    }

                    84% {
                        transform:
                            translateY(0)
                            scale(0.97, 1.03);
                    }

                    100% {
                        transform:
                            translateY(0)
                            scale(1, 1);
                    }
                }

                #${this.config.containerId} .tw-coffee-cup {
                    position: relative;
                    display: inline-flex;
                    flex-shrink: 0;

                    transform-origin: 50% 100%;

                    animation:
                        tw-coffee-cup-hop
                        2.4s
                        cubic-bezier(0.4, 0, 0.5, 1)
                        infinite;
                }

                /*
                 * Cup outline remains above the steam.
                 */
                #${this.config.containerId} .tw-coffee-cup > svg {
                    position: relative;
                    z-index: 1;
                    display: block;
                }

                /* =================================================
                 * STEAM
                 * ================================================= */

                #${this.config.containerId} .tw-coffee-cup::before,
                #${this.config.containerId} .tw-coffee-cup::after {
                    content: "";

                    position: absolute;

                    bottom: 74%;

                    width: 2px;
                    height: 4px;

                    border-radius: 999px;

                    background:
                        linear-gradient(
                            to top,
                            rgba(90, 58, 36, 0.5),
                            rgba(90, 58, 36, 0)
                        );

                    opacity: 0;

                    pointer-events: none;

                    will-change:
                        transform,
                        opacity;
                }

                #${this.config.containerId} .tw-coffee-cup::before {
                    left: 27%;

                    animation:
                        tw-coffee-steam
                        2.8s
                        ease-out
                        infinite;
                }

                #${this.config.containerId} .tw-coffee-cup::after {
                    left: 45%;

                    animation:
                        tw-coffee-steam
                        2.8s
                        ease-out
                        infinite;

                    animation-delay: -1.4s;
                }

                @keyframes tw-coffee-steam {
                    0% {
                        opacity: 0;

                        transform:
                            translateY(2px)
                            scale(0.6, 0.5)
                            skewX(0deg);
                    }

                    30% {
                        opacity: 0.7;

                        transform:
                            translateY(0)
                            scale(1, 0.9)
                            skewX(4deg);
                    }

                    65% {
                        opacity: 0.4;

                        transform:
                            translateY(-3px)
                            scale(0.85, 1.2)
                            skewX(-5deg);
                    }

                    100% {
                        opacity: 0;

                        transform:
                            translateY(-5px)
                            scale(0.5, 1.5)
                            skewX(6deg);
                    }
                }

                /* =================================================
                 * COFFEE FILL
                 * ================================================= */

                #${this.config.containerId} .tw-coffee-fill {
                    transform: scaleY(0.15);
                    transform-origin: 50% 100%;

                    animation:
                        tw-coffee-refill
                        7s
                        cubic-bezier(0.45, 0, 0.55, 1)
                        infinite;
                }

                @keyframes tw-coffee-refill {
                    0% {
                        transform: scaleY(0.15);
                    }

                    30% {
                        transform: scaleY(0.95);
                    }

                    55% {
                        transform: scaleY(0.75);
                    }

                    80% {
                        transform: scaleY(0.3);
                    }

                    100% {
                        transform: scaleY(0.15);
                    }
                }

                /*
                 * Hover overrides the normal coffee cycle and fills
                 * the cup completely.
                 */
                #${this.config.containerId}
                .tw-bmc:hover
                .tw-coffee-fill {
                    animation:
                        tw-coffee-fill-to-full
                        0.45s
                        cubic-bezier(0.4, 0, 0.2, 1)
                        forwards;
                }

                @keyframes tw-coffee-fill-to-full {
                    to {
                        transform: scaleY(1);
                    }
                }

                /* =================================================
                 * SPECULAR GLEAM
                 * ================================================= */

                /*
                 * A soft diagonal highlight sweeps across the
                 * yellow button every five seconds.
                 */
                #${this.config.containerId} .tw-bmc::after {
                    content: "";

                    position: absolute;

                    top: 0;
                    bottom: 0;
                    left: -60%;

                    width: 45%;

                    pointer-events: none;

                    background:
                        linear-gradient(
                            100deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.15) 35%,
                            rgba(255, 255, 255, 0.75) 50%,
                            rgba(255, 255, 255, 0.15) 65%,
                            transparent 100%
                        );

                    transform: skewX(-18deg);

                    will-change: transform;

                    animation:
                        tw-coffee-glare
                        5s
                        cubic-bezier(0.5, 0, 0.5, 1)
                        infinite;
                }

                @keyframes tw-coffee-glare {
                    0% {
                        transform:
                            translateX(0)
                            skewX(-18deg);
                    }

                    22%,
                    100% {
                        transform:
                            translateX(400%)
                            skewX(-18deg);
                    }
                }

                /* =================================================
                 * LIQUID LABEL TRANSITION
                 * ================================================= */

                #${this.config.containerId} .tw-coffee-label {
                    display: grid;
                    align-items: center;
                    justify-items: center;

                    min-width: 0;
                }

                #${this.config.containerId} .tw-coffee-label > span {
                    grid-area: 1 / 1;

                    white-space: nowrap;

                    transform-origin: 50% 50%;

                    will-change:
                        opacity,
                        transform,
                        filter;

                    animation:
                        tw-coffee-label-drip
                        7s
                        cubic-bezier(0.65, 0, 0.35, 1)
                        infinite;
                }

                /*
                 * The second label is exactly 50% out of phase,
                 * creating the alternating liquid transition.
                 */
                #${this.config.containerId}
                .tw-coffee-label
                > span:nth-child(2) {
                    animation-delay: -3.5s;
                }

                @keyframes tw-coffee-label-drip {
                    0%,
                    34% {
                        opacity: 1;

                        transform:
                            translateY(0)
                            scale(1, 1);

                        filter: blur(0);
                    }

                    38% {
                        opacity: 0.5;

                        transform:
                            translateY(2px)
                            scale(0.94, 1.08);

                        filter: blur(1.2px);
                    }

                    42% {
                        opacity: 0;

                        transform:
                            translateY(9px)
                            scale(1.06, 0.5);

                        filter: blur(4px);
                    }

                    42.01%,
                    92% {
                        opacity: 0;

                        transform:
                            translateY(-9px)
                            scale(1.06, 0.5);

                        filter: blur(4px);
                    }

                    96% {
                        opacity: 1;

                        transform:
                            translateY(1px)
                            scale(1.05, 0.9);

                        filter: blur(0);
                    }

                    98% {
                        opacity: 1;

                        transform:
                            translateY(0)
                            scale(0.99, 1.03);

                        filter: blur(0);
                    }

                    100% {
                        opacity: 1;

                        transform:
                            translateY(0)
                            scale(1, 1);

                        filter: blur(0);
                    }
                }

                /* =================================================
                 * TORN TIP BUTTON
                 * ================================================= */

                #${this.config.containerId} .tw-torn-tip {
                    background-color: #8ab63d;
                    color: #ffffff !important;

                    border: 1px solid #6a8c2f;

                    box-shadow:
                        0 4px 6px rgba(0, 0, 0, 0.3);

                    transition:
                        transform 0.2s ease,
                        background-color 0.2s ease;
                }

                #${this.config.containerId} .tw-torn-tip:active {
                    transform: scale(0.95);
                }

                /* =================================================
                 * REDUCED MOTION
                 * ================================================= */

                @media (prefers-reduced-motion: reduce) {
                    #${this.config.containerId}
                    .tw-coffee-cup {
                        animation: none;
                    }

                    #${this.config.containerId}
                    .tw-coffee-cup::before,
                    #${this.config.containerId}
                    .tw-coffee-cup::after {
                        animation: none;
                        opacity: 0;
                    }

                    #${this.config.containerId}
                    .tw-coffee-fill {
                        animation: none;
                        transform: scaleY(0.8);
                    }

                    #${this.config.containerId}
                    .tw-coffee-label > span {
                        animation: none;
                        opacity: 0;
                        filter: none;
                        transform: none;
                    }

                    #${this.config.containerId}
                    .tw-coffee-label
                    > span:nth-child(2) {
                        opacity: 1;
                    }

                    #${this.config.containerId}
                    .tw-bmc::after {
                        animation: none;
                        opacity: 0;
                    }
                }

                /* =================================================
                 * MOBILE / TORN PDA
                 * ================================================= */

                @media (max-width: 480px) {
                    #${this.config.containerId} {
                        right: 10px;
                        bottom: 10px;
                        left: 10px;

                        width: auto;
                    }

                    #${this.config.containerId}
                    .tw-support-btn {
                        width: 100%;
                    }

                    #${this.config.containerId}
                    .tw-bmc {
                        min-width: 0;
                    }
                }
            `;

            /*
             * Preferred Tampermonkey path.
             *
             * Some restricted WebViews can expose GM_addStyle but
             * still throw when it is called. Fall back safely.
             */
            if (typeof GM_addStyle === "function") {
                try {
                    GM_addStyle(styles);
                    return;
                } catch (_) {
                    /*
                     * Fall through to normal DOM style injection.
                     */
                }
            }

            this.injectStyleElement(styles);
        }

        injectStyleElement(styles) {
            if (document.getElementById(this.config.styleId)) {
                return;
            }

            const styleNode =
                document.createElement("style");

            styleNode.id =
                this.config.styleId;

            styleNode.type =
                "text/css";

            styleNode.textContent =
                styles;

            if (document.head) {
                document.head.appendChild(styleNode);
                return;
            }

            const body = this.getBody();

            if (body) {
                body.appendChild(styleNode);
            }
        }

        /* ========================================================
         * COFFEE BUTTON
         * ======================================================== */

        buildCoffeeButton() {
            coffeeInstanceCount += 1;

            const clipId =
                `tw-coffee-clip-${coffeeInstanceCount}`;

            const bmcLink =
                document.createElement("a");

            bmcLink.className =
                "tw-support-btn tw-bmc";

            bmcLink.href =
                `https://www.buymeacoffee.com/${encodeURIComponent(
                    this.config.bmcId
                )}`;

            bmcLink.target = "_blank";

            bmcLink.rel =
                "noopener noreferrer";

            bmcLink.title =
                "Support ThaWookie";

            bmcLink.setAttribute(
                "aria-label",
                "Buy me a coffee — support ThaWookie"
            );

            /*
             * ----------------------------------------------------
             * Animated coffee cup
             * ----------------------------------------------------
             */

            const cup =
                document.createElement("span");

            cup.className =
                "tw-coffee-cup";

            cup.setAttribute(
                "aria-hidden",
                "true"
            );

            const svg =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );

            svg.setAttribute(
                "width",
                "16"
            );

            svg.setAttribute(
                "height",
                "16"
            );

            svg.setAttribute(
                "viewBox",
                "0 0 24 24"
            );

            svg.setAttribute(
                "fill",
                "none"
            );

            svg.setAttribute(
                "stroke",
                "currentColor"
            );

            svg.setAttribute(
                "stroke-width",
                "1.5"
            );

            svg.setAttribute(
                "aria-hidden",
                "true"
            );

            /*
             * SVG clip path.
             *
             * This is intentionally generated through DOM APIs
             * rather than innerHTML so the only dynamic value,
             * clipId, cannot become an HTML injection vector.
             */

            const defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            const clipPath =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "clipPath"
                );

            clipPath.setAttribute(
                "id",
                clipId
            );

            const clipShape =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            clipShape.setAttribute(
                "d",
                "M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"
            );

            clipPath.appendChild(
                clipShape
            );

            defs.appendChild(
                clipPath
            );

            svg.appendChild(
                defs
            );

            /*
             * Coffee liquid.
             *
             * The CSS transform animation controls its visible
             * fill level.
             */
            const coffeeFill =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );

            coffeeFill.setAttribute(
                "class",
                "tw-coffee-fill"
            );

            coffeeFill.setAttribute(
                "x",
                "5"
            );

            coffeeFill.setAttribute(
                "y",
                "8"
            );

            coffeeFill.setAttribute(
                "width",
                "11"
            );

            coffeeFill.setAttribute(
                "height",
                "9"
            );

            coffeeFill.setAttribute(
                "fill",
                "#6f4e37"
            );

            coffeeFill.setAttribute(
                "stroke",
                "none"
            );

            coffeeFill.setAttribute(
                "clip-path",
                `url(#${clipId})`
            );

            svg.appendChild(
                coffeeFill
            );

            /*
             * Cup body outline.
             */
            const cupBody =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            cupBody.setAttribute(
                "stroke-linecap",
                "round"
            );

            cupBody.setAttribute(
                "stroke-linejoin",
                "round"
            );

            cupBody.setAttribute(
                "d",
                "M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"
            );

            svg.appendChild(
                cupBody
            );

            /*
             * Cup handle.
             */
            const cupHandle =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            cupHandle.setAttribute(
                "stroke-linecap",
                "round"
            );

            cupHandle.setAttribute(
                "stroke-linejoin",
                "round"
            );

            cupHandle.setAttribute(
                "d",
                "M16 9h2.5a2.5 2.5 0 0 1 0 5H16"
            );

            svg.appendChild(
                cupHandle
            );

            cup.appendChild(
                svg
            );

            bmcLink.appendChild(
                cup
            );

            /*
             * ----------------------------------------------------
             * Animated label
             * ----------------------------------------------------
             */

            const label =
                document.createElement("span");

            label.className =
                "tw-coffee-label";

            label.setAttribute(
                "aria-hidden",
                "true"
            );

            const supportLabel =
                document.createElement("span");

            supportLabel.textContent =
                "Support the project?";

            const coffeeLabel =
                document.createElement("span");

            coffeeLabel.textContent =
                "Buy me a coffee";

            label.appendChild(
                supportLabel
            );

            label.appendChild(
                coffeeLabel
            );

            bmcLink.appendChild(
                label
            );

            return bmcLink;
        }

        /* ========================================================
         * UI INJECTION
         * ======================================================== */

        injectUI() {
            if (
                this.destroyed ||
                this.isInjecting
            ) {
                return;
            }

            const body =
                this.getBody();

            if (!body) {
                return;
            }

            if (this.isContainerConnected()) {
                return;
            }

            this.isInjecting = true;

            try {
                /*
                 * Remove stale disconnected node, if present.
                 */
                const existingContainer =
                    this.getContainer();

                if (existingContainer) {
                    existingContainer.remove();
                }

                const container =
                    document.createElement("div");

                container.id =
                    this.config.containerId;

                container.setAttribute(
                    "role",
                    "complementary"
                );

                container.setAttribute(
                    "aria-label",
                    "Support ThaWookie"
                );

                /*
                 * Animated Buy Me a Coffee button.
                 */
                const bmcLink =
                    this.buildCoffeeButton();

                /*
                 * ------------------------------------------------
                 * Torn Xanax Tip
                 * ------------------------------------------------
                 */

                const tipLink =
                    document.createElement("a");

                tipLink.href =
                    "https://www.torn.com/item.php";

                tipLink.target =
                    "_blank";

                tipLink.rel =
                    "noopener noreferrer";

                tipLink.className =
                    "tw-support-btn tw-torn-tip";

                tipLink.title =
                    `Opens Items — search "Xanax", ` +
                    `tap Send, enter ThaWookie ` +
                    `[${this.config.tornUserId}]`;

                tipLink.setAttribute(
                    "aria-label",
                    `Send a Xanax tip to ThaWookie ` +
                    `[${this.config.tornUserId}]`
                );

                tipLink.textContent =
                    "💊 Send a Xanax Tip";

                /*
                 * Assemble donation controls.
                 */
                container.appendChild(
                    bmcLink
                );

                container.appendChild(
                    tipLink
                );

                /*
                 * Append directly to body so React does not own
                 * the donation UI's DOM subtree.
                 */
                body.appendChild(
                    container
                );
            } finally {
                this.isInjecting = false;
            }
        }

        /* ========================================================
         * MUTATION OBSERVER
         * ======================================================== */

        attachObserver() {
            if (
                this.destroyed ||
                this.observerAttached ||
                typeof MutationObserver === "undefined"
            ) {
                return;
            }

            const body =
                this.getBody();

            if (!body) {
                return;
            }

            this.observer =
                new MutationObserver(
                    (mutationList) => {
                        if (
                            this.destroyed ||
                            this.isInjecting
                        ) {
                            return;
                        }

                        let relevantMutation =
                            false;

                        for (
                            const mutation
                            of mutationList
                        ) {
                            if (
                                mutation.type !==
                                "childList"
                            ) {
                                continue;
                            }

                            if (
                                mutation.removedNodes
                                    .length > 0
                            ) {
                                relevantMutation =
                                    true;

                                break;
                            }
                        }

                        if (
                            !relevantMutation
                        ) {
                            return;
                        }

                        if (
                            !this.isContainerConnected()
                        ) {
                            this.injectStyles();
                            this.injectUI();
                        }
                    }
                );

            this.observer.observe(
                body,
                {
                    childList: true,
                    subtree: true
                }
            );

            this.observerAttached = true;
        }

        /* ========================================================
         * CLEANUP
         * ======================================================== */

        destroy() {
            this.destroyed = true;

            if (this.observer) {
                try {
                    this.observer.disconnect();
                } catch (_) {
                    /*
                     * Nothing further required.
                     */
                }
            }

            this.observer = null;
            this.observerAttached = false;

            const container =
                this.getContainer();

            if (container) {
                container.remove();
            }
        }
    }

    /* ============================================================
     * MODULE STARTUP
     * ============================================================ */

    function startSupportModule() {
        return new SupportModule();
    }

    /*
     * Respect normal document lifecycle.
     *
     * No setTimeout().
     * No setInterval().
     * No polling.
     */
    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            startSupportModule,
            { once: true }
        );
    } else {
        startSupportModule();
    }
})();
