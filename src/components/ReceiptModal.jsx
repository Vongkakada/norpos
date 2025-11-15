// src/components/ReceiptModal.jsx
import React, { useRef, useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import qrcode from '../assets/qrcode.jpg';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, exchangeRate, shopName }) {
    const receiptRef = useRef(null);

    useEffect(() => {
        const cleanup = () => {
            const el = receiptRef.current;
            if (el) {
                el.style.transform = '';
                el.style.transformOrigin = '';
                el.style.width = '';
            }
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        return () => window.removeEventListener('afterprint', cleanup);
    }, []);

    if (!show) return null;

    const now = new Date();
    const subtotalKHR = order.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
        0
    );
    const totalKHR = subtotalKHR;

    const safeShopNameForQR = shopName.replace(/\s+/g, '_');
    const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
    const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`;

    // ---------------------------
    // Smart Print (Android + PC)
    // ---------------------------
    const handleSmartPrint = () => {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const el = receiptRef.current;

        if (isAndroid) {
            // --- Android → RawBT ---
            try {
                const rawbtWindow = window.open("rawbt:print", "_blank");
                rawbtWindow.document.write(`
                    <html>
                        <body>${el.innerHTML}</body>
                    </html>
                `);
                rawbtWindow.document.close();
            } catch (e) {
                alert("⚠ RawBT មិនទាន់ដំឡើងនៅលើទូរស័ព្ទ! សូមដំឡើង RawBT មុន។");
            }
            return;
        }

        // --- PC / Other → Normal Print ---
        handlePrint();
    };

    // ---------------------------
    // PC Print (window.print)
    // ---------------------------
    const handlePrint = () => {
        const el = receiptRef.current;
        if (el) {
            const mmToPx = 3.7795275591;
            const pageHeightMm = 297;
            const pageMarginMm = 10;
            const printableHeightPx = (pageHeightMm - pageMarginMm * 2) * mmToPx;
            const contentHeight = el.scrollHeight;
            const scale = Math.min(1, printableHeightPx / contentHeight);

            if (scale < 1) {
                el.style.transformOrigin = 'top left';
                el.style.transform = `scale(${scale})`;
                el.style.width = `${80 / scale}mm`;
            } else {
                el.style.width = '70mm';
                el.style.transform = '';
                el.style.transformOrigin = '';
            }
        }

        const handleAfterPrint = () => {
            try {
                if (el) {
                    el.style.transform = '';
                    el.style.transformOrigin = '';
                    el.style.width = '';
                }
                if (typeof onClose === 'function') onClose();
            } finally {
                window.removeEventListener('afterprint', handleAfterPrint);
            }
        };

        window.addEventListener('afterprint', handleAfterPrint);
        window.print();
    };

    return (
        <div className="modal show" id="receiptModal">
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>×</span>

                <div className="receipt-print-area" ref={receiptRef}>
                    <div className="receipt-logo-top">
                        <img src={logo} className="receipt-logo" alt="logo" />
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
                            {order.map((item, i) => (
                                <tr key={i}>
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
                            <span>{KHR_SYMBOL}{formatKHR(subtotalKHR)}</span>
                        </div>

                        <div className="receipt-divider"></div>

                        <div className="receipt-summary-line total">
                            <span>សរុប ({KHR_SYMBOL}):</span>
                            <span>{KHR_SYMBOL}{formatKHR(totalKHR)}</span>
                        </div>
                    </div>

                    <div className="receipt-qr-code">
                        <p style={{ fontSize: "0.8em", marginBottom: "5px" }}>
                            សូមស្កេនដើម្បីទូទាត់ ឬមើលព័ត៌មានបន្ថែម
                        </p>
                        <img src={qrCodeUrl} alt="QR" />
                    </div>

                    <div className="receipt-footer">
                        <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
                    </div>
                </div>

                <div className="print-button-container">
                    <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
                    <button className="btn-print" onClick={handleSmartPrint}>
                        បោះពុម្ពវិក្កយបត្រ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptModal;
