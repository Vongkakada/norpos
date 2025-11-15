// src/components/ReceiptModal.jsx
import React from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg"; // QR image URL
import logo from "../assets/logo.png";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  if (!show) return null;

  const now = new Date();
  const subtotalKHR = order.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  const totalKHR = subtotalKHR;

  // ---------------------------
  // RawBT print (Android)
  // ---------------------------
  const handlePrintRawBT = () => {
    // Build plain text receipt
    let text = `${shopName}\n`;
    text += `${SHOP_STATIC_DETAILS.address}\n`;
    text += `Tel: ${SHOP_STATIC_DETAILS.tel}\n`;
    text += `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n`;
    text += `Invoice: ${orderId}\n`;
    text += "------------------------\n";

    order.forEach((item) => {
      text += `${item.khmerName} (${item.englishName || ""})\n`;
      text += `Qty:${item.quantity}  ${KHR_SYMBOL}${formatKHR(
        (item.priceKHR || item.priceUSD) * item.quantity
      )}\n`;
    });

    text += "------------------------\n";
    text += `Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}\n`;
    text += "------------------------\n";
    text += "សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!\n\n";

    // QR code URL (RawBT can print URL as QR)
    const qrData = `ORDER_ID:${orderId};TOTAL:${totalKHR};SHOP:${shopName}`;
    const qrUrl = encodeURIComponent(qrData); // or use static image URL

    // Send to RawBT
    window.location.href = `rawbt://print?text=${encodeURIComponent(
      text
    )}&qr=${qrUrl}`;
  };

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <div className="receipt-preview">
          {/* Optional: Preview inside app */}
          <div className="receipt-logo">
            <img src={logo} alt="logo" style={{ width: 80 }} />
          </div>
          <p>{shopName}</p>
          <p>{SHOP_STATIC_DETAILS.address}</p>
          <p>Tel: {SHOP_STATIC_DETAILS.tel}</p>
          <p>
            Date: {now.toLocaleDateString()} {now.toLocaleTimeString()}
          </p>
          <p>Invoice: {orderId}</p>
          <hr />
          {order.map((item, i) => (
            <div key={i}>
              <p>
                {item.khmerName} ({item.englishName || ""}) x {item.quantity}
              </p>
              <p>
                {KHR_SYMBOL}
                {formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}
              </p>
            </div>
          ))}
          <hr />
          <p>
            Total: {KHR_SYMBOL}
            {formatKHR(totalKHR)}
          </p>
          <img src={qrcode} alt="QR" style={{ width: 80 }} />
          <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
        </div>

        <div className="print-button-container">
          <button className="btn-close-receipt" onClick={onClose}>
            បោះបង់
          </button>
          <button className="btn-print" onClick={handlePrintRawBT}>
            បោះពុម្ពវិក្កយបត្រ
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
