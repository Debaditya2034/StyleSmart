// src/content/couponDetector.js
import { CouponAnalyzer } from '../utils/couponAnalyzer.js';

class CouponDetector {
    constructor() {
        this.couponAnalyzer = new CouponAnalyzer();
        this.isUIInjected = false;
        this.currentRetailer = null;
        this.observer = null;
    }

    async initialize() {
        try {
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => this.startDetection());
            } else {
                this.startDetection();
            }
        } catch (error) {
            console.error('Error initializing CouponDetector:', error);
        }
    }

    async startDetection() {
        this.currentRetailer = this.detectRetailer();
        if (!this.currentRetailer) return;

        this.setupPageObserver();
        await this.checkForCoupons();
        this.setupKeyboardShortcut();
    }

    detectRetailer() {
        const hostname = window.location.hostname;
        const supportedRetailers = [
            'amazon',
            'snapdeal',
            'zara'
        ];

        const retailerName = hostname.split('.')[1] || 
                           hostname.split('.')[0];
        
        return supportedRetailers.includes(retailerName) ? retailerName : null;
    }

    setupPageObserver() {
        this.observer = new MutationObserver(async (mutations) => {
            if (this.isCheckoutOrCartPage()) {
                await this.checkForCoupons();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    isCheckoutOrCartPage() {
        const url = window.location.href.toLowerCase();
        return url.includes('cart') || 
               url.includes('checkout') || 
               url.includes('basket') ||
               url.includes('payment');
    }

    async checkForCoupons() {
        try {
            const coupons = await this.couponAnalyzer.fetchCoupons(this.currentRetailer);
            if (coupons && coupons.length > 0) {
                this.injectCouponUI(coupons);
            }
        } catch (error) {
            console.error('Error checking for coupons:', error);
        }
    }

    injectCouponUI(coupons) {
        if (this.isUIInjected) {
            this.updateCouponUI(coupons);
            return;
        }

        const validCoupons = coupons.filter(coupon => 
            this.couponAnalyzer.validateCoupon(coupon)
        );
        
        const sortedCoupons = this.couponAnalyzer.sortCoupons(validCoupons);
        
        const couponContainer = document.createElement('div');
        couponContainer.id = 'fashion-extension-coupons';
        couponContainer.innerHTML = this.generateCouponHTML(sortedCoupons);
        
        this.addDragFunctionality(couponContainer);
        document.body.appendChild(couponContainer);
        this.isUIInjected = true;
        this.setupCouponInteractions(couponContainer);
    }

    updateCouponUI(coupons) {
        const container = document.getElementById('fashion-extension-coupons');
        if (container) {
            const validCoupons = coupons.filter(coupon => 
                this.couponAnalyzer.validateCoupon(coupon)
            );
            const sortedCoupons = this.couponAnalyzer.sortCoupons(validCoupons);
            container.innerHTML = this.generateCouponHTML(sortedCoupons);
            this.setupCouponInteractions(container);
        }
    }

    generateCouponHTML(coupons) {
        return `
            <div class="coupon-panel">
                <div class="coupon-header">
                    <h3>Available Coupons</h3>
                    <button class="minimize-button">_</button>
                    <button class="close-button">×</button>
                </div>
                <div class="coupon-content">
                    ${coupons.map(coupon => `
                        <div class="coupon-item">
                            <div class="coupon-info">
                                <span class="discount">${coupon.discountValue}% OFF</span>
                                <span class="code">${coupon.code}</span>
                                <span class="expiry">Expires: ${new Date(coupon.expiryDate).toLocaleDateString()}</span>
                            </div>
                            <button class="copy-button" data-code="${coupon.code}">
                                Copy Code
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    addDragFunctionality(container) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.coupon-header')) {
                isDragging = true;
                initialX = e.clientX - container.offsetLeft;
                initialY = e.clientY - container.offsetTop;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                container.style.left = `${currentX}px`;
                container.style.top = `${currentY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    setupCouponInteractions(container) {
        container.querySelectorAll('.copy-button').forEach(button => {
            button.addEventListener('click', async () => {
                const code = button.dataset.code;
                try {
                    await navigator.clipboard.writeText(code);
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy Code';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                }
            });
        });

        const minimizeButton = container.querySelector('.minimize-button');
        if (minimizeButton) {
            minimizeButton.addEventListener('click', () => {
                const content = container.querySelector('.coupon-content');
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
                minimizeButton.textContent = content.style.display === 'none' ? '+' : '_';
            });
        }

        const closeButton = container.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                container.remove();
                this.isUIInjected = false;
            });
        }
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                const panel = document.getElementById('fashion-extension-coupons');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                } else {
                    this.checkForCoupons();
                }
            }
        });
    }
}

// Initialize coupon detector
const detector = new CouponDetector();
detector.initialize();