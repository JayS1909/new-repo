function changeMainImage(src) {
    document.getElementById('main-image').src = src;
}

function resetMainImage() {
    document.getElementById('main-image').src = originalImageSrc;
}

function addToCart() {
    alert("Product added to cart!");
}

function buyNow() {
    alert("Proceeding to checkout!");
}

// document.querySelectorAll('.size-buttons').forEach(button => {
//     button.addEventListener('click', () => {
//         // Remove active class from all buttons
//         document.querySelectorAll('.size-buttons').forEach(btn => btn.classList.remove('active'));
//         // Add active class to the clicked button
//         button.classList.add('active');
//     });
// });

// This 
// is 
// a code for 
// the accordion-content 
document.addEventListener('DOMContentLoaded', function() {
    const accordionToggles = document.querySelectorAll('.accordion-toggle');
    const accordionContents = document.querySelectorAll('.accordion-content');

    accordionToggles.forEach(function(toggle) {
        toggle.addEventListener('click',function() {
            const targetId = this.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);

            accordionContents.forEach(function(content) {
                content.classList.remove('active');
            });

            targetContent.classList.add('active');

            accordionToggles.forEach(function(item) {
                item.classList.remove('active');
            });

            this.classList.add('active');
        });
    });

    document.querySelector('.accordion-toggle[data-target="details"]').classList.add('active');
    document.getElementById('details').classList.add('active');
});


// This 
// is 
// a 
// javascript
// for 
// add to cart 
// functionality
const addToCartButton = document.getElementById('shimmerButton');
const cartToggle = document.getElementById('cart-toggle');
let selectedSize = null;
document.addEventListener('DOMContentLoaded', ()=> {
    
    const sizeButtons = document.querySelectorAll('.size-buttons .close');
    
    addToCartButton.disabled  = true;
    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            sizeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedSize = button.getAttribute('data-size');
            addToCartButton.disabled = false;
        });
    });
});

addToCartButton.addEventListener('click', async ()=> {
//    alert('Product ID: ' + productId);
   const quantity = 1;
   try {
    const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',  
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity,
            size: selectedSize
        })
    });
    if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
  
    const result = await response.json();
    if (result.message.startsWith("You cannot add more than")) {
        alert(result.message);
    }
      cartToggle.click();
    } catch (error) {
      console.error('Error adding product to cart:', error);
      if (error.response && error.response.text) {
        error.message = await error.response.text();
      }

    }
});


// document.addEventListener('DOMContentLoaded', function() {
//     const storedCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
//     const cartItems = document.getElementById('cart-items');

//     storedCartItems.forEach(cartItem1 => {
//         const cartItem = document.createElement('li');

//         cartItem.innerHTML = `
//             <img src="${cartItem1.productImage}" alt="${cartItem1.productName}" class="cart-item-image">
//             <div class="cart-item-details">
//                 <h4 class="cart-item-name">${cartItem1.productName}</h4>
//                 <p class="cart-item-size"><strong>Size:</strong> ${cartItem1.selectedSize}</p>
//                 <div class="cart-item-quantity">
//                     <button class="quantity-decrease">-</button>
//                     <span class="quantity-value">1</span>
//                     <button class="quantity-increase">+</button>
//                 </div>
//             </div>
//             <div class="cart-item-price">${cartItem1.productPrice}</div>
//         `;
//         cartItems.appendChild(cartItem);
//     });
// });
document.getElementById('cart-toggle').addEventListener('click', openCartPanel);
document.getElementById('cart-close').addEventListener('click', closeCartPanel);

// EVENT
// LISTENERS
// FOR
// INCREASE AND DECREASE
// BUTTONS



// JAVASCRIPT
// FOR 
// WISHLIST
// BUTTON

document.getElementById('wishlistButton').addEventListener('click', function() {
    const wishlistButton = document.getElementById('wishlistButton');
    const wishlistIcon = document.getElementById('wishlistIcon');

    if(!wishlistButton.classList.contains('added')) {
        wishlistButton.classList.add('added');
        wishlistIcon.classList.remove('far');
        wishlistIcon.classList.add('fas');
        alert('Added to Wishlist!')
    } else {
        wishlistButton.classList.remove('added');
        wishlistIcon.classList.remove('fas');
        wishlistIcon.classList.add('far');
        alert('Removed from Wishlist!');
    }
});


// JAVASCRIPT
// FOR 
// related
// PRODUCTS

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const images = card.querySelectorAll('.card-image');
        const dots = card.querySelectorAll('.dot');
        const defaultImage = card.querySelector('.card-image.active');

        function updateActiveImage(index) {
            images.forEach((img, i) => {
                img.classList.toggle('active', i === index + 1);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        card.addEventListener('mousemove', (e) => {
            const cardWidth = card.clientWidth;
            const mouseX = e.offsetX;

            let index = Math.floor(mouseX / cardWidth * (dots.length));
            if (index >= dots.length) index = dots.length - 1;

            updateActiveImage(index);
        });

        card.addEventListener('mouseleave', () => {
            images.forEach(img => img.classList.remove('active'));
            defaultImage.classList.add('active');
            dots.forEach(dot => dot.classList.remove('active'));
        });

        card.addEventListener('mouseenter', () => {
            defaultImage.classList.remove('active');
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                updateActiveImage(index);
            });
        });
    });
});


