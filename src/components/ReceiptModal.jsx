import React, { useRef } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import logo from "../assets/logo.png";
import qrcode from "../assets/qrcode.jpg"; // static QR

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

  const handleAndroidRawBTPrint = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 384; // 58mm printer typical width in px
      canvas.height = 600; // initial, can grow
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.font = "16px Arial";

      let y = 20;

      // Logo
      const logoImg = new Image();
      logoImg.src = logo;
      await new Promise((resolve) => {
        logoImg.onload = () => {
          const scale = 100 / logoImg.width;
          ctx.drawImage(logoImg, canvas.width / 2 - (logoImg.width * scale) / 2, y, logoImg.width * scale, logoImg.height * scale);
          y += logoImg.height * scale + 10;
          resolve(true);
        };
      });

      // Shop info
      ctx.font = "bold 16px Arial";
      ctx.fillText(shopName, 10, y);
      y += 20;
      ctx.font = "14px Arial";
      ctx.fillText(SHOP_STATIC_DETAILS.address, 10, y);
      y += 18;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, 10, y);
      y += 18;
      ctx.fillText(`Date: ${now.toLocaleDateString("km-KH")} ${now.toLocaleTimeString("km-KH")}`, 10, y);
      y += 18;
      ctx.fillText(`Invoice: ${orderId}`, 10, y);
      y += 18;
      ctx.fillText("--------------------------------", 10, y);
      y += 18;

      // Items
      order.forEach((item) => {
        ctx.fillText(`${item.khmerName} (${item.englishName || ""})`, 10, y);
        y += 16;
        ctx.fillText(`Qty:${item.quantity}  ${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`, 10, y);
        y += 16;
      });

      ctx.fillText("--------------------------------", 10, y);
      y += 16;
      ctx.fillText(`Subtotal: ${KHR_SYMBOL}${formatKHR(subtotalKHR)}`, 10, y);
      y += 16;
      ctx.fillText(`Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`, 10, y);
      y += 20;

      // QR code
      const qrImg = new Image();
      qrImg.src = qrcode;
      await new Promise((resolve) => {
        qrImg.onload = () => {
          const qrSize = 100;
          ctx.drawImage(qrImg, canvas.width / 2 - qrSize / 2, y, qrSize, qrSize);
          y += qrSize + 20;
          resolve(true);
        };
      });

      ctx.fillText("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", 10, y);

      // Convert to base64
      const dataUrl = canvas.toDataURL("image/png");

      // Send to RawBT
      window.location.href = `rawbt://print?base64=${encodeURIComponent(dataUrl)}`;
    } catch (err) {
      alert("⚠ Error printing: Please make sure RawBT is installed on your device.");
      console.error(err);
    }
  };

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <div className="receipt-print-area" ref={receiptRef}>
          {/* Preview can be same as canvas content */}
          <p>Receipt preview here...</p>
        </div>

        <div className="print-button-container">
          <button className="btn-close-receipt" onClick={onClose}>
            បោះបង់
          </button>
          <button className="btn-print" onClick={handleAndroidRawBTPrint}>
            បោះពុម្ពវិក្កយបត្រ
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
