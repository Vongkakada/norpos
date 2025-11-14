// src/components/ReceiptModal.jsx
import React from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import qrcode from '../assets/qrcode.jpg'; // Assuming you have a CSS file for styling
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, exchangeRate, /* taxRate, */ shopName }) { // << លុប taxRate
    if (!show) return null;

    const now = new Date();
    const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
    // const taxKHR = subtotalKHR * taxRate; // tax removed
    const totalKHR = subtotalKHR; // already in KHR

    const safeShopNameForQR = shopName.replace(/\s+/g, '_');
    const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
    const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`; // Assuming you have a QR code image

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal show" id="receiptModal">
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>×</span>
                <div className="receipt-print-area">
                    <div className="receipt-logo-top">
                        <img src={logo} alt="Logo" className="receipt-logo" />
                    </div>
                    <div className="receipt-header">
                        <h3>{shopName}</h3>
                        <p>{SHOP_STATIC_DETAILS.address}</p>
                        <p>Tel: {SHOP_STATIC_DETAILS.tel}</p>
                        <p>កាលបរិច្ឆេទ: {now.toLocaleDateString('km-KH')} {now.toLocaleTimeString('km-KH')}</p>
                        <p>លេខវិក្កយបត្រ: {orderId}</p>
                    </div>
                    <div className="receipt-divider"></div>
                    <table className="receipt-items-table">
                        <thead>
                            <tr>
                                <th>មុខទំនិញ</th>
                                <th>ចំនួន</th>
                                <th>សរុប ({KHR_SYMBOL})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.map(item => (
                                <tr key={item.khmerName + (item.priceKHR || item.priceUSD || 0)}>
                                    <td>{item.khmerName} ({item.englishName || ''})</td>
                                    <td>{item.quantity}</td>
                                    <td>{KHR_SYMBOL}{formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="receipt-divider"></div>
                    <div className="receipt-summary">
                        <div className="receipt-summary-line">
                            <span>សរុបរង:</span>
                            <span>
                                {KHR_SYMBOL}{formatKHR(subtotalKHR || 0)}
                            </span>
                        </div>
                        <div className="receipt-divider"></div>
                        <div className="receipt-summary-line total">
                            <span>សរុប ({KHR_SYMBOL}):</span>
                            <span>{KHR_SYMBOL}{formatKHR(totalKHR || 0)}</span>
                        </div>
                    </div>
                    <div className="receipt-qr-code">
                        <p style={{fontSize:'0.8em', marginBottom:'5px', fontFamily: 'var(--font-family)'}}>សូមស្កេនដើម្បីទូទាត់ ឬមើលព័ត៌មានបន្ថែម</p>
                        <img src={qrCodeUrl} alt="QR Code" />
                    </div>
                    <div className="receipt-footer">
                        <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
                    </div>
                </div>
                <div className="print-button-container">
                    <button className="btn-print" onClick={handlePrint}>បោះពុម្ពវិក្កយបត្រ</button>
                    <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptModal;