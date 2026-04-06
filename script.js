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
    updateOrderNotifications();
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
        showNotification('Your cart is empty. Please add products first.', 'error');
        return;
    }

    const totalAmount = calculateTotal();

    const formHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center;" id="paymentOverlay">
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;">
                <h3 style="text-align: center; margin-bottom: 20px; color: var(--secondary-color);">Complete Your Order</h3>

                <form id="orderForm" style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--secondary-color);">Full Name *</label>
                        <input type="text" id="customerName" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--secondary-color);">Phone Number *</label>
                        <input type="tel" id="customerPhone" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--secondary-color);">Email Address</label>
                        <input type="email" id="customerEmail" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--secondary-color);">Delivery Address *</label>
                        <textarea id="customerAddress" required rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; resize: vertical;"></textarea>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--secondary-color);">Special Instructions</label>
                        <textarea id="specialInstructions" rows="2" placeholder="Any special requests or delivery instructions..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; resize: vertical;"></textarea>
                    </div>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="margin: 0 0 10px 0; color: var(--secondary-color);">Order Summary</h4>
                        ${cart.map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                                <span>${item.name} (x${item.quantity})</span>
                                <span>₹${(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        `).join('')}
                        <hr style="margin: 10px 0; border: none; border-top: 1px solid #dee2e6;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                            <span>Total Amount:</span>
                            <span style="color: var(--primary-color);">₹${totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" onclick="closePaymentForm()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="flex: 2; padding: 12px; background: var(--gradient-1); color: var(--secondary-color); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Place Order</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHTML);

    // Add form submission handler
    document.getElementById('orderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processOrder();
    });
}

function closePaymentForm() {
    const overlay = document.getElementById('paymentOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function processOrder() {
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerAddress = document.getElementById('customerAddress').value;
    const specialInstructions = document.getElementById('specialInstructions').value;

    if (!customerName || !customerPhone || !customerAddress) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Generate order ID
    const orderId = 'RZ' + Date.now().toString().slice(-8);

    // Create order object
    const order = {
        orderId: orderId,
        customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress,
            specialInstructions: specialInstructions
        },
        items: [...cart],
        totalAmount: calculateTotal(),
        orderDate: new Date().toISOString(),
        status: 'pending'
    };

    // Save order to localStorage
    saveOrder(order);

    // Send notifications
    sendOrderNotifications(order);

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();

    // Close payment form
    closePaymentForm();

    // Show success message
    showOrderConfirmation(order);
}

function saveOrder(order) {
    let orders = JSON.parse(localStorage.getItem('royalZariOrders')) || [];
    orders.push(order);
    localStorage.setItem('royalZariOrders', JSON.stringify(orders));
}

function sendOrderNotifications(order) {
    // WhatsApp notification to business owner
    sendWhatsAppNotification(order);

    // Email notification (if email provided)
    if (order.customer.email) {
        sendEmailNotification(order);
    }

    // Store notification for business owner to check
    let notifications = JSON.parse(localStorage.getItem('royalZariNotifications')) || [];
    notifications.push({
        type: 'new_order',
        orderId: order.orderId,
        customerName: order.customer.name,
        totalAmount: order.totalAmount,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('royalZariNotifications', JSON.stringify(notifications));
}

function sendWhatsAppNotification(order) {
    const message = `🆕 *NEW ORDER RECEIVED!*

📦 *Order ID:* ${order.orderId}
👤 *Customer:* ${order.customer.name}
📞 *Phone:* ${order.customer.phone}
📧 *Email:* ${order.customer.email || 'Not provided'}
📍 *Address:* ${order.customer.address}

🛒 *Order Details:*
${order.items.map(item => `• ${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString()}`).join('\n')}

💰 *Total Amount:* ₹${order.totalAmount.toLocaleString()}

📝 *Special Instructions:* ${order.customer.specialInstructions || 'None'}

⏰ *Order Time:* ${new Date(order.orderDate).toLocaleString()}

Please contact the customer to confirm delivery details!`;

    const whatsappNumber = '919330919000';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
}

function sendEmailNotification(order) {
    // For now, we'll use mailto as EmailJS would require API keys
    const subject = `Order Confirmation - ${order.orderId}`;
    const body = `Dear ${order.customer.name},

Thank you for your order from Royal Zari!

Order ID: ${order.orderId}
Total Amount: ₹${order.totalAmount.toLocaleString()}

Order Details:
${order.items.map(item => `${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString()}`).join('\n')}

Delivery Address: ${order.customer.address}

We will contact you soon to confirm your order and arrange delivery.

Best regards,
Royal Zari Team
Phone: +91-9330919000
Email: Fahimiqbal0099@gmail.com`;

    const mailtoUrl = `mailto:${order.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
}

function showOrderConfirmation(order) {
    const confirmationHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 3000; display: flex; align-items: center; justify-content: center;" id="confirmationOverlay">
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center;">
                <div style="font-size: 4em; margin-bottom: 20px;">🎉</div>
                <h2 style="color: var(--secondary-color); margin-bottom: 15px;">Order Placed Successfully!</h2>
                <p style="font-size: 18px; margin-bottom: 10px;"><strong>Order ID: ${order.orderId}</strong></p>
                <p style="margin-bottom: 20px;">Thank you for shopping with Royal Zari!</p>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <h4 style="margin: 0 0 10px 0;">Order Summary:</h4>
                    ${order.items.map(item => `<div>${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString()}</div>`).join('')}
                    <hr style="margin: 10px 0;">
                    <div style="font-weight: bold;">Total: ₹${order.totalAmount.toLocaleString()}</div>
                </div>

                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                    You will receive a WhatsApp confirmation shortly. Our team will contact you within 24 hours to arrange delivery.
                </p>

                <button onclick="closeConfirmation()" style="padding: 12px 30px; background: var(--gradient-1); color: var(--secondary-color); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Continue Shopping</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', confirmationHTML);
}

function closeConfirmation() {
    const overlay = document.getElementById('confirmationOverlay');
    if (overlay) {
        overlay.remove();
    }
    // Refresh page to show empty cart
    location.reload();
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 100;
    return subtotal + shipping;
}
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

// Order Management System
function showOrderManagement() {
    const orders = JSON.parse(localStorage.getItem('royalZariOrders')) || [];
    const notifications = JSON.parse(localStorage.getItem('royalZariNotifications')) || [];

    const unreadCount = notifications.filter(n => !n.read).length;

    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 3000; display: flex; align-items: center; justify-content: center;" id="orderManagementModal">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: var(--secondary-color); margin: 0;">📋 Order Management</h2>
                    <button onclick="closeOrderManagement()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>

                ${unreadCount > 0 ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
                    <strong>🔔 ${unreadCount} new order${unreadCount > 1 ? 's' : ''} received!</strong>
                </div>` : ''}

                ${orders.length === 0 ?
                    '<p style="text-align: center; color: #666; font-style: italic;">No orders received yet.</p>' :
                    `<div style="display: grid; gap: 15px;">
                        ${orders.slice().reverse().map(order => `
                            <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; background: #f8f9fa;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                    <div>
                                        <h3 style="margin: 0; color: var(--secondary-color);">Order #${order.orderId}</h3>
                                        <p style="margin: 5px 0; color: #666; font-size: 14px;">${new Date(order.orderDate).toLocaleString()}</p>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 18px; font-weight: bold; color: var(--primary-color);">₹${order.totalAmount.toLocaleString()}</div>
                                        <span style="background: ${order.status === 'pending' ? '#ffc107' : order.status === 'confirmed' ? '#28a745' : '#6c757d'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${order.status.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                                    <div>
                                        <h4 style="margin: 0 0 10px 0; color: var(--secondary-color);">👤 Customer Details</h4>
                                        <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customer.name}</p>
                                        <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${order.customer.phone}" style="color: var(--primary-color);">${order.customer.phone}</a></p>
                                        ${order.customer.email ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${order.customer.email}" style="color: var(--primary-color);">${order.customer.email}</a></p>` : ''}
                                    </div>
                                    <div>
                                        <h4 style="margin: 0 0 10px 0; color: var(--secondary-color);">📍 Delivery Address</h4>
                                        <p style="margin: 5px 0;">${order.customer.address.replace(/\n/g, '<br>')}</p>
                                        ${order.customer.specialInstructions ? `<p style="margin: 5px 0;"><strong>Instructions:</strong> ${order.customer.specialInstructions}</p>` : ''}
                                    </div>
                                </div>

                                <div>
                                    <h4 style="margin: 0 0 10px 0; color: var(--secondary-color);">🛒 Order Items</h4>
                                    <div style="background: white; padding: 10px; border-radius: 6px;">
                                        ${order.items.map(item => `
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                                <span>${item.name} (x${item.quantity})</span>
                                                <span>₹${(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <div style="display: flex; gap: 10px; margin-top: 15px;">
                                    <button onclick="contactCustomer('${order.customer.phone}', '${order.customer.name}')" style="padding: 8px 15px; background: #25d366; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        📱 WhatsApp
                                    </button>
                                    <button onclick="callCustomer('${order.customer.phone}')" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        📞 Call
                                    </button>
                                    <button onclick="emailCustomer('${order.customer.email || ''}', '${order.orderId}')" style="padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        ✉️ Email
                                    </button>
                                    <select onchange="updateOrderStatus('${order.orderId}', this.value)" style="padding: 8px 15px; border: 1px solid #dee2e6; border-radius: 4px;">
                                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
                    <button onclick="exportOrders()" style="padding: 10px 20px; background: var(--gradient-1); color: var(--secondary-color); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                        📊 Export Orders
                    </button>
                    <button onclick="clearAllOrders()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;" onclick="return confirm('Are you sure you want to clear all orders?')">
                        🗑️ Clear All
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mark notifications as read
    notifications.forEach(n => n.read = true);
    localStorage.setItem('royalZariNotifications', JSON.stringify(notifications));
}

function closeOrderManagement() {
    const modal = document.getElementById('orderManagementModal');
    if (modal) {
        modal.remove();
    }
}

function contactCustomer(phone, name) {
    const message = `Hello ${name}, thank you for your order with Royal Zari! We have received your order and will contact you shortly to confirm delivery details.`;
    const whatsappUrl = `https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function callCustomer(phone) {
    window.location.href = `tel:${phone}`;
}

function emailCustomer(email, orderId) {
    if (!email) {
        showNotification('Customer did not provide email address', 'error');
        return;
    }
    const subject = `Update on Your Royal Zari Order ${orderId}`;
    const body = `Dear Customer,\n\nThank you for your order ${orderId} with Royal Zari.\n\nWe will update you on the status of your order soon.\n\nBest regards,\nRoyal Zari Team`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('royalZariOrders')) || [];
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('royalZariOrders', JSON.stringify(orders));
        showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
    }
}

function exportOrders() {
    const orders = JSON.parse(localStorage.getItem('royalZariOrders')) || [];

    if (orders.length === 0) {
        showNotification('No orders to export', 'error');
        return;
    }

    const csvContent = [
        ['Order ID', 'Date', 'Customer Name', 'Phone', 'Email', 'Address', 'Items', 'Total Amount', 'Status'],
        ...orders.map(order => [
            order.orderId,
            new Date(order.orderDate).toLocaleString(),
            order.customer.name,
            order.customer.phone,
            order.customer.email || '',
            `"${order.customer.address.replace(/"/g, '""')}"`,
            `"${order.items.map(item => `${item.name} (x${item.quantity})`).join('; ')}"`,
            order.totalAmount,
            order.status
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `royal-zari-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Orders exported successfully!', 'success');
}

function clearAllOrders() {
    if (confirm('Are you sure you want to clear all orders? This action cannot be undone.')) {
        localStorage.removeItem('royalZariOrders');
        localStorage.removeItem('royalZariNotifications');
        closeOrderManagement();
        showNotification('All orders cleared', 'success');
    }
}

// Update order notifications badge
function updateOrderNotifications() {
    const notifications = JSON.parse(localStorage.getItem('royalZariNotifications')) || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    // Update navigation badge
    const ordersLink = document.querySelector('a[onclick="showOrderManagement()"]');
    if (ordersLink) {
        // Remove existing badge
        const existingBadge = ordersLink.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add new badge if there are unread notifications
        if (unreadCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.cssText = `
                background: #dc3545;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
                margin-left: 5px;
                position: relative;
                top: -2px;
            `;
            ordersLink.appendChild(badge);
        }
    }
}

// Call updateOrderNotifications when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateOrderNotifications();
});

function updateProductPrice(productImageName, newPrice) {
    if (!newPrice || newPrice < 0) {
        showNotification('Please enter a valid price', 'error');
        return;
    }

    // Update localStorage with new price
    let productPrices = JSON.parse(localStorage.getItem('royalZariPrices')) || {};
    productPrices[productImageName] = parseInt(newPrice);
    localStorage.setItem('royalZariPrices', JSON.stringify(productPrices));

    // Update the corresponding product card price
    const productCard = document.querySelector(`[data-product-name*="${productImageName}"]`) ||
                       document.querySelector(`img[alt*="${productImageName}"]`)?.closest('.product-card');

    if (productCard) {
        // Update data attribute
        productCard.setAttribute('data-product-price', newPrice);

        // Update displayed price
        const priceElement = productCard.querySelector('.price');
        if (priceElement) {
            priceElement.textContent = '₹' + parseInt(newPrice).toLocaleString();
        }

        // Update cart if this product is in cart
        updateCartPrices();
    }

    showNotification(`Price updated to ₹${parseInt(newPrice).toLocaleString()}`, 'success');
}

// Load saved prices on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedPrices();
});

function loadSavedPrices() {
    const savedPrices = JSON.parse(localStorage.getItem('royalZariPrices')) || {};

    // Update price inputs with saved values
    Object.keys(savedPrices).forEach(productKey => {
        const input = document.getElementById(`price-${productKey}`);
        if (input) {
            input.value = savedPrices[productKey];
        }

        // Update product cards with saved prices
        const productCard = document.querySelector(`[data-product-name*="${productKey}"]`) ||
                           document.querySelector(`img[alt*="${productKey}"]`)?.closest('.product-card');

        if (productCard) {
            productCard.setAttribute('data-product-price', savedPrices[productKey]);
            const priceElement = productCard.querySelector('.price');
            if (priceElement) {
                priceElement.textContent = '₹' + savedPrices[productKey].toLocaleString();
            }
        }
    });
}

function updateCartPrices() {
    // Update cart items with new prices
    cart.forEach(item => {
        const productCard = document.querySelector(`[data-product-id="${item.id}"]`);
        if (productCard) {
            const currentPrice = productCard.getAttribute('data-product-price');
            if (currentPrice && currentPrice !== item.price.toString()) {
                item.price = parseInt(currentPrice);
            }
        }
    });

    // Save updated cart
    localStorage.setItem('royalZariCart', JSON.stringify(cart));

    // Update cart UI
    updateCartUI();
}

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
