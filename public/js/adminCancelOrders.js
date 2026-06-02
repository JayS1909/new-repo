// script.js
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
        const cancelOrders = orders.filter(order => order.shipmentStatus.status === "Not Picked" || order.shipmentStatus.status === "Cancelled");

        if (cancelOrders.length === 0) {
            ordersContainer.innerHTML = "<p>No canceled orders found</p>";
            return;
        }

        cancelOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        cancelOrders.forEach(order => {
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

            const totalsRow = document.createElement("div");
            totalsRow.classList.add("totals-row");
            totalsRow.innerHTML = `
                <strong>Total Quantity:</strong> ${totalQuantity} | 
                <strong>Total Price:</strong> ${(order.amount / 100).toFixed(2)}
            `;
            lineItemsSection.appendChild(totalsRow);
            orderCard.appendChild(lineItemsSection);

            // Refund button
            const refundButton = document.createElement("button");
            refundButton.classList.add("refund-button");
            refundButton.textContent = order.refund && order.refund.status === "Initiated" 
                ? "Refund Initiated, stock updated" 
                : "Refund not initiated, stock not updated";
            refundButton.style.backgroundColor = order.refund && order.refund.status === "Initiated" 
                ? "grey" 
                : "green";
            refundButton.disabled = order.refund && order.refund.status === "Initiated";

            orderCard.appendChild(refundButton);

            refundButton.addEventListener("click", async() => {
                try {
                    refundButton.disabled = true;
                    refundButton.textContent = "Processing...";

                    const response = await fetch("/api/initiate-refund", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            orderId: order.orderId,
                            waybill: order.waybill,
                            refundStatus: "Initiated",
                        }),
                    });

                    if(!response.ok) {
                        throw new Error("Failed to initiate refund");
                    }
                    const result = await response.json();
                } catch (error) {
                    console.error("Error initiating refund:", error);
                }
            });
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
