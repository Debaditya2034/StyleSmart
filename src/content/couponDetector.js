// content/couponDetector.js
class CouponDetector {
    constructor() {
        this.couponAnalyzer = new CouponAnalyzer();
    }

    async initialize() {
        const retailer = this.detectRetailer();
        const coupons = await this.couponAnalyzer.fetchCoupons(retailer);
        this.injectCouponUI(coupons);
    }

    detectRetailer() {
        const hostname = window.location.hostname;
        return hostname.split('.')[1]; // Simple extraction of retailer name
    }

    injectCouponUI(coupons) {
        const validCoupons = coupons.filter(coupon => 
            this.couponAnalyzer.validateCoupon(coupon)
        );
        
        const sortedCoupons = this.couponAnalyzer.sortCoupons(validCoupons);
        
        // Create and inject coupon UI
        const couponContainer = document.createElement('div');
        couponContainer.id = 'fashion-extension-coupons';
        couponContainer.innerHTML = this.generateCouponHTML(sortedCoupons);
        
        document.body.appendChild(couponContainer);
    }

    generateCouponHTML(coupons) {
        return `
            <div class="coupon-panel">
                <h3>Available Coupons</h3>
                ${coupons.map(coupon => `
                    <div class="coupon-item">
                        <span class="discount">${coupon.discountValue}% OFF</span>
                        <span class="code">${coupon.code}</span>
                        <span class="expiry">Expires: ${coupon.expiryDate}</span>
                        <button onclick="navigator.clipboard.writeText('${coupon.code}')">
                            Copy Code
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }
}