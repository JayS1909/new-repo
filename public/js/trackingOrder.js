async function trackShipment() {
    const trackingInput = document.getElementById('tracking-input').value.trim();
    const resultsDiv = document.getElementById('tracking-results');
    const errorDiv = document.getElementById('error-message');

    if (!trackingInput) {
        errorDiv.textContent = 'Please enter a tracking number';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        errorDiv.style.display = 'none';
        resultsDiv.innerHTML = 'Loading...';
        resultsDiv.style.display = 'block';

        const isWaybill = /^\d+$/.test(trackingInput);
        const queryParam = isWaybill ? `waybill=${trackingInput}` : `ref_ids=${trackingInput}`;
        
        const response = await fetch(`/api/getTrackingInfo?${queryParam}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch tracking information');
        }

        if (!data.trackingDetails || data.trackingDetails.length === 0) {
            resultsDiv.innerHTML = '<p>No tracking information found</p>';
            return;
        }

        resultsDiv.innerHTML = data.trackingDetails.map(shipment => `
            <div class="shipment">
                <!-- Header with Waybill and Status -->
                <div class="shipment-header">
                    <div>
                        <h2>Waybill: ${shipment.waybill}</h2>
                        <p>Reference: ${shipment.reference_no}</p>
                    </div>
                    <div class="status">${shipment.status}</div>
                </div>

                <!-- Organized Details Section -->
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Receivers Name:</div>
                        <div>${shipment.consignee.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Delivery Type</div>
                        <div>${shipment.order_type}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Dates</div>
                        <div>Pickup: ${formatDate(shipment.pickup_date)}</div>
                        <div>Expected Delivery: ${formatDate(shipment.expected_delivery_date) || 'Yet to be delivered'}</div>
                    </div>
                </div>

                <!-- Tracking Timeline -->
                <h3>Tracking Timeline</h3>
                <div class="timeline">
                    ${shipment.scans.map(scan => `
                        <div class="scan">
                            <strong>${formatDate(scan.scan_date)}</strong>
                            <p>${scan.scan_type}</p>
                            ${scan.instructions ? `<p><em>${scan.instructions}</em></p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-US', options);
}
