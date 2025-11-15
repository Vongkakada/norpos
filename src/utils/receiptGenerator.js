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
      resolve(null); // Return null instead of rejecting
    };
    img.src = src;
  });
};

const drawLine = (ctx, x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
};

// Wrap text to fit width
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

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
      
      // Receipt dimensions (576px for 80mm thermal printer, better quality)
      const width = 576;
      const padding = 20;
      const lineHeight = 28;
      let y = padding;

      // Calculate required height dynamically
      let estimatedHeight = 
        100 + // logo
        lineHeight * 7 + // header info
        order.length * lineHeight * 3 + // items (more space for wrapping)
        lineHeight * 4 + // total section
        120 + // QR code
        lineHeight * 3 + // thank you
        padding * 4;

      canvas.width = width;
      canvas.height = estimatedHeight;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);
      ctx.fillStyle = '#000000';

      // Load and draw logo
      const logoImg = await loadImage(logo);
      if (logoImg) {
        const logoH = 80;
        const logoW = 80;
        ctx.drawImage(logoImg, (width - logoW) / 2, y, logoW, logoH);
        y += logoH + 12;
      } else {
        y += 12;
      }

      // Shop name (bold, large)
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight + 4;

      // Address and contact
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight + 4;

      // Date and time
      const now = new Date();
      ctx.font = '14px Arial, sans-serif';
      const dateStr = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`;
      ctx.fillText(dateStr, width / 2, y);
      y += lineHeight;

      // Invoice number
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText(`Invoice #${orderId}`, width / 2, y);
      y += lineHeight + 8;

      // Divider line
      drawLine(ctx, padding, y, width - padding, y);
      y += 16;

      // Order items header
      ctx.textAlign = 'left';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('Item', padding, y);
      ctx.textAlign = 'right';
      ctx.fillText('Amount', width - padding, y);
      y += lineHeight;
      
      drawLine(ctx, padding, y, width - padding, y);
      y += 12;

      // Order items
      ctx.textAlign = 'left';
      
      order.forEach((item) => {
        // Item name (Khmer) - bold
        ctx.font = 'bold 16px Arial, sans-serif';
        const khmerName = item.khmerName || '';
        const khmerLines = wrapText(ctx, khmerName, width - padding * 2 - 100);
        
        khmerLines.forEach((line) => {
          ctx.fillText(line, padding, y);
          y += lineHeight;
        });
        
        // English name and quantity
        ctx.font = '14px Arial, sans-serif';
        const englishName = item.englishName || '';
        const qtyText = `${englishName} x ${item.quantity}`;
        ctx.fillText(qtyText, padding + 8, y);
        
        // Price (right aligned)
        const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
        const priceText = `${KHR_SYMBOL}${formatKHR(itemTotal)}`;
        ctx.textAlign = 'right';
        ctx.fillText(priceText, width - padding, y);
        ctx.textAlign = 'left';
        
        y += lineHeight + 8;
      });

      // Bottom divider
      y += 4;
      drawLine(ctx, padding, y, width - padding, y);
      y += 20;

      // Total amount (bold, larger)
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`TOTAL`, width / 2, y);
      y += lineHeight + 8;
      
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText(`${KHR_SYMBOL}${formatKHR(totalKHR)}`, width / 2, y);
      y += lineHeight + 8;

      // Another divider
      drawLine(ctx, padding, y, width - padding, y);
      y += 20;

      // QR Code
      const qrImg = await loadImage(qrcode);
      if (qrImg) {
        const qrSize = 110;
        ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 16;
      } else {
        y += 16;
      }

      // Thank you message
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText('សូមអរគុណ!', width / 2, y);
      y += lineHeight;
      ctx.fillText('សូមអញ្ជើញមកម្តងទៀត!', width / 2, y);
      y += lineHeight + 20;

      // Adjust canvas height to actual content
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = y;
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, width, y);
      finalCtx.drawImage(canvas, 0, 0);

      // Convert to base64 data URL
      const dataURL = finalCanvas.toDataURL('image/png', 1.0);
      resolve(dataURL);

    } catch (error) {
      reject(error);
    }
  });
};