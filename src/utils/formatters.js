// src/utils/formatters.js
export const USD_SYMBOL = '$';
export const KHR_SYMBOL = '៛';

export function formatKHR(amount) {
    const n = Number(amount);
    if (!isFinite(n)) return '';
    return Math.round(n).toLocaleString('km-KH');
}

export function formatUSD(amount) {
    const n = Number(amount);
    if (!isFinite(n)) return '0.00';
    return n.toFixed(2);
}