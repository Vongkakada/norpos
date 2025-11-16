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

    const subtotalKHR = currentOrder.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 
        0
    );
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

            setReceiptImage(dataURL);
            setShowPreview(true);

        } catch (error) {
            console.error('Error generating receipt:', error);
            alert('❌ មានបញ្ហាក្នុងការបង្កើតវិក្កយបត្រ!\n' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrintToRawBT = () => {
        if (!receiptImage) return;

        try {
            // Extract base64 data
            const base64Data = receiptImage.split(',')[1];

            // Send to RawBT app - try different URL schemes
            // Most common format for image printing in RawBT
            const rawbtURL = `rawbt:base64,${base64Data}`;
            window.location.href = rawbtURL;

            // Alternative formats if above doesn't work:
            // window.location.href = `rawbt:image,${base64Data}`;
            // window.location.href = `rawbt://print?image=${base64Data}`;

            // Process payment after short delay
            setTimeout(() => {
                setShowPreview(false);
                setReceiptImage(null);
                onProcessPayment();
            }, 1000);

        } catch (error) {
            console.error('Print error:', error);
            alert('❌ មានបញ្ហាក្នុងការបោះពុម្ព!\n' + error.message);
        }
    };

    const handleDownloadImage = () => {
        if (!receiptImage) return;

        const link = document.createElement('a');
        link.href = receiptImage;
        link.download = `receipt-${orderId}.png`;
        link.click();
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
                    overflow: 'auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '95vh',
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
                                fontSize: '22px',
                                marginBottom: '8px',
                                fontWeight: 'bold'
                            }}>
                                📄 វិក្កយបត្រ Receipt
                            </h3>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#e8f5e9',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                color: '#2e7d32',
                                fontWeight: '500'
                            }}>
                                <span>✅</span>
                                <span>អក្សរខ្មែរ + QR Code + Logo</span>
                            </div>
                        </div>

                        {/* Receipt Image Preview */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            background: '#f5f5f5',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            border: '3px solid #e0e0e0'
                        }}>
                            <img 
                                src={receiptImage} 
                                alt="Receipt Preview" 
                                style={{ 
                                    maxWidth: '100%', 
                                    height: 'auto',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    background: 'white'
                                }} 
                            />
                        </div>

                        {/* Info Box */}
                        <div style={{
                            background: '#fff3cd',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '12px',
                            lineHeight: '1.6',
                            color: '#856404',
                            border: '1px solid #ffeaa7'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                📱 ការណែនាំ:
                            </div>
                            <div style={{ fontSize: '11px' }}>
                                • ចុច "បោះពុម្ព" ដើម្បីផ្ញើទៅ RawBT<br/>
                                • ឬ "ទាញយក" រក្សាទុកជារូបភាព<br/>
                                • រូបភាពមានគុណភាពខ្ពស់ 576px
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleClosePreview}
                                style={{
                                    flex: 1,
                                    padding: '14px 16px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#5a6268';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = '#6c757d';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                                }}
                            >
                                ❌ បោះបង់
                            </button>
                            
                            <button
                                onClick={handleDownloadImage}
                                style={{
                                    flex: 1,
                                    padding: '14px 16px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#138496';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = '#17a2b8';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                                }}
                            >
                                💾 ទាញយក
                            </button>
                            
                            <button
                                onClick={handlePrintToRawBT}
                                style={{
                                    flex: 1.5,
                                    padding: '14px 16px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#218838';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = '#28a745';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                                }}
                            >
                                🖨️ បោះពុម្ព (RawBT)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPanel;