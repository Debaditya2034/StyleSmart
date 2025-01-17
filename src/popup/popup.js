// src/popup/popup.js
import { CouponAnalyzer } from '../utils/couponAnalyzer.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize components
    initializeUI();
    await loadCurrentProduct();
    await loadCoupons();
    await loadSimilarProducts();
});

async function initializeUI() {
    // Set up UI event listeners
    document.getElementById('refresh-button')?.addEventListener('click', refreshData);
    document.getElementById('settings-button')?.addEventListener('click', openSettings);
    setupCouponSection();
}

async function loadCurrentProduct() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Show loading state
        document.getElementById('current-product').innerHTML = generateLoadingHTML();
        
        // Get product data from content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getCurrentProduct" });
        
        if (response?.product) {
            document.getElementById('current-product').innerHTML = generateProductHTML(response.product);
        } else {
            document.getElementById('current-product').innerHTML = '<p>No product detected on this page.</p>';
        }
    } catch (error) {
        console.error('Error loading current product:', error);
        document.getElementById('current-product').innerHTML = '<p>Error loading product information.</p>';
    }
}

async function loadCoupons() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const retailer = new URL(tab.url).hostname.split('.')[1];
        
        document.getElementById('coupon-section').innerHTML = '<div class="loading">Loading coupons...</div>';
        
        const couponAnalyzer = new CouponAnalyzer();
        const coupons = await couponAnalyzer.fetchCoupons(retailer);
        
        if (coupons && coupons.length > 0) {
            document.getElementById('coupon-section').innerHTML = generateCouponsHTML(coupons);
            setupCouponInteractions();
        } else {
            document.getElementById('coupon-section').innerHTML = '<p>No coupons available.</p>';
        }
    } catch (error) {
        console.error('Error loading coupons:', error);
        document.getElementById('coupon-section').innerHTML = '<p>Error loading coupons.</p>';
    }
}

async function loadSimilarProducts() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        document.getElementById('similar-products').innerHTML = generateLoadingHTML();
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getSimilarProducts" });
        
        if (response?.products?.length > 0) {
            document.getElementById('similar-products').innerHTML = generateSimilarProductsHTML(response.products);
        } else {
            document.getElementById('similar-products').innerHTML = '<p>No similar products found.</p>';
        }
    } catch (error) {
        console.error('Error loading similar products:', error);
        document.getElementById('similar-products').innerHTML = '<p>Error loading similar products.</p>';
    }
}

function generateProductHTML(product) {
    return `
        <div class="card current-product-card">
            <div class="card-image">
                <figure class="image">
                    <img src="${product.image}" alt="${product.name}">
                </figure>
            </div>
            <div class="card-content">
                <p class="title is-4">${product.name}</p>
                <p class="subtitle is-6">${product.price}</p>
                <div class="content">${product.description}</div>
            </div>
        </div>
    `;
}

function generateCouponsHTML(coupons) {
    return `
        <div class="coupons-container">
            <h3 class="title is-4">Available Coupons</h3>
            ${coupons.map(coupon => `
                <div class="coupon-item box">
                    <div class="coupon-info">
                        <span class="discount">${coupon.discountValue}% OFF</span>
                        <span class="code">${coupon.code}</span>
                        <span class="expiry">Expires: ${new Date(coupon.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <button class="button is-primary copy-code" data-code="${coupon.code}">
                        Copy Code
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function generateSimilarProductsHTML(products) {
    return `
        <div class="columns is-multiline">
            ${products.map(product => `
                <div class="column is-4">
                    <div class="card product-card">
                        <div class="card-image">
                            <figure class="image">
                                <img src="${product.image}" alt="${product.name}">
                            </figure>
                        </div>
                        <div class="card-content">
                            <p class="title is-5">${product.name}</p>
                            <p class="subtitle is-6">${product.price}</p>
                            <a href="${product.url}" target="_blank" class="button is-small is-fullwidth">
                                View Product
                            </a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function generateLoadingHTML() {
    return `
        <div class="loader-container">
            <div class="futuristic-loader">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <p class="loading-text">Loading...</p>
        </div>
    `;
}

function setupCouponInteractions() {
    document.querySelectorAll('.copy-code').forEach(button => {
        button.addEventListener('click', async () => {
            const code = button.dataset.code;
            try {
                await navigator.clipboard.writeText(code);
                button.textContent = 'Copied!';
                button.classList.add('is-success');
                setTimeout(() => {
                    button.textContent = 'Copy Code';
                    button.classList.remove('is-success');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                button.textContent = 'Error';
                button.classList.add('is-danger');
            }
        });
    });
}

async function refreshData() {
    await Promise.all([
        loadCurrentProduct(),
        loadCoupons(),
        loadSimilarProducts()
    ]);
}

function openSettings() {
    // Implement settings functionality
    console.log('Settings opened');
}

// Add this to your existing popup.css file