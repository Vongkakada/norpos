// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import { generateReceiptImage } from '../utils/receiptGenerator';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    onProcessPayment,
    exchangeRate,
    shopName = "ហាងលក់ទំនិញ",
}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [receiptImage, setReceiptImage] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const subtotalKHR = currentOrder.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
    const totalKHR = subtotalKHR;

    const handleGenerateReceipt = async () => {
        setIsGenerating(true);

        try {
            // Generate receipt image
            const dataURL = await generateReceiptImage({
                shopName,
                orderId,
                order: currentOrder,
                totalKHR,
            });

            // Show preview
            setReceiptImage(dataURL);
            setShowPreview(true);

        } catch (error) {
            console.error('Error generating receipt:', error);
            alert('មានបញ្ហាក្នុងការបង្កើតវិក្កយបត្រ!\n' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrintToRawBT = () => {
        if (!receiptImage) return;

        try {
            // Extract base64 data (remove "data:image/png;base64," prefix)
            const base64Data = receiptImage.split(',')[1];

            // Send to RawBT app with base64 image
            // Try different RawBT URL schemes
            window.location.href = `rawbt:base64,${base64Data}`;
            
            // Alternative formats if above doesn't work:
            // window.location.href = `rawbt://image?base64=${base64Data}`;
            // window.location.href = `rawbt://print/image?data=${base64Data}`;

            // Close preview and process payment
            setTimeout(() => {
                setShowPreview(false);
                setReceiptImage(null);
                onProcessPayment();
            }, 500);

        } catch (error) {
            console.error('Print error:', error);
            alert('មានបញ្ហាក្នុងការបោះពុម្ព!\n' + error.message);
        }
    };

    const handleClosePreview = () => {
        setShowPreview(false);
        setReceiptImage(null);
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
                    disabled={currentOrder.length === 0 || isGenerating}
                >
                    លុបការកម្ម៉ង់
                </button>
                <button 
                    className="btn-pay" 
                    onClick={handleGenerateReceipt} 
                    disabled={currentOrder.length === 0 || isGenerating}
                >
                    {isGenerating ? '⏳ កំពុងបង្កើត...' : '💰 គិតលុយ'}
                </button>
            </div>

            {/* Receipt Preview Modal */}
            {showPreview && receiptImage && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px',
                    }}
                >
                    <div 
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '20px',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <h3 style={{ marginBottom: '16px', color: '#333' }}>
                            👀 មើលវិក្កយបត្រ
                        </h3>
                        
                        <img 
                            src={receiptImage} 
                            alt="Receipt Preview" 
                            style={{ 
                                maxWidth: '100%', 
                                height: 'auto',
                                border: '2px solid #ddd',
                                borderRadius: '4px',
                                marginBottom: '20px',
                            }} 
                        />

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                onClick={handleClosePreview}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                ❌ បោះបង់
                            </button>
                            <button
                                onClick={handlePrintToRawBT}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                🖨️ បោះពុម្ព
                            </button>
                        </div>

                        <p style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            * សូមពិនិត្យមើលវិក្កយបត្រមុននឹងបោះពុម្ព
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPanel;