// src/utils/bluetoothPrinter.js
import { KHR_SYMBOL, formatKHR } from './formatters';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

// ESC/POS Commands for thermal printer
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: `${ESC}@`,                    // Initialize printer
  ALIGN_CENTER: `${ESC}a1`,           // Center align
  ALIGN_LEFT: `${ESC}a0`,             // Left align
  ALIGN_RIGHT: `${ESC}a2`,            // Right align
  BOLD_ON: `${ESC}E1`,                // Bold on
  BOLD_OFF: `${ESC}E0`,               // Bold off
  SIZE_NORMAL: `${GS}!\x00`,          // Normal size
  SIZE_DOUBLE: `${GS}!\x11`,          // Double size
  SIZE_LARGE: `${GS}!\x22`,           // Large size
  FEED_LINE: '\n',                     // Line feed
  CUT_PAPER: `${GS}V\x41\x00`,        // Cut paper
};

// Convert string to bytes for Bluetooth printing
function strToBytes(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Generate ESC/POS commands for receipt
export function generateReceiptCommands({ shopName, orderId, order, totalKHR }) {
  let commands = '';
  
  // Initialize
  commands += CMD.INIT;
  
  // Header - Shop Name (center, bold, large)
  commands += CMD.ALIGN_CENTER;
  commands += CMD.BOLD_ON;
  commands += CMD.SIZE_LARGE;
  commands += shopName + CMD.FEED_LINE;
  commands += CMD.SIZE_NORMAL;
  commands += CMD.BOLD_OFF;
  
  // Address and contact (center)
  commands += SHOP_STATIC_DETAILS.address + CMD.FEED_LINE;
  commands += 'Tel: ' + SHOP_STATIC_DETAILS.tel + CMD.FEED_LINE;
  
  // Date and Invoice (center)
  const now = new Date();
  commands += now.toLocaleDateString() + ' ' + now.toLocaleTimeString() + CMD.FEED_LINE;
  commands += 'Invoice: ' + orderId + CMD.FEED_LINE;
  
  // Separator line
  commands += '--------------------------------' + CMD.FEED_LINE;
  
  // Items (left align)
  commands += CMD.ALIGN_LEFT;
  order.forEach((item) => {
    // Item name (Khmer)
    commands += item.khmerName + CMD.FEED_LINE;
    
    // English name, quantity and price
    const englishName = item.englishName || '';
    const quantity = 'x' + item.quantity;
    const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
    const price = KHR_SYMBOL + formatKHR(itemTotal);
    
    // Format: "English Name x2        1,000៛"
    const line = englishName + ' ' + quantity;
    const spaces = Math.max(1, 32 - line.length - price.length);
    commands += line + ' '.repeat(spaces) + price + CMD.FEED_LINE;
  });
  
  // Separator line
  commands += '--------------------------------' + CMD.FEED_LINE;
  
  // Total (center, bold, double size)
  commands += CMD.ALIGN_CENTER;
  commands += CMD.BOLD_ON;
  commands += CMD.SIZE_DOUBLE;
  commands += 'Total: ' + KHR_SYMBOL + formatKHR(totalKHR) + CMD.FEED_LINE;
  commands += CMD.SIZE_NORMAL;
  commands += CMD.BOLD_OFF;
  
  // Separator line
  commands += '--------------------------------' + CMD.FEED_LINE;
  
  // Thank you message (center)
  commands += CMD.FEED_LINE;
  commands += 'សូមអរគុណ!' + CMD.FEED_LINE;
  commands += 'សូមអញ្ជើញមកម្តងទៀត!' + CMD.FEED_LINE;
  
  // Extra feeds and cut
  commands += CMD.FEED_LINE;
  commands += CMD.FEED_LINE;
  commands += CMD.FEED_LINE;
  commands += CMD.CUT_PAPER;
  
  return strToBytes(commands);
}

// Web Bluetooth API - Connect and Print
export async function printViaBluetooth({ shopName, orderId, order, totalKHR }) {
  try {
    // Check if Web Bluetooth is supported
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth មិនគាំទ្រលើកម្មវិធីរុករករបស់អ្នកទេ។ សូមប្រើ Chrome ឬ Edge។');
    }

    // Request Bluetooth device
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'Sawoo' },
        { namePrefix: 'LK-P34' },
        { namePrefix: 'BlueTooth Printer' },
        { namePrefix: 'MTP' }
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // Common printer service UUID
    });

    // Connect to GATT server
    const server = await device.gatt.connect();
    
    // Get service and characteristic
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
    
    // Generate receipt commands
    const commands = generateReceiptCommands({ shopName, orderId, order, totalKHR });
    
    // Send data in chunks (max 512 bytes per write)
    const chunkSize = 512;
    for (let i = 0; i < commands.length; i += chunkSize) {
      const chunk = commands.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Disconnect
    device.gatt.disconnect();
    
    return { success: true };
    
  } catch (error) {
    console.error('Bluetooth printing error:', error);
    throw error;
  }
}

// Alternative: Use RawBT app (Android only)
export function printViaRawBT({ shopName, orderId, order, totalKHR }) {
  // Build plain text receipt
  let text = '';
  
  // Header
  text += shopName + '\n';
  text += SHOP_STATIC_DETAILS.address + '\n';
  text += 'Tel: ' + SHOP_STATIC_DETAILS.tel + '\n';
  
  // Date and Invoice
  const now = new Date();
  text += now.toLocaleDateString() + ' ' + now.toLocaleTimeString() + '\n';
  text += 'Invoice: ' + orderId + '\n';
  text += '--------------------------------\n';
  
  // Items
  order.forEach((item) => {
    text += item.khmerName + '\n';
    const englishName = item.englishName || '';
    const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
    text += englishName + ' x' + item.quantity + '  ' + KHR_SYMBOL + formatKHR(itemTotal) + '\n';
  });
  
  // Total
  text += '--------------------------------\n';
  text += 'Total: ' + KHR_SYMBOL + formatKHR(totalKHR) + '\n';
  text += '--------------------------------\n';
  
  // Thank you
  text += '\nសូមអរគុណ!\n';
  text += 'សូមអញ្ជើញមកម្តងទៀត!\n\n\n';
  
  // Send to RawBT
  window.location.href = 'rawbt:' + encodeURIComponent(text);
}