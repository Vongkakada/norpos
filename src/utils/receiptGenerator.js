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
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
};

const drawLine = (ctx, x1, y1, x2, y2, thickness = 2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = thickness;
  ctx.stroke();
};

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const generateReceiptImage = async ({ shopName, orderId, order, totalKHR }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // High resolution for thermal printer (58mm = 384px, 80mm = 576px)
      // Using 576px for better quality
      const width = 576;
      const padding = 24;
      const lineHeight = 32;
      let y = padding;

      // Estimate height
      let estimatedHeight = 
        100 + // logo
        lineHeight * 8 + // header
        order.length * lineHeight * 3 + // items
        lineHeight * 4 + // total
        140 + // QR code
        lineHeight * 3 + // footer
        padding * 3;

      canvas.width = width;
      canvas.height = estimatedHeight;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);
      ctx.fillStyle = '#000000';

      // Load logo
      const logoImg = await loadImage(logo);
      if (logoImg) {
        const logoSize = 80;
        ctx.drawImage(logoImg, (width - logoSize) / 2, y, logoSize, logoSize);
        y += logoSize + 12;
      }

      // Shop name (bold, large, center)
      ctx.font = 'bold 28px Arial, "Noto Sans Khmer", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight + 4;

      // Address
      ctx.font = '18px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight + 4;

      // Date and time
      const now = new Date();
      ctx.font = '15px Arial, sans-serif';
      const dateStr = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`;
      ctx.fillText(dateStr, width / 2, y);
      y += lineHeight;

      // Invoice
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(`Invoice #${orderId}`, width / 2, y);
      y += lineHeight + 8;

      // Top divider
      drawLine(ctx, padding, y, width - padding, y, 3);
      y += 16;

      // Items header
      ctx.textAlign = 'left';
      ctx.font = 'bold 17px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText('Item', padding, y);
      ctx.textAlign = 'right';
      ctx.fillText('Amount', width - padding, y);
      y += lineHeight;
      
      drawLine(ctx, padding, y, width - padding, y, 1);
      y += 12;

      // Items list
      ctx.textAlign = 'left';
      order.forEach((item) => {
        // Khmer name (bold)
        ctx.font = 'bold 18px Arial, "Noto Sans Khmer", sans-serif';
        const khmerName = item.khmerName || '';
        const khmerLines = wrapText(ctx, khmerName, width - padding * 2 - 120);
        
        khmerLines.forEach((line, idx) => {
          ctx.fillText(line, padding, y);
          if (idx < khmerLines.length - 1) y += lineHeight;
        });
        y += lineHeight;
        
        // English name and quantity
        ctx.font = '16px Arial, sans-serif';
        const englishName = item.englishName || '';
        const qtyText = `${englishName} × ${item.quantity}`;
        ctx.fillText(qtyText, padding + 8, y);
        
        // Price (right align)
        const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
        const priceText = `${KHR_SYMBOL}${formatKHR(itemTotal)}`;
        ctx.textAlign = 'right';
        ctx.font = 'bold 17px Arial, "Noto Sans Khmer", sans-serif';
        ctx.fillText(priceText, width - padding, y);
        ctx.textAlign = 'left';
        
        y += lineHeight + 6;
      });

      // Bottom divider
      y += 8;
      drawLine(ctx, padding, y, width - padding, y, 3);
      y += 24;

      // Total section
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('TOTAL', width / 2, y);
      y += lineHeight + 4;
      
      ctx.font = 'bold 36px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText(`${KHR_SYMBOL}${formatKHR(totalKHR)}`, width / 2, y);
      y += lineHeight + 12;

      // Divider
      drawLine(ctx, padding, y, width - padding, y, 3);
      y += 20;

      // QR Code
      const qrImg = await loadImage(qrcode);
      if (qrImg) {
        const qrSize = 120;
        ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 16;
      } else {
        // Fallback QR placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect((width - 120) / 2, y, 120, 120);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText('QR Code', width / 2, y + 60);
        y += 120 + 16;
      }

      // Thank you message
      ctx.font = 'bold 20px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText('សូមអរគុណ!', width / 2, y);
      y += lineHeight;
      ctx.fillText('សូមអញ្ជើញមកម្តងទៀត!', width / 2, y);
      y += lineHeight + 20;

      // Create final canvas with exact height
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = y;
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, width, y);
      finalCtx.drawImage(canvas, 0, 0);

      // Convert to data URL (high quality PNG)
      const dataURL = finalCanvas.toDataURL('image/png', 1.0);
      resolve(dataURL);

    } catch (error) {
      reject(error);
    }
  });
};