document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.querySelector("#inventoryTable tbody");

    try {
        const response = await fetch("/api/admin/stock");
        if (!response.ok) {
            throw new Error("Failed to fetch stock data");
        }

        const products = await response.json();
        let grandTotal = 0; // Initialize grand total here

        products.forEach(product => {
            const row = document.createElement("tr");
            row.innerHTML += `<td>${product.productName}</td>`;
            row.innerHTML += `<td>${product.sku}</td>`;

            const sizeMap = new Map(product.sizes);
            let totalQuantity = 0; // Local total quantity for this product

            for (let size of ["XS", "S", "M", "L", "XL"]) {
                const quantity = sizeMap.get(size) || 0;
                totalQuantity += quantity;

                // Create a cell for this size
                const sizeCell = document.createElement("td");
                sizeCell.textContent = quantity;

                // Add low stock class if quantity is below a threshold (e.g., less than or equal to 5)
                if (quantity <= 5) {
                    sizeCell.classList.add("low-stock");
                }

                // Append the cell to the row
                row.appendChild(sizeCell);
            }

            // Append total quantity for this product
            row.innerHTML += `<td>${totalQuantity}</td>`;
            grandTotal += totalQuantity; // Update grand total
            tableBody.appendChild(row);
        });
        
        // Add a summary row for total quantities
        const summaryRow = document.createElement("tr");
        summaryRow.innerHTML = `<td colspan="2"><strong>Total Quantity:</strong></td>`;
        
        summaryRow.innerHTML += `<td colspan="6"><strong>${grandTotal}</strong></td>`;
        summaryRow.classList.add("summary-row");
        
        tableBody.appendChild(summaryRow);

    } catch (error) {
        console.error("Error loading stock data:", error);
        tableBody.innerHTML = "<tr><td colspan='8'>Failed to load data. Please try again later.</td></tr>";
    }
});