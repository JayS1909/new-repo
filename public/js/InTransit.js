document.addEventListener("DOMContentLoaded", async () => {
    const ordersContainer = document.getElementById("ordersContainer");
    const loadingSpinner = document.getElementById("loadingSpinner");

    loadingSpinner.style.display = "block"; // Show loading spinner

    try {
        const response = await fetch("/api/display-orders");

        if (!response.ok) {
            throw new Error("Failed to fetch orders");
        }

        const orders = await response.json();

        // Filter for orders with status 'pending'
        const In_Transit = orders.filter(order => order.shipmentStatus.status === "In Transit");

        if (In_Transit.length === 0) {
            ordersContainer.innerHTML = "<p>No orders dispateched</p>";
            return;
        }

        // Sort pending orders by createdAt (newest first)
        In_Transit.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        In_Transit.forEach(order => {
            let totalQuantity = 0;

            // Create order card
            const orderCard = document.createElement("div");
            orderCard.classList.add("order-card");

            // Order header
            const orderHeader = document.createElement("div");
            orderHeader.classList.add("order-header");
            orderHeader.innerHTML = `
                <h2>Order ID: ${order.orderId}</h2>
                <button class="toggle-button">View Items</button>
            `;
            orderCard.appendChild(orderHeader);

            // Order details section
            const orderDetails = document.createElement("div");
            orderDetails.classList.add("order-details");
            orderDetails.innerHTML = `
                <p><strong>Customer Name:</strong> ${order.customer_details.shippingAddress.name}</p>
                <p><strong>Razorpay Receipt Id:</strong> ${order.razorpay_receipt_id}
                <p><strong>Internal Receipt Id:</strong> ${order.internal_receipt_id}</p>
                <p><strong>Email:</strong> ${order.customer_details.email}</p>
                <p><strong>Contact No:</strong> ${order.customer_details.contact}</p>
                <p><strong>Shipping Address:</strong> ${order.customer_details.shippingAddress.line1}, 
                    ${order.customer_details.shippingAddress.line2}, 
                    ${order.customer_details.shippingAddress.city}, 
                    ${order.customer_details.shippingAddress.state}, 
                    ${order.customer_details.shippingAddress.zipcode}</p>
                <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            `;
            orderCard.appendChild(orderDetails);

            // Line items section
            const lineItemsSection = document.createElement("div");
            lineItemsSection.classList.add("line-items");

            // Line items header
            const lineItemsHeader = document.createElement("div");
            lineItemsHeader.innerHTML = `
                <div class="line-item">
                    <span class="line-item-header">Item</span>
                    <span class="line-item-header">Size</span>
                    <span class="line-item-header">Quantity</span>
                    <span class="line-item-header">Price</span>
                </div>
            `;
            lineItemsSection.appendChild(lineItemsHeader);

            // Line items
            order.lineItems.forEach(item => {
                totalQuantity += item.quantity;
                const itemRow = document.createElement("div");
                itemRow.classList.add("line-item");
                itemRow.innerHTML = `
                    <span>${item.name}</span>
                    <span>${item.notes.Size}</span>
                    <span>${item.quantity}</span>
                    <span>${(item.offer_price / 100).toFixed(2)}</span>
                `;
                lineItemsSection.appendChild(itemRow);
            });

            // Totals row
            const totalsRow = document.createElement("div");
            totalsRow.classList.add("totals-row");
            totalsRow.innerHTML = `
                <strong>Total Quantity:</strong> ${totalQuantity} | 
                <strong>Total Price:</strong> ${(order.amount / 100).toFixed(2)}
            `;
            lineItemsSection.appendChild(totalsRow);

            // Append line items section to card
            orderCard.appendChild(lineItemsSection);
            
            // Append card to container
            ordersContainer.appendChild(orderCard);

            // Toggle visibility of line items
            orderHeader.querySelector(".toggle-button").addEventListener("click", () => {
                const isVisible = lineItemsSection.style.display === "block";
                lineItemsSection.style.display = isVisible ? "none" : "block";
                orderHeader.querySelector(".toggle-button").textContent = isVisible ? "View Items" : "Hide Items";
            });
        });
        
        loadingSpinner.style.display = "none"; // Hide loading spinner after data is fetched
    } catch (error) {
        console.error("Error fetching orders:", error);
        ordersContainer.innerHTML = "<p>Error loading orders</p>";
        loadingSpinner.style.display = "none"; // Hide spinner on error
    }
});
