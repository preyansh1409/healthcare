import fs from 'fs';
const content = fs.readFileSync('C:/Users/preya/OneDrive/Documents/Desktop/project/client/src/pages/Admin/BillingManagement.jsx', 'utf8');

const updated = content.replace(
    /<td style=\{\{ padding: '14px 0', textAlign: 'center' \}\}>[\s\S]*?<\/td>/,
    `<td style={{ padding: '14px 0', textAlign: 'center' }}>
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                 <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{item.quantity || 0}</span>
                                 <input 
                                    type="number" 
                                    min="0" 
                                    value={item.quantity === undefined ? 0 : item.quantity} 
                                    onChange={(e) => updateItemQty(item.id, e.target.value)}
                                    className="no-print"
                                    style={{ width: 45, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '11px', padding: '2px', background: '#f8fafc' }}
                                 />
                               </div>
                            </td>`
);

fs.writeFileSync('C:/Users/preya/OneDrive/Documents/Desktop/project/client/src/pages/Admin/BillingManagement.jsx', updated, 'utf8');
console.log('File updated to always show days.');
