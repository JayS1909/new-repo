function onClickMenu() {
    var menu = document.getElementById("menu");
    var nav = document.getElementById("nav");
    var overlay = document.getElementById("Nav-overlay");

    menu.classList.toggle("icon");
    nav.classList.toggle("change");

    if (nav.classList.contains("change")) {
        document.getElementById("mySideNav").style.width = "250px";
        overlay.style.display = "block";  
    } else {
        overlay.style.display = "none";
        document.getElementById("mySideNav").style.width = "0";
    }
}

function closeNav() {
    document.getElementById("menu").classList.remove("icon");
    document.getElementById("nav").classList.remove("change");
    document.getElementById("mySideNav").style.width = "0";
    document.getElementById("Nav-overlay").style.display = "none";
}

document.addEventListener('click', function(event) {
    var nav = document.getElementById('nav');
    var menu = document.getElementById('menu');
    var overlay = document.getElementById('Nav-overlay');
    var isClickInsideNav = nav.contains(event.target);
    var isClickInsideMenu = menu.contains(event.target);

    if (!isClickInsideNav && !isClickInsideMenu && overlay.style.display === 'block') {
        closeNav();
    }
});

// The above code is for the search icon 
const searchOverlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-input');
const closeIcon = document.getElementById('close-icon');

function onClickSearch() {
    
   // const relatedSearchesContainer = document.getElementById('related-searches');

    document.getElementById('search-icon').addEventListener('click',()=> {
        searchOverlay.classList.add('active');
        searchInput.focus();
    });

    closeIcon.addEventListener('click', closeSearchOverlay);

    searchOverlay.addEventListener('click',(event) =>{
        if (event.target === searchOverlay){
            closeSearchOverlay();
        }
    });

    searchInput.addEventListener('input', ()=> {
        const query = searchInput.value.toLowerCase();
        showRelatedSearches(query);
    });
}

function closeSearchOverlay() {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
}


// The above code is for the login and signup side nav

function openLogin() {
    document.getElementById("sideLoginNav").style.width = "400px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeLogin() {
    document.getElementById("sideLoginNav").style.width = "0";
    document.body.style.backgroundColor = "white";
}

function toggleForm(formId) {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (formId === 'signupForm') {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
    } else {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
    }
}


// NEW JS
function toggleProfileMenu() {
    const profileMenu = document.getElementById("profileMenu");
    profileMenu.classList.toggle("hidden"); // Toggle hidden class
}

// function toggleProfileMenu() {
//     const profileMenu = document.getElementById('profileMenu');
//     if (profileMenu.style.display === 'block') {
//         profileMenu.style.display = 'none';
//     } else {
//         profileMenu.style.display = 'block';
//     }
// }

function logout(event) {
    event.preventDefault();
    fetch('/users/logout', {
        method: 'POST',
        credentials: 'include' // Ensure cookies are sent with the request
    }).then(response => {
        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('Logout failed');
        }
    });
}

// CART
// JS
document.addEventListener('DOMContentLoaded', () => {
    const cartToggle = document.getElementById('cart-toggle');
    const cartPanel = document.getElementById('cart-panel');
    const cartClose = document.getElementById('cart-close');
    const cartItemsContainer = document.getElementById('cart-items');
    const overlay = document.getElementById('overlay');
    const cartTotal = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-btn');
    const cartFooter = document.getElementById('cart-panel-footer');

    cartToggle.addEventListener('click', async () => {
        cartPanel.classList.toggle('open');
        overlay.classList.add('visible');
        if (cartPanel.classList.contains('open')) {
            await fetchCartItems();
        }
    });

    cartClose.addEventListener('click', () => {
        cartPanel.classList.remove('open');
        overlay.classList.remove('visible');
    });

    document.addEventListener('click', (event) => {
        if (cartPanel.classList.contains('open') && !cartPanel.contains(event.target) && !cartToggle.contains(event.target)) {
            cartPanel.classList.remove('open');
            overlay.classList.remove('visible');
        }
    });

    // Prevent clicks inside the cart panel from closing it
    cartPanel.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Prevent clicks inside the toggle button from closing the cart panel
    cartToggle.addEventListener('click', (event) => {
        event.stopPropagation();
    });


    async function fetchCartItems() {
        try {
            const response = await fetch('/api/cart');
            if (!response.ok) {
                throw new Error('Failed to fetch cart items');
            }
            const cartItems = await response.json();
            // alert("Length: " + cartItems.products.length);
            displayCartItems(cartItems);
            calculateTotal(cartItems.subTotal);
        } catch (error) {
            console.error('Error fetching cart items: ', error);
        }
    }
    let totalAmount=0;
    function calculateTotal(amount) {
        totalAmount = amount;
    }
    
    function displayCartItems(cart) {
        cartItemsContainer.innerHTML = '';
        let newCartTotal = cart.subTotal;  // Use backend-calculated subtotal
        if (!cart.products || cart.products.length === 0) {
            cartFooter.style.display = 'none';  // Disable checkout button when the cart is empty
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <h2>Your cart is empty</h2>
                    <p>It looks like you haven't added anything to your cart yet.</p>
                    <p>Browse our products and add your favorites!</p>
                </div>
             `;
        } else {
            cartFooter.style.display = 'block';  // Enable checkout button when there are items
            cart.products.forEach(item => {
                const cartItem = document.createElement('li');
                cartItem.classList.add('cart-item');
                cartItem.dataset.id = item._id;
    
                const product = item.product || item.productId;
    
                const productUrl = `/product/${product._id}`;
    
                cartItem.innerHTML = `
                    <a href="${productUrl}" class="cart-item-link">
                        <img src='${product.images[0]}' alt="${product.productName}" class="cart-item-image">
                    </a>
                    <div class="cart-item-details">
                        <div class="cart-item-remove">
                            <button class="cart-item-remove-btn">
                                <i class="fas fa-trash-alt"></i> 
                            </button>
                        </div>
                        <div class="name-remove">
                            <a href="${productUrl}" class="cart-item-link">
                                <p class="cart-item-name">${product.productName}</p>
                            </a>
                        </div>
                        <p class="cart-item-size">Size: ${item.size}</p>
                        <div class="cart-item-quantity">
                            <button class="pill-shaped quantity-decrease">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="pill-shaped quantity-increase">+</button>
                            <div class="cart-item-price">
                                <p>Rs. <span class="item-total-price">${product.discountedPrice}</span></p>
                                <div class="loader" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                `;
    
                const quantityValue = cartItem.querySelector('.quantity-value');
                const quantityDecreaseButton = cartItem.querySelector('.quantity-decrease');
                const quantityIncreaseButton = cartItem.querySelector('.quantity-increase');
                const itemTotalPrice = cartItem.querySelector('.item-total-price');
                const removeButton = cartItem.querySelector('.cart-item-remove');
                const loader = cartItem.querySelector('.loader');
    
                quantityDecreaseButton.addEventListener('click', async () => {
                    loader.style.display = 'inline-block';
                    await updateQuantity(item._id, parseInt(quantityValue.textContent) - 1,loader);
                });
    
                quantityIncreaseButton.addEventListener('click', async () => {
                    loader.style.display = 'inline-block';
                    await updateQuantity(item._id, parseInt(quantityValue.textContent) + 1,loader);
                });
    
                removeButton.addEventListener('click', async () => {
                    loader.style.display = 'inline-block'
                    await removeCartItem(item._id,loader);
                });
    
                cartItemsContainer.appendChild(cartItem);
            });
        }
    
        cartTotal.textContent = newCartTotal.toFixed(2);  // Display backend-calculated subtotal
    }
    

    async function updateQuantity(itemId, newQuantity) {
        if (newQuantity < 1) return;  // Prevent quantities less than 1
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });
    
            // if (!response.ok) {
            //     const result = await response.json();
            //     if (result.message.startsWith("You cannot add more than")) {
            //         alert(result.message);
            //     }
            //     throw new Error('Failed to update quantity');
            // }

            if(!response.ok) {
                throw new Error('Failed to update quantity');
            }
            const result = await response.json();
            if(result.message.startsWith("You cannot add more than")) {
                alert(result.message);
            }    
            // Refetch the updated cart items after quantity change
            await fetchCartItems();
    
        } catch (error) {
            console.error('Error updating quantity: ', error);
        } finally {
            loader.style.display = 'none'
        }
    }
    
    async function removeCartItem(itemId) {
        try {
            await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE',
            });
    
            // Refetch the updated cart items after removal
            await fetchCartItems();
        } catch (error) {
            console.error('Error removing item from cart: ', error);
        } finally {
            loader.style.display = 'none';  // Hide loader after response
        }
    }
    
});

const generateReceiptId = () => {
    // Get the current timestamp in milliseconds
    const financialYear = new Date().getFullYear();
    const timestamp = Date.now();

    // Add a random 4-digit number to ensure uniqueness
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); 

    return `VIN_${financialYear}_${timestamp}_${randomSuffix}`;
};

document.getElementById('checkout-btn').addEventListener('click',async () => {
    try {
        await fetchCartItems1();
        // totalAmount = checkoutSubTotal;
        const response = await fetch('/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Amount in INR (replace with actual amount)
                currency: 'INR',
                receipt: generateReceiptId(),
                cartItems: cartItems,
            }),
        });

        if(!response.ok) {
            if (response.status === 429) {
                // Show an alert for too many requests
                alert("You have made too many requests. Please wait a while before trying again.");
            } else {
                console.log("Error occured here");
                throw new Error(`Error: ${response.statusText}`);
            }
            
        } 

        const data = await response.json();
        if (data.success) {
            const options = {
                key: 'rzp_live_ufwo3uwhKOHyBq', //Replace with your Razorpay Key ID
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'EXTRAALAYER',
                description: '',
                order_id: data.order.id,
                one_click_checkout: true,
                show_coupons: true,
                force_cod: true,
                callback_url: "https://www.extraalayer.com/",
                handler: async function (response) {
                    // After successful payment, verify the payment on the backend
                    showLoader("Verifying payment and redirecting...")
                    const verificationResponse = await fetch('/verify-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });
                    if(verificationResponse.ok) {
                        window.location.href = '/';
                    } else {
                        console.error('Payment verification failed');
                        hideLoader();
                    }
                },
                "theme": {
                    "color": "00000"
                },
                
            };
            const rzp1 = new Razorpay(options);
            rzp1.open();
        } 
    } catch (error) {
        console.error('Error during payment:', error);
    }
});
let cartItems={};
async function fetchCartItems1() {
    try {
        const response = await fetch('/api/cart');
        if (!response.ok) {
            throw new Error('Failed to fetch cart items');
        }
        cartItems = await response.json();
        checkoutSubTotal = cartItems.subTotal;

        // alert("Length: " + cartItems.products.length);
    } catch (error) {
        console.error('Error fetching cart items: ', error);
    }
}

function viewOrders() {
    window.location.href = "/displayAuthOrders";
}


//drop dwon menu
function toggleDropdown() {
    const dropdown = document.getElementById('profileMenu');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Close dropdown when clicking outside
window.addEventListener('click', function (event) {
    if (!event.target.closest('.profile')) {
        const dropdown = document.getElementById('profileMenu');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
});

function showLoader(message = "Loading...") {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.position = 'fixed';
    loader.style.top = '0';
    loader.style.left = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.background = 'rgba(0, 0, 0, 0.5)';
    loader.style.color = 'white';
    loader.style.display = 'flex';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.zIndex = '1000';
    loader.innerHTML = `
        <div style="text-align: center;">
            <div style="border: 5px solid #f3f3f3; border-radius: 50%; border-top: 5px solid #3498db; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 10px;">${message}</p>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>`;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        document.body.removeChild(loader);
    }
}
