document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch orders from the server
        const response = await fetch("/api/auth-display-orders");

        if (!response.ok) {
            throw new Error("Failed to fetch orders");
        }

        // Parse the response JSON
        const { orders } = await response.json();
        // Display orders on the page
        displayOrders(orders);

    } catch (error) {
        console.error("Error fetching orders:", error);
    }
});

// Helper function to format dates to dd/mm/yyyy
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to display order list
function displayOrders(orders) {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = ''; // Clear the list

    if (!orders || orders.length === 0) {
        // Show a "No Orders" message
        orderList.innerHTML = `
           <div class="no-orders">
                <img src="/images/empty shopping.webp" alt="Start Your Shopping Journey" class="no-orders-image">
                <h2 class="no-orders-title">Your Next Adventure Awaits!</h2>
                <p class="no-orders-message">Looks like your shopping cart hasn't been filled with treasures yet. Explore our collection and let your style shine!</p>
                <a href="/" class="button">Discover Now</a>
            </div>
        `;
        return;
    }

    // Iterate over each order
    orders.forEach(order => {
        // Create a container for this order
        const orderContainer = document.createElement('div');
        orderContainer.className = 'order-card';

        // Add order header with shared order details
        const orderHeader = `
            <div class="order-header">
                <div>Order ID: <span class="order-id">${order.orderId}</span></div>
                <div>Ordered on: <span class="order-date">${formatDate(order.createdAt)}</span></div>
                <div>Total: ₹<span class="order-total">${(order.amount_paid / 100).toFixed(2)}</span></div>
            </div>
        `;

        // Generate rows for each line item in the order
        const orderItems = order.lineItems.map(lineItem => `
            <div class="order-row" onclick="showOrderDetails(${JSON.stringify(order)}, ${JSON.stringify(lineItem)})">
                <img src="${lineItem.image_url}" alt="Product Image">
                <div class="order-info">
                    <div class="order-name">${lineItem.name}</div>
                    <div class="order-quantity">Quantity: ${lineItem.quantity}</div>
                    <div class="order-size">Size: ${lineItem.notes.Size || 'N/A'}</div>
                </div>
            </div>
        `).join('');

        const actionButtons = `
        <div class="order-actions">
            <button class="button" onclick="trackOrder()">Track Order</button>
            <button class="button" onclick="openIframePopup('${order.orderId}')">Cancel Order</button>
        </div>
    `;

        // Combine header and items
        orderContainer.innerHTML = orderHeader + `<div class="order-items">${orderItems}</div>` + actionButtons;
        orderList.appendChild(orderContainer);
    });
}

function openIframePopup(orderId) {
    const iframe = document.getElementById('iframePopup');
    const overlay = document.getElementById('iframeOverlay');

    iframe.src = `/cancelOrder?orderId=${orderId}`; // Pass the order ID if needed
    overlay.style.display = 'block';
}

function closeIframePopup(event) {
    if (event) event.stopPropagation(); // Prevent click from bubbling to overlay

    const iframe = document.getElementById('iframePopup');
    const overlay = document.getElementById('iframeOverlay');

    iframe.src = ''; // Clear the iframe source
    overlay.style.display = 'none';
}

// Function to show order details in a modal
function showOrderDetails(order) {
    const modal = document.getElementById('orderModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = `
        <h3>${order.lineItems[0].name}</h3>
        <p>Order ID: ${order.orderId}</p>
        <p>Order Date: ${formatDate(order.createdAt)}</p>
        <p>Date Received: ${formatDate(order.createdAt)}</p>
        <p>Total Amount: ₹${(order.amount_paid / 100).toFixed(2)}</p>
        <button class="button" onclick="buyAgain()">Invoice</button>
        <button class="button" onclick="downloadInvoice()">Return/Exchange</button>
    `;

    modal.style.display = 'flex'; // Show modal
}

// Function to close the modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Placeholder functions for Buy Again and Download Invoice


function trackOrder() {
    window.location.href = '/tracking';
}
