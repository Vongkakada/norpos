// src/components/OrderPanel.jsx
import React from 'react';
import OrderItemEntry from './OrderItemEntry';
import { USD_SYMBOL, KHR_SYMBOL, formatUSD, formatKHR } from '../utils/formatters';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    onProcessPayment,
    exchangeRate,
}) {
    const subtotalUSD = currentOrder.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);

    const totalUSD = subtotalUSD;

    const totalKHR = totalUSD * exchangeRate;

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>
            <div className="current-order-items">
                {currentOrder.length === 0 ? (
                    <p className="empty-cart">មិនទាន់មានទំនិញក្នុងបញ្ជីទេ។</p>
                ) : (
                    currentOrder.map(item => (
                        <OrderItemEntry
                            key={item.khmerName + item.priceUSD}
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
                        {USD_SYMBOL}{formatUSD(subtotalUSD)}
                        <span className="khr">{KHR_SYMBOL}{formatKHR(subtotalUSD * exchangeRate)}</span>
                    </span>
                </div>
                <div className="summary-line total">
                    <span>សរុប (Total):</span>
                    <span className="currency-value">
                        {USD_SYMBOL}{formatUSD(totalUSD)}
                        <span className="khr">{KHR_SYMBOL}{formatKHR(totalKHR)}</span>
                    </span>
                </div>
            </div>
            <div className="action-buttons">
                <button className="btn-clear" onClick={onClearOrder} disabled={currentOrder.length === 0}>
                    លុបការកម្ម៉ង់
                </button>
                <button className="btn-pay" onClick={onProcessPayment} disabled={currentOrder.length === 0}>
                    គិតលុយ
                </button>
            </div>
        </div>
    );
}

export default OrderPanel;