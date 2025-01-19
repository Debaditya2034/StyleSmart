// src/utils/productAnalyzer.js
class ProductAnalyzer {
    constructor() {
        this.imageAnalyzer = new ImageAnalyzer();
    }

    async analyzeProduct(product) {
        // Only get image embedding, remove text analysis
        const imageEmbedding = await this.imageAnalyzer.getImageEmbedding(product.image);

        return {
            ...product,
            imageEmbedding
        };
    }

    calculateSimilarity(product1, product2) {
        if (!product1 || !product2) return 0;

        // Use only image similarity (100% weight)
        return this.imageAnalyzer.calculateImageSimilarity(
            product1.imageEmbedding,
            product2.imageEmbedding
        );
    }
}

// Export for use in other modules
window.ProductAnalyzer = ProductAnalyzer;