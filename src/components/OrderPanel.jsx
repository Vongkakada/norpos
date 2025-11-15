// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import { printViaBluetooth, printViaRawBT } from '../utils/bluetoothPrinter';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    onProcessPayment,
    exchangeRate,
    shopName = "ហាងលក់ទំនិញ",
}) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printMethod, setPrintMethod] = useState('bluetooth'); // 'bluetooth' or 'rawbt'

    const subtotalKHR = currentOrder.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
    const totalKHR = subtotalKHR;

    const handlePaymentWithPrint = async () => {
        setIsPrinting(true);

        try {
            const receiptData = {
                shopName,
                orderId,
                order: currentOrder,
                totalKHR,
            };

            if (printMethod === 'bluetooth') {
                // Web Bluetooth printing (for modern browsers)
                await printViaBluetooth(receiptData);
                alert('បោះពុម្ពវិក្កយបត្របានជោគជ័យ! ✅');
            } else {
                // RawBT app (for Android with RawBT installed)
                printViaRawBT(receiptData);
            }

            // Process payment after successful print
            onProcessPayment();

        } catch (error) {
            console.error('Print error:', error);
            
            // Show user-friendly error message
            let errorMsg = 'មានបញ្ហាក្នុងការបោះពុម្ព!\n\n';
            
            if (error.message.includes('Bluetooth')) {
                errorMsg += 'សូមពិនិត្យមើល:\n';
                errorMsg += '- បើក Bluetooth\n';
                errorMsg += '- Printer ភ្ជាប់រួចហើយ\n';
                errorMsg += '- ប្រើកម្មវិធី Chrome/Edge\n\n';
                errorMsg += 'ចង់បន្តគិតលុយដោយមិនបោះពុម្ពទេ?';
                
                // eslint-disable-next-line no-restricted-globals
                if (window.confirm(errorMsg)) {
                    onProcessPayment();
                }
            } else {
                alert(errorMsg + error.message);
            }
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>
            
            {/* Print method selector */}
            <div className="print-method-selector" style={{ marginBottom: '10px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <label style={{ fontSize: '12px', marginRight: '10px' }}>
                    <input
                        type="radio"
                        value="bluetooth"
                        checked={printMethod === 'bluetooth'}
                        onChange={(e) => setPrintMethod(e.target.value)}
                        style={{ marginRight: '5px' }}
                    />
                    Bluetooth (Web)
                </label>
                <label style={{ fontSize: '12px' }}>
                    <input
                        type="radio"
                        value="rawbt"
                        checked={printMethod === 'rawbt'}
                        onChange={(e) => setPrintMethod(e.target.value)}
                        style={{ marginRight: '5px' }}
                    />
                    RawBT App
                </label>
            </div>

            <div className="current-order-items">
                {currentOrder.length === 0 ? (
                    <p className="empty-cart">មិនទាន់មានទំនិញក្នុងបញ្ជីទេ។</p>
                ) : (
                    currentOrder.map(item => (
                        <OrderItemEntry
                            key={item.khmerName + (item.priceKHR || item.priceUSD || 0)}
                            item={item}
                            onUpdateQuantity={onUpdateQuantity}
                        />
                    ))
                )}
            </div>
            <div className="order-summary">
                <div className="summary-line">
                    <span>សរុបរង (Subtotal):</span>
                    <span className="currency-value">
                        {KHR_SYMBOL}{formatKHR(subtotalKHR || 0)}
                    </span>
                </div>
                <div className="summary-line total order-total">
                    <span>សរុប (Total):</span>
                    <span className="currency-value">
                        {KHR_SYMBOL}{formatKHR(totalKHR || 0)}
                    </span>
                </div>
            </div>
            <div className="action-buttons">
                <button 
                    className="btn-clear" 
                    onClick={onClearOrder} 
                    disabled={currentOrder.length === 0 || isPrinting}
                >
                    លុបការកម្ម៉ង់
                </button>
                <button 
                    className="btn-pay" 
                    onClick={handlePaymentWithPrint} 
                    disabled={currentOrder.length === 0 || isPrinting}
                >
                    {isPrinting ? '🖨️ កំពុងបោះពុម្ព...' : '💰 គិតលុយ'}
                </button>
            </div>
        </div>
    );
}

export default OrderPanel;