// src/components/OrderPanel.jsx
import React from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import { generateReceiptImage } from '../utils/receiptGenerator';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    onProcessPayment,
    exchangeRate,
    shopName = "ហាងលក់ទំនិញ", // Default shop name
}) {
    const subtotalKHR = currentOrder.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
    const totalKHR = subtotalKHR;

    const handlePaymentWithPrint = async () => {
        try {
            // Show loading indicator (optional)
            const payButton = document.querySelector('.btn-pay');
            const originalText = payButton.textContent;
            payButton.textContent = 'កំពុងបង្កើត...';
            payButton.disabled = true;

            // Generate receipt image
            const blob = await generateReceiptImage({
                shopName,
                orderId,
                order: currentOrder,
                totalKHR,
            });

            // Create object URL
            const imageUrl = URL.createObjectURL(blob);

            // Send to RawBT app
            window.location.href = `rawbt:${imageUrl}`;

            // Clean up after delay
            setTimeout(() => {
                URL.revokeObjectURL(imageUrl);
                payButton.textContent = originalText;
                payButton.disabled = false;
            }, 3000);

            // Process payment (original function)
            onProcessPayment();

        } catch (error) {
            console.error('Error generating receipt:', error);
            alert('មានបញ្ហាក្នុងការបង្កើតវិក្កយបត្រ');
            
            // Still process payment even if print fails
            onProcessPayment();
        }
    };

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>
            <div className="current-order-items">
                {currentOrder.length === 0 ? (
                    <p className="empty-cart">មិនទាន់មានទំនិញក្នុងបញ្ជីទេ។</p>
                ) : (
                    currentOrder.map(item => (
                        <OrderItemEntry
                            key={item.khmerName + (item.priceKHR || item.priceUSD || 0)}
                            item={item}
                            onUpdateQuantity={onUpdateQuantity}
                        />
                    ))
                )}
            </div>
            <div className="order-summary">
                <div className="summary-line">
                    <span>សរុបរង (Subtotal):</span>
                    <span className="currency-value">
                        {KHR_SYMBOL}{formatKHR(subtotalKHR || 0)}
                    </span>
                </div>
                <div className="summary-line total order-total">
                    <span>សរុប (Total):</span>
                    <span className="currency-value">
                        {KHR_SYMBOL}{formatKHR(totalKHR || 0)}
                    </span>
                </div>
            </div>
            <div className="action-buttons">
                <button className="btn-clear" onClick={onClearOrder} disabled={currentOrder.length === 0}>
                    លុបការកម្ម៉ង់
                </button>
                <button className="btn-pay" onClick={handlePaymentWithPrint} disabled={currentOrder.length === 0}>
                    គិតលុយ
                </button>
            </div>
        </div>
    );
}

export default OrderPanel;