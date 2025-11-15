// src/utils/receiptGenerator.js
import { KHR_SYMBOL, formatKHR } from './formatters';
import logo from '../assets/logo.png';
import qrcode from '../assets/qrcode.jpg';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

const drawLine = (ctx, x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
};

export const generateReceiptImage = async ({ shopName, orderId, order, totalKHR }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Receipt dimensions (384px for 58mm thermal printer)
      const width = 384;
      const padding = 12;
      const lineHeight = 20;
      let y = padding;

      // Calculate required height
      const height = 
        70 + // logo
        lineHeight * 6 + // header info
        order.length * lineHeight * 2.5 + // items
        lineHeight * 3 + // total section
        100 + // QR code
        lineHeight * 2 + // thank you
        padding * 3;

      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#000';

      // Load and draw logo
      try {
        const logoImg = await loadImage(logo);
        const logoH = 50;
        const logoW = 50;
        ctx.drawImage(logoImg, (width - logoW) / 2, y, logoW, logoH);
        y += logoH + 8;
      } catch (err) {
        console.warn('Logo not loaded, skipping');
        y += 8;
      }

      // Shop name
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight;

      // Address and contact
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight;

      // Date and time
      const now = new Date();
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText(
        `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        width / 2,
        y
      );
      y += lineHeight;

      // Invoice number
      ctx.fillText(`Invoice: ${orderId}`, width / 2, y);
      y += lineHeight + 4;

      // Divider line
      drawLine(ctx, padding, y, width - padding, y);
      y += 8;

      // Order items
      ctx.textAlign = 'left';
      ctx.font = '12px Arial, sans-serif';
      
      order.forEach((item) => {
        // Item name (Khmer)
        const khmerName = item.khmerName || '';
        ctx.fillText(khmerName, padding, y);
        y += lineHeight;
        
        // English name and quantity
        const englishName = item.englishName || '';
        const qtyText = `${englishName} x${item.quantity}`;
        ctx.fillText(qtyText, padding + 4, y);
        
        // Price (right aligned)
        const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
        const priceText = `${KHR_SYMBOL}${formatKHR(itemTotal)}`;
        ctx.textAlign = 'right';
        ctx.fillText(priceText, width - padding, y);
        ctx.textAlign = 'left';
        
        y += lineHeight + 2;
      });

      // Bottom divider
      y += 4;
      drawLine(ctx, padding, y, width - padding, y);
      y += lineHeight;

      // Total amount
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`,
        width / 2,
        y
      );
      y += lineHeight + 4;

      // Another divider
      drawLine(ctx, padding, y, width - padding, y);
      y += 12;

      // QR Code
      try {
        const qrImg = await loadImage(qrcode);
        const qrSize = 90;
        ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 10;
      } catch (err) {
        console.warn('QR code not loaded, skipping');
        y += 10;
      }

      // Thank you message
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!', width / 2, y);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/png', 0.9);

    } catch (error) {
      reject(error);
    }
  });
};