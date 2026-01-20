// Bundle Configuration
const BUNDLE_CONFIG = {
    products: {
        sort: {
            name: 'Sort',
            variantId: '49885169189206',
            image: 'https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemasken.jpg_2_e103e0c1-662b-4aca-a605-009f32c6e49e.jpg?v=1768917230'
        },
        rosa: {
            name: 'Rosa',
            variantId: '49885169189206',
            image: 'https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemaske_jpg_3ec23e6e-1dce-4474-a8e8-30ad75e4a914.jpg?v=1768917229'
        },
        graa: {
            name: 'Grå',
            variantId: '50595389866326',
            image: 'https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemasken_jpg_049bb0ba-66eb-478f-87ba-5f4e1c3af56c.jpg?v=1768917230'
        },
        blaa: {
            name: 'Blå',
            variantId: '49885169189206',
            image: 'https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemasken.jpg_3_021793b9-d91c-4e66-8277-77242e0f482e.jpg?v=1768917230'
        }
    },
    prices: {
        1: 399,
        2: 750,
        3: 950
    }
};

// State Management
let bundleState = {
    selectedColor: null,
    selectedQuantity: 2, // Default to 2 stk
    colorDistribution: {},
    outOfStockVariants: []
};

// DOM Elements
const colorSelection = document.getElementById('color-selection');
const quantitySelection = document.getElementById('quantity-selection');
const backButton = document.getElementById('back-to-color');
const addToCartBtn = document.getElementById('add-to-cart');
const colorDistributionDiv = document.getElementById('color-distribution');
const distributionOptions = document.getElementById('distribution-options');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeBundle();
    attachEventListeners();
    checkStockAvailability();
});

// Check stock availability from Shopify
async function checkStockAvailability() {
    // This function would integrate with Shopify's API
    // For now, we'll simulate it with a placeholder

    try {
        // If using Shopify's Ajax API:
        // const response = await fetch('/products/your-product-handle.js');
        // const product = await response.json();

        // Check each variant's availability
        // For demonstration, assuming all are in stock
        // You would check product.variants and filter by inventory_quantity

        bundleState.outOfStockVariants = []; // Update with actual out of stock variants

        // Mark out of stock products in UI
        updateOutOfStockUI();

    } catch (error) {
        console.error('Error checking stock:', error);
    }
}

function updateOutOfStockUI() {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const variantId = card.dataset.variantId;

        if (bundleState.outOfStockVariants.includes(variantId)) {
            card.classList.add('out-of-stock');
            // Move to end
            card.parentElement.appendChild(card);
        }
    });
}

function initializeBundle() {
    // Set default quantity to 2 stk
    const quantityCards = document.querySelectorAll('.quantity-card');
    quantityCards.forEach(card => {
        if (card.dataset.quantity === '2') {
            card.classList.add('selected');
        }
    });
}

function attachEventListeners() {
    // Color selection
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', handleColorSelection);
    });

    // Quantity selection
    const quantityCards = document.querySelectorAll('.quantity-card');
    quantityCards.forEach(card => {
        card.addEventListener('click', handleQuantitySelection);
    });

    // Back button
    backButton.addEventListener('click', goBackToColorSelection);

    // Add to cart
    addToCartBtn.addEventListener('click', handleAddToCart);
}

function handleColorSelection(event) {
    const card = event.currentTarget;
    const color = card.dataset.color;
    const variantId = card.dataset.variantId;

    // Check if out of stock
    if (bundleState.outOfStockVariants.includes(variantId)) {
        return; // Don't proceed if out of stock
    }

    // Clear previous selection
    document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));

    // Set new selection
    card.classList.add('selected');
    bundleState.selectedColor = color;

    // Move to quantity selection
    setTimeout(() => {
        colorSelection.classList.remove('active');
        quantitySelection.classList.add('active');
        updateAddToCartButton();
        updateColorDistribution();
    }, 200);
}

function handleQuantitySelection(event) {
    const card = event.currentTarget;
    const quantity = parseInt(card.dataset.quantity);

    // Clear previous selection
    document.querySelectorAll('.quantity-card').forEach(c => c.classList.remove('selected'));

    // Set new selection
    card.classList.add('selected');
    bundleState.selectedQuantity = quantity;

    // Update color distribution options
    updateColorDistribution();
    updateAddToCartButton();
}

function updateColorDistribution() {
    const quantity = bundleState.selectedQuantity;

    if (quantity > 1) {
        colorDistributionDiv.classList.remove('hidden');

        // Generate distribution options
        distributionOptions.innerHTML = '';

        for (let i = 1; i <= quantity; i++) {
            const item = document.createElement('div');
            item.className = 'distribution-item';

            const label = document.createElement('label');
            label.innerHTML = `<span style="font-weight: 600; color: var(--brand-color);">Produkt ${i}:</span>`;

            const select = document.createElement('select');
            select.dataset.index = i;

            // Add color options
            Object.keys(BUNDLE_CONFIG.products).forEach(colorKey => {
                const product = BUNDLE_CONFIG.products[colorKey];

                // Skip if out of stock
                if (bundleState.outOfStockVariants.includes(product.variantId)) {
                    return;
                }

                const option = document.createElement('option');
                option.value = colorKey;
                option.textContent = product.name;

                // Pre-select the initially selected color for first item
                if (i === 1 && colorKey === bundleState.selectedColor) {
                    option.selected = true;
                }

                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                bundleState.colorDistribution[i] = e.target.value;
            });

            // Set initial value
            if (i === 1) {
                bundleState.colorDistribution[i] = bundleState.selectedColor;
            } else {
                bundleState.colorDistribution[i] = select.value;
            }

            label.appendChild(select);
            item.appendChild(label);
            distributionOptions.appendChild(item);
        }
    } else {
        colorDistributionDiv.classList.add('hidden');
        bundleState.colorDistribution = { 1: bundleState.selectedColor };
    }
}

function goBackToColorSelection() {
    quantitySelection.classList.remove('active');
    colorSelection.classList.add('active');
}

function updateAddToCartButton() {
    if (bundleState.selectedColor) {
        addToCartBtn.textContent = 'Tilføj til kurv';
        addToCartBtn.classList.remove('disabled');
    } else {
        addToCartBtn.textContent = 'Vælg venligst farve';
        addToCartBtn.classList.add('disabled');
    }
}

async function handleAddToCart() {
    if (!bundleState.selectedColor) {
        addToCartBtn.textContent = 'Vælg venligst farve';
        return;
    }

    // Prepare cart items
    const items = [];
    const quantity = bundleState.selectedQuantity;

    if (quantity === 1) {
        // Single item
        const product = BUNDLE_CONFIG.products[bundleState.selectedColor];
        items.push({
            id: product.variantId,
            quantity: 1,
            properties: {
                'Bundle': 'Feevra Bundle',
                'Farve': product.name
            }
        });
    } else {
        // Multiple items with distribution
        const colorCounts = {};

        for (let i = 1; i <= quantity; i++) {
            const color = bundleState.colorDistribution[i];
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        }

        // Create cart items based on color distribution
        Object.entries(colorCounts).forEach(([color, count]) => {
            const product = BUNDLE_CONFIG.products[color];
            items.push({
                id: product.variantId,
                quantity: count,
                properties: {
                    'Bundle': 'Feevra Bundle',
                    'Farve': product.name,
                    'Bundle størrelse': `${quantity} stk`
                }
            });
        });
    }

    // Add to Shopify cart
    try {
        addToCartBtn.textContent = 'Tilføjer...';
        addToCartBtn.disabled = true;

        // Shopify Ajax API call
        const formData = {
            items: items
        };

        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            addToCartBtn.textContent = '✓ Tilføjet til kurv!';

            // Optional: Redirect to cart or update cart drawer
            setTimeout(() => {
                window.location.href = '/cart';
                // Or trigger cart drawer: document.dispatchEvent(new CustomEvent('cart:refresh'));
            }, 1000);
        } else {
            throw new Error('Failed to add to cart');
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        addToCartBtn.textContent = 'Fejl - prøv igen';

        setTimeout(() => {
            updateAddToCartButton();
            addToCartBtn.disabled = false;
        }, 2000);
    }
}

// Export for potential use in Shopify theme
if (typeof window !== 'undefined') {
    window.FeevraBundleApp = {
        state: bundleState,
        config: BUNDLE_CONFIG,
        checkStock: checkStockAvailability
    };
}
