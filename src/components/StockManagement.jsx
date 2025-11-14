// src/components/StockManagement.jsx
import React, { useState, useRef } from 'react';
import { exportStockToCSV, exportStockToJSON, importStockFromCSV, importStockFromJSON } from '../data/stockData';
import { saveAs } from 'file-saver';

function StockManagement({ stockData, onUpdateStock }) {
    const [filterCategory, setFilterCategory] = useState('ALL');
    const fileInputRef = useRef(null);
    const [importFormat, setImportFormat] = useState('csv');

    const categories = ['ALL', ...new Set(Object.values(stockData).map(item => item.category))];
    
    const filteredStock = filterCategory === 'ALL'
        ? Object.values(stockData)
        : Object.values(stockData).filter(item => item.category === filterCategory);

    const handleExportCSV = () => {
        if (Object.keys(stockData).length === 0) {
            alert('មិនមានទិន្នន័យដែលត្រូវលុប។');
            return;
        }
        const csvContent = exportStockToCSV(stockData);
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `stock_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const handleExportJSON = () => {
        if (Object.keys(stockData).length === 0) {
            alert('មិនមានទិន្នន័យដែលត្រូវលុប។');
            return;
        }
        const jsonContent = exportStockToJSON(stockData);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        saveAs(blob, `stock_${new Date().toISOString().split('T')[0]}.json`);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result;
                let importedStock;

                if (importFormat === 'csv') {
                    importedStock = importStockFromCSV(content);
                } else {
                    importedStock = importStockFromJSON(content);
                }

                onUpdateStock(importedStock);
                alert('ឯកសារ​បាន​នាំចូល​ដោយ​ជោគ​ជ័យ!');
            } catch (error) {
                alert('កំហុស​ក្នុង​ការ​នាំចូល: ' + error.message);
            }
        };

        reader.readAsText(file);
        fileInputRef.current.value = ''; // Reset input
    };

    const handleUpdateQuantity = (key, newQuantity) => {
        const stock = Object.values(stockData).find(item => 
            `${item.khmerName}_${item.category}` === key
        );
        
        if (stock) {
            const updatedStock = {
                ...stockData,
                [key]: {
                    ...stock,
                    quantity: Math.max(0, newQuantity),
                    lastUpdated: new Date().toISOString(),
                }
            };
            onUpdateStock(updatedStock);
        }
    };

    return (
        <div className="stock-management-panel">
            <h2>គ្រប់គ្រងស្តុក</h2>
            
            {/* Import/Export Controls */}
            <div className="stock-controls">
                <div className="stock-actions">
                    <button onClick={handleExportCSV} className="btn-export">📥 នាំចេញ CSV</button>
                    <button onClick={handleExportJSON} className="btn-export">📥 នាំចេញ JSON</button>
                    <div className="import-control">
                        <select value={importFormat} onChange={(e) => setImportFormat(e.target.value)}>
                            <option value="csv">CSV</option>
                            <option value="json">JSON</option>
                        </select>
                        <button onClick={handleImportClick} className="btn-import">📤 នាំចូល</button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={importFormat === 'csv' ? '.csv' : '.json'}
                            onChange={handleFileImport}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="category-filter">
                    <label>ច្រោះតាមប្រភេទ:</label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stock Table */}
            {filteredStock.length > 0 ? (
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>ឈ្មោះទំនិញ (ខ្មែរ)</th>
                            <th>ឈ្មោះទំនិញ (អង់គ្លេស)</th>
                            <th>ប្រភេទ</th>
                            <th className="number-cell">តម្លៃ (KHR)</th>
                            <th className="number-cell">ចំនួនស្តុក</th>
                            <th>សកម្មភាព</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStock.map(item => {
                            const key = `${item.khmerName}_${item.category}`;
                            return (
                                <tr key={key}>
                                    <td>{item.khmerName}</td>
                                    <td>{item.englishName || '-'}</td>
                                    <td>{item.category}</td>
                                    <td className="number-cell">{item.priceKHR.toLocaleString()}</td>
                                    <td className="number-cell">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(key, parseInt(e.target.value) || 0)}
                                            className="stock-input"
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleUpdateQuantity(key, Math.max(0, item.quantity - 1))}
                                            className="btn-adjust"
                                            title="ថយចុះ"
                                        >
                                            -
                                        </button>
                                        <button
                                            onClick={() => handleUpdateQuantity(key, item.quantity + 1)}
                                            className="btn-adjust"
                                            title="កើនឡើង"
                                        >
                                            +
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p>មិនមានទិន្នន័យស្តុក។</p>
            )}
        </div>
    );
}

export default StockManagement;
