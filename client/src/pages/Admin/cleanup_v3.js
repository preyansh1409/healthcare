import fs from 'fs';
const content = fs.readFileSync('C:/Users/preya/OneDrive/Documents/Desktop/project/client/src/pages/Admin/BillingManagement.jsx', 'utf8');

const updated = content
    .replaceAll('min="1"', 'min="0"')
    .replace(/value=\{item.quantity \|\| 1\}/g, 'value={item.quantity === undefined ? 0 : item.quantity}')
    .replace(/\{item.quantity \|\| 1\}/g, '{item.quantity === undefined ? 0 : item.quantity}');

fs.writeFileSync('C:/Users/preya/OneDrive/Documents/Desktop/project/client/src/pages/Admin/BillingManagement.jsx', updated, 'utf8');
console.log('File updated to start at 0.');
