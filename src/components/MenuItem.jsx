// src/components/MenuItem.js
import React from 'react';
import { USD_SYMBOL, KHR_SYMBOL, formatUSD, formatKHR } from '../utils/formatters';

function MenuItem({ item, onAddItemToOrder }) {
    return (
        <div className="menu-item" onClick={() => onAddItemToOrder(item)}>
            <div className="item-icon">{item.icon || '☕️'}</div>
            <div className="item-name-km">{item.khmerName}</div>
            <div className="item-name-en">{item.englishName || ''}</div>
            <div>
                <div className="item-price-usd">{USD_SYMBOL}{formatUSD(item.priceUSD)}</div>
                <div className="item-price-khr">{KHR_SYMBOL}{formatKHR(item.priceKHR)}</div>
            </div>
        </div>
    );
}

export default MenuItem;