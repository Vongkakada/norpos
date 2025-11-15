// src/components/ReceiptModal.jsx
import React, { useRef } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg"; // QR image URL
import logo from "../assets/logo.png";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const receiptRef = useRef(null);

  if (!show) return null;

  const now = new Date();
  const subtotalKHR = order.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  const totalKHR = subtotalKHR;

  // ---------------------------
  // Convert receipt to image and print via RawBT
  // ---------------------------
  const handlePrintRawBT = async () => {
    try {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size for thermal printer (384px width is common for 58mm printers)
      const width = 384;
      const padding = 16;
      const lineHeight = 24;
      let currentY = padding;

      // Calculate required height
      const estimatedHeight = 
        80 + // logo
        lineHeight * 6 + // header info
        lineHeight * 2 + // dividers
        order.length * lineHeight * 2 + // items
        lineHeight * 2 + // total
        100 + // QR code
        lineHeight + // thank you
        padding * 2;

      canvas.width = width;
      canvas.height = estimatedHeight;

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);

      // Set default text style
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      // Load and draw logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.src = logo;
      });
      const logoSize = 60;
      ctx.drawImage(logoImg, (width - logoSize) / 2, currentY, logoSize, logoSize);
      currentY += logoSize + 8;

      // Shop name (bold)
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(shopName, width / 2, currentY);
      currentY += lineHeight;

      // Address and contact (regular)
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, currentY);
      currentY += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, currentY);
      currentY += lineHeight;

      // Date and Invoice
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(
        `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        width / 2,
        currentY
      );
      currentY += lineHeight;
      ctx.fillText(`Invoice: ${orderId}`, width / 2, currentY);
      currentY += lineHeight;

      // Divider line
      currentY += 8;
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      currentY += 12;

      // Order items
      ctx.textAlign = 'left';
      ctx.font = '13px Arial, sans-serif';
      
      order.forEach((item) => {
        const itemName = `${item.khmerName} (${item.englishName || ""})`;
        ctx.fillText(itemName, padding, currentY);
        currentY += lineHeight;
        
        const qtyPrice = `Qty:${item.quantity}  ${KHR_SYMBOL}${formatKHR(
          (item.priceKHR || item.priceUSD) * item.quantity
        )}`;
        ctx.fillText(qtyPrice, padding + 8, currentY);
        currentY += lineHeight;
      });

      // Bottom divider
      currentY += 8;
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      currentY += 16;

      // Total
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText(
        `Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`,
        width / 2,
        currentY
      );
      currentY += lineHeight + 8;

      // Divider
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      currentY += 16;

      // QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.src = qrcode;
      });
      const qrSize = 100;
      ctx.drawImage(qrImg, (width - qrSize) / 2, currentY, qrSize, qrSize);
      currentY += qrSize + 12;

      // Thank you message
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText('សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!', width / 2, currentY);

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png');
      const base64Data = imageData.split(',')[1];

      // Send to RawBT app with image
      window.location.href = `rawbt://print?image=${base64Data}`;
      
    } catch (error) {
      console.error('Error generating receipt image:', error);
      alert('មានបញ្ហាក្នុងការបង្កើតវិក្កយបត្រ / Error generating receipt');
    }
  };

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <div className="receipt-preview" ref={receiptRef}>
          {/* Preview inside app */}
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