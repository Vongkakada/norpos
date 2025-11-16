// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import { 
  printViaRawBT,
  generatePlainTextReceipt
} from '../utils/escposPrinter';

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
    const [showPreview, setShowPreview] = useState(false);
    const [receiptPreview, setReceiptPreview] = useState('');

    const subtotalKHR = currentOrder.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 
        0
    );
    const totalKHR = subtotalKHR;

    const handleGeneratePreview = () => {
        const receiptData = {
            shopName,
            orderId,
            order: currentOrder,
            totalKHR,
        };
        
        // Generate plain text preview
        const preview = generatePlainTextReceipt(receiptData);
        setReceiptPreview(preview);
        setShowPreview(true);
    };

    const handlePrint = () => {
        setIsPrinting(true);

        try {
            const receiptData = {
                shopName,
                orderId,
                order: currentOrder,
                totalKHR,
            };

            // Print via RawBT App
            printViaRawBT(receiptData);
            
            // Close preview and process payment
            setTimeout(() => {
                setShowPreview(false);
                onProcessPayment();
                setIsPrinting(false);
            }, 1000);

        } catch (error) {
            console.error('Print error:', error);
            alert('❌ មានបញ្ហាក្នុងការបោះពុម្ព!\n' + error.message);
            setIsPrinting(false);
        }
    };

    const handleClosePreview = () => {
        setShowPreview(false);
    };

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>

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
                    onClick={handleGeneratePreview} 
                    disabled={currentOrder.length === 0 || isPrinting}
                >
                    {isPrinting ? '🖨️ កំពុងបោះពុម្ព...' : '💰 គិតលុយ'}
                </button>
            </div>

            {/* Receipt Preview Modal */}
            {showPreview && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '450px',
                        width: '100%',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ 
                            marginBottom: '16px', 
                            textAlign: 'center'
                        }}>
                            <h3 style={{ 
                                color: '#333',
                                fontSize: '20px',
                                marginBottom: '8px'
                            }}>
                                👀 មើលវិក្កយបត្រ
                            </h3>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#e3f2fd',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                color: '#1976d2'
                            }}>
                                <span style={{
                                    background: '#4caf50',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                }}>
                                    ESC/POS
                                </span>
                                <span style={{ fontWeight: '500' }}>
                                    📱 RawBT App
                                </span>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            background: '#1e1e1e',
                            color: '#00ff00',
                            padding: '16px',
                            borderRadius: '8px',
                            fontFamily: 'Courier New, monospace',
                            fontSize: '12px',
                            lineHeight: '1.4',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '16px',
                            border: '2px solid #333'
                        }}>
                            {receiptPreview}
                        </div>

                        {/* Info Box */}
                        <div style={{
                            background: '#e8f5e9',
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '16px',
                            fontSize: '12px',
                            lineHeight: '1.6',
                            color: '#2e7d32'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                ✨ អក្សរច្បាស់ល្អ មិនរាល!
                            </div>
                            <div style={{ fontSize: '11px', color: '#388e3c' }}>
                                • ប្រើ ESC/POS commands<br/>
                                • Print លឿន និងច្បាស់<br/>
                                • ស្របតាម thermal printer
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleClosePreview}
                                disabled={isPrinting}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    backgroundColor: isPrinting ? '#ccc' : '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isPrinting ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => !isPrinting && (e.target.style.backgroundColor = '#5a6268')}
                                onMouseOut={(e) => !isPrinting && (e.target.style.backgroundColor = '#6c757d')}
                            >
                                ❌ បោះបង់
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={isPrinting}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    backgroundColor: isPrinting ? '#ccc' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isPrinting ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => !isPrinting && (e.target.style.backgroundColor = '#218838')}
                                onMouseOut={(e) => !isPrinting && (e.target.style.backgroundColor = '#28a745')}
                            >
                                {isPrinting ? '⏳ កំពុងផ្ញើ...' : '🖨️ បោះពុម្ព'}
                            </button>
                        </div>

                        <p style={{ 
                            marginTop: '12px', 
                            fontSize: '11px', 
                            color: '#999', 
                            textAlign: 'center'
                        }}>
                            💡 នឹងបើក RawBT app ស្វ័យប្រវត្តិ
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPanel;