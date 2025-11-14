// src/components/StockManagement.jsx
import React, { useState, useRef } from 'react';
import { exportStockToCSV, exportStockToJSON, importStockFromCSV, importStockFromJSON } from '../data/stockData';
import { saveAs } from 'file-saver';
import { db, serverTimestamp } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function StockManagement({ stockData, onUpdateStock }) {
    const [filterCategory, setFilterCategory] = useState('ALL');
    const fileInputRef = useRef(null);
    const [importFormat, setImportFormat] = useState('csv');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStockItem, setNewStockItem] = useState({
        khmerName: '',
        englishName: '',
        category: 'COLD DRINKS',
        priceKHR: 0,
        quantity: 0,
    });
    const [savingStatus, setSavingStatus] = useState('');

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

    const handleSaveToFirebase = async () => {
        if (Object.keys(stockData).length === 0) {
            alert('មិនមានទិន្នន័យស្តុក។');
            return;
        }

        setSavingStatus('កំពុងរក្សាទុក...');
        try {
            const stockItems = Object.values(stockData).map(item => ({
                khmerName: item.khmerName,
                englishName: item.englishName,
                category: item.category,
                priceKHR: item.priceKHR,
                quantity: item.quantity,
            }));

            const docRef = await addDoc(collection(db, 'stock'), {
                date: selectedDate,
                items: stockItems,
                totalItems: stockItems.length,
                totalQuantity: stockItems.reduce((sum, item) => sum + item.quantity, 0),
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
            });
            
            setSavingStatus('រក្សាទុកដោយជោគជ័យ!');
            setTimeout(() => setSavingStatus(''), 2000);
            alert(`ទិន្នន័យរក្សាទុកក្នុង Firestore ដោយជោគជ័យ!\nDocument ID: ${docRef.id}`);
        } catch (error) {
            setSavingStatus('កំហុស: ' + error.message);
            console.error('Error saving to Firebase:', error);
            alert('មានកំហុសក្នុងការរក្សាទុក: ' + error.message);
        }
    };

    const handleAddNewItem = async () => {
        if (!newStockItem.khmerName.trim()) {
            alert('សូមបញ្ចូលឈ្មោះទំនិញ');
            return;
        }

        const key = `${newStockItem.khmerName}_${newStockItem.category}`;
        const updatedStock = {
            ...stockData,
            [key]: {
                khmerName: newStockItem.khmerName,
                englishName: newStockItem.englishName,
                category: newStockItem.category,
                priceKHR: newStockItem.priceKHR,
                quantity: newStockItem.quantity,
                lastUpdated: new Date().toISOString(),
            }
        };
        
        onUpdateStock(updatedStock);
        setNewStockItem({
            khmerName: '',
            englishName: '',
            category: 'COLD DRINKS',
            priceKHR: 0,
            quantity: 0,
        });
        setShowAddForm(false);
        alert('ទំនិញថ្មីបានបន្ថែមដោយជោគជ័យ!');
    };
    return (
        <div className="stock-management-panel">
            <h2>គ្រប់គ្រងស្តុក</h2>
            
            {/* Date Selector and Firebase Save */}
            <div className="stock-date-controls">
                <div className="date-input-group">
                    <label>ជ្រើសរើសកាលបរិច្ឆេទ:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                </div>
                <button onClick={handleSaveToFirebase} className="btn-firebase">💾 រក្សាទុកទៅ Firebase</button>
                {savingStatus && <div className="saving-status">{savingStatus}</div>}
            </div>

            {/* Import/Export Controls */}
            <div className="stock-controls">
                <div className="stock-actions">
                    <button onClick={handleExportCSV} className="btn-export">📥 នាំចេញ CSV</button>
                    <button onClick={handleExportJSON} className="btn-export">📥 នាំចេញ JSON</button>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="btn-add-item">➕ បន្ថែមទំនិញថ្មី</button>
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

                {/* Add New Item Button */}
                <button 
                    onClick={() => setShowAddForm(!showAddForm)} 
                    className="btn-add-item"
                >
                    {showAddForm ? '✕ បិទ' : '➕ បន្ថែមទំនិញថ្មី'}
                </button>

                {/* Add New Item Form */}
                {showAddForm && (
                    <div className="add-item-form">
                        <h3>បន្ថែមទំនិញថ្មី</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>ឈ្មោះទំនិញ (ខ្មែរ):</label>
                                <input
                                    type="text"
                                    value={newStockItem.khmerName}
                                    onChange={(e) => setNewStockItem({...newStockItem, khmerName: e.target.value})}
                                    placeholder="ឧ. កាហ្វេខ្មៅ"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>ឈ្មោះទំនិញ (អង់គ្លេស):</label>
                                <input
                                    type="text"
                                    value={newStockItem.englishName}
                                    onChange={(e) => setNewStockItem({...newStockItem, englishName: e.target.value})}
                                    placeholder="e.g. Black Coffee"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>ប្រភេទ:</label>
                                <select
                                    value={newStockItem.category}
                                    onChange={(e) => setNewStockItem({...newStockItem, category: e.target.value})}
                                    className="form-input"
                                >
                                    <option value="">-- ជ្រើសរើសប្រភេទ --</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>តម្លៃ (KHR):</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockItem.priceKHR}
                                    onChange={(e) => setNewStockItem({...newStockItem, priceKHR: parseFloat(e.target.value) || 0})}
                                    placeholder="0"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>ចំនួនស្តុក:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockItem.quantity}
                                    onChange={(e) => setNewStockItem({...newStockItem, quantity: parseInt(e.target.value) || 0})}
                                    placeholder="0"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={handleAddNewItem}
                                className="btn-submit"
                            >
                                ➕ បន្ថែម
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewStockItem({ khmerName: '', englishName: '', category: '', priceKHR: 0, quantity: 0 });
                                }}
                                className="btn-cancel"
                            >
                                បោះបង់
                            </button>
                        </div>
                    </div>
                )}
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
