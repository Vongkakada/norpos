// src/components/OrderItemEntry.jsx
import React from 'react';
import { USD_SYMBOL, KHR_SYMBOL, formatUSD, formatKHR } from '../utils/formatters';

function OrderItemEntry({ item, onUpdateQuantity }) {
    const itemTotalUSD = item.priceUSD * item.quantity;

    return (
        <div className="order-item-entry">
            <div className="order-item-details">
                <span className="order-item-name">{item.khmerName}</span>
                <span className="order-item-price-single">
                    {USD_SYMBOL}{formatUSD(item.priceUSD)} / {KHR_SYMBOL}{formatKHR(item.priceKHR)}
                </span>
            </div>
            <div className="order-item-controls">
                <button onClick={() => onUpdateQuantity(item.khmerName, -1)}>-</button>
                <span className="order-item-qty">{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.khmerName, 1)}>+</button>
            </div>
            <span className="order-item-total-price">{USD_SYMBOL}{formatUSD(itemTotalUSD)}</span>
        </div>
    );
}

export default OrderItemEntry;