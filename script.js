// Cart Management System
let cart = JSON.parse(localStorage.getItem('royalZariCart')) || [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupCart();
    setupAddToCartButtons();
    setupQuantitySelectors();
    updateCartUI();
    setupFormSubmission();
    setupEnquireButtons();
});

// Cart functionality
function setupCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartModal.style.display = 'flex';
            updateCartUI();
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', initiatePayment);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
}

function setupAddToCartButtons() {
    const addToCartBtns = document.querySelectorAll('.btn-add-cart');
    
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const productPrice = parseInt(productCard.dataset.productPrice);
            const quantity = parseInt(productCard.querySelector('.qty-input').value);

            addToCart(productId, productName, productPrice, quantity);
            
            // Show success message
            const originalText = this.textContent;
            this.textContent = '✓ Added!';
            this.style.background = '#51cf66';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
            }, 1500);
        });
    });
}

function setupQuantitySelectors() {
    document.querySelectorAll('.product-card').forEach(card => {
        const minusBtn = card.querySelector('.qty-btn.minus');
        const plusBtn = card.querySelector('.qty-btn.plus');
        const input = card.querySelector('.qty-input');

        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                if (value > 1) input.value = value - 1;
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                input.value = value + 1;
            });
        }
    });
}

function addToCart(productId, productName, productPrice, quantity) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: quantity
        });
    }
    
    saveCart();
    updateCartUI();
    
    // Open cart to show it was added
    setTimeout(() => {
        document.getElementById('cartModal').style.display = 'flex';
    }, 500);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity > 0) {
            item.quantity = parseInt(newQuantity);
        } else {
            removeFromCart(productId);
        }
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('royalZariCart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const subtotal = document.getElementById('subtotal');
    const shipping = document.getElementById('shipping');
    const total = document.getElementById('total');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items display
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        if (subtotal) subtotal.textContent = '₹0';
        if (shipping) shipping.textContent = '₹0';
        if (total) total.textContent = '₹0';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                    <div class="cart-item-qty">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${item.id}', this.value)">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: var(--primary-color); margin-bottom: 10px;">
                        ₹${(item.price * item.quantity).toLocaleString()}
                    </div>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
            </div>
        `).join('');

        // Calculate totals
        const subtotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingAmount = subtotalAmount > 500 ? 0 : 100;
        const totalAmount = subtotalAmount + shippingAmount;

        if (subtotal) subtotal.textContent = '₹' + subtotalAmount.toLocaleString();
        if (shipping) shipping.textContent = shippingAmount === 0 ? 'FREE' : '₹' + shippingAmount;
        if (total) total.textContent = '₹' + totalAmount.toLocaleString();
    }
}

// Payment Processing
function initiatePayment() {
    if (cart.length === 0) {
        alert('Your cart is empty. Please add products first.');
        return;
    }

    const totalAmount = calculateTotal();

    const formHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center;" id="paymentOverlay">
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <h2 style="color: #0f0f0f; margin-bottom: 20px;">Order Confirmation</h2>
                
                <div style="background: #faf8f3; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #0f0f0f; margin-top: 0;">Order Summary</h3>
                    ${cart.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>${item.name} (x${item.quantity})</span>
                            <span style="color: #e8c547; font-weight: bold;">₹${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                    <hr style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                        <span>Total:</span>
                        <span style="color: #e8c547;">₹${totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <form id="checkoutDetailsForm" style="margin-bottom: 20px;">
                    <div style="margin-bottom: 15px;">
                        <input type="text" placeholder="Full Name" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <input type="email" placeholder="Email Address" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <input type="tel" placeholder="Phone Number" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <textarea placeholder="Delivery Address" required rows="3" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; font-family: inherit;"></textarea>
                    </div>
                </form>

                <div style="display: flex; gap: 10px;">
                    <button onclick="document.getElementById('paymentOverlay').remove(); completeOrder();" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #e8c547, #f4d87e); color: #0f0f0f; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 1rem;">
                        Complete Order
                    </button>
                    <button onclick="document.getElementById('paymentOverlay').remove();" style="flex: 1; padding: 14px; background: white; color: #0f0f0f; border: 2px solid #0f0f0f; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                        Cancel
                    </button>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; font-size: 0.9rem; color: #666;">
                    <strong>Secure Payment:</strong> You will receive a WhatsApp/Email payment link to complete your payment securely.
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function completeOrder() {
    const orderData = {
        orderId: '#RZ' + Date.now(),
        amount: calculateTotal(),
        items: cart,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN')
    };

    // Save order to localStorage
    let orders = JSON.parse(localStorage.getItem('royalZariOrders')) || [];
    orders.push(orderData);
    localStorage.setItem('royalZariOrders', JSON.stringify(orders));

    alert('✓ Order Placed Successfully!\n\n' +
        'Order ID: ' + orderData.orderId + '\n' +
        'Total Amount: ₹' + calculateTotal().toLocaleString() + '\n\n' +
        'You will receive payment instructions via WhatsApp.\n' +
        'Thank you for ordering from Royal Zari!');

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    document.getElementById('cartModal').style.display = 'none';
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 100;
    return subtotal + shipping;
}

// Form Submission
function setupFormSubmission() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: this.querySelector('input[placeholder="Your Name"]').value,
                email: this.querySelector('input[placeholder="Your Email"]').value,
                phone: this.querySelector('input[placeholder="Your Phone Number"]').value,
                message: this.querySelector('textarea').value,
                timestamp: new Date().toISOString()
            };

            // Save to localStorage
            let inquiries = JSON.parse(localStorage.getItem('royalZariInquiries')) || [];
            inquiries.push(formData);
            localStorage.setItem('royalZariInquiries', JSON.stringify(inquiries));

            alert('Thank you for your inquiry! We will get back to you soon via email or phone.');
            
            // Reset form
            this.reset();
        });
    }
}

// Enquire Button Functionality
function setupEnquireButtons() {
    const enquireButtons = document.querySelectorAll('.btn-enquire:not(.btn-add-cart)');
    
    enquireButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.parentElement.querySelector('h3').innerText;
            const price = this.parentElement.querySelector('.price').innerText;
            
            const contactSection = document.getElementById('contact');
            contactSection.scrollIntoView({ behavior: 'smooth' });
            
            const messageField = document.querySelector('textarea[placeholder="Your Message"]');
            if (messageField) {
                messageField.value = `I am interested in ${productName} (${price}). Please provide more details.`;
                messageField.focus();
            }
        });
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    }
});

// WhatsApp Integration
function whatsappEnquiry(productName) {
    const message = `Hello Royal Zari, I'm interested in ${productName}. Could you please provide more information?`;
    const whatsappNumber = '919330919000';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// Phone Call
function callUs() {
    window.location.href = 'tel:+919330919000';
}

// Email
function emailUs() {
    window.location.href = 'mailto:Fahimiqbal0099@gmail.com?subject=Product%20Inquiry&body=Hello%20Royal%20Zari,%20I%20am%20interested%20in%20your%20products.';
}

// Image Upload Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle file input changes
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function(e) {
            handleImageUpload(e.target.id, e.target.files[0]);
        });
    });
});

function handleImageUpload(inputId, file) {
    if (!file) return;

    const uploadBox = document.querySelector(`[data-product="${inputId}"]`);
    const placeholder = uploadBox.querySelector('.upload-placeholder');
    const preview = uploadBox.querySelector('.upload-preview');
    const downloadBtn = uploadBox.querySelector('.btn-download');

    // Create file reader for preview
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        downloadBtn.style.display = 'inline-block';

        // Store the file data for download
        preview.dataset.fileData = e.target.result;
        preview.dataset.fileName = file.name;
    };
    reader.readAsDataURL(file);
}

function downloadImage(productId, filename) {
    const preview = document.querySelector(`[data-product="${productId}"] .upload-preview`);
    if (!preview.dataset.fileData) return;

    // Create download link
    const link = document.createElement('a');
    link.href = preview.dataset.fileData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    showNotification(`Downloaded ${filename} successfully!`, 'success');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
