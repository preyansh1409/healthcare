import fs from 'fs';
const content = fs.readFileSync('C:/Users/preya/OneDrive/Documents/Desktop/project/client/src/pages/Admin/BillingManagement.jsx', 'utf8');

const updated = content
    .replaceAll('item.quantity || 1', 'item.quantity === undefined ? 0 : item.quantity');

fs.writeFileSync('C:/Users/preya/OneDrive/Documents/Desktop/project/client/src/pages/Admin/BillingManagement.jsx', updated, 'utf8');
console.log('Calculation default fixed for quantity.');
