
import * as fs from 'fs';
import * as path from 'path';

// Helper to calc dimensions
function calcDim(diagonal: number, ratioStr: string) {
    const [w, h] = ratioStr.split(':').map(Number);
    const angle = Math.atan(h / w);
    const width = diagonal * Math.cos(angle) * 25.4; // inches to mm
    const height = diagonal * Math.sin(angle) * 25.4;
    return {
        width: parseFloat(width.toFixed(2)),
        height: parseFloat(height.toFixed(2))
    };
}

const phones = [
    // APPLE (2015-2024)
    { b: 'Apple', m: 'iPhone 15 Pro Max', d: 6.7, r: '19.5:9', a: 'A3106' },
    { b: 'Apple', m: 'iPhone 15 Pro', d: 6.1, r: '19.5:9', a: 'A3102' },
    { b: 'Apple', m: 'iPhone 15 Plus', d: 6.7, r: '19.5:9', a: 'A3094' },
    { b: 'Apple', m: 'iPhone 15', d: 6.1, r: '19.5:9', a: 'A3090' },
    { b: 'Apple', m: 'iPhone 14 Pro Max', d: 6.7, r: '19.5:9', a: 'A2894' },
    { b: 'Apple', m: 'iPhone 14 Pro', d: 6.1, r: '19.5:9', a: 'A2890' },
    { b: 'Apple', m: 'iPhone 14 Plus', d: 6.7, r: '19.5:9', a: 'A2886' },
    { b: 'Apple', m: 'iPhone 14', d: 6.1, r: '19.5:9', a: 'A2882' },
    { b: 'Apple', m: 'iPhone 13 Pro Max', d: 6.7, r: '19.5:9', a: 'A2643' },
    { b: 'Apple', m: 'iPhone 13 Pro', d: 6.1, r: '19.5:9', a: 'A2638' },
    { b: 'Apple', m: 'iPhone 13', d: 6.1, r: '19.5:9', a: 'A2633' },
    { b: 'Apple', m: 'iPhone 13 Mini', d: 5.4, r: '19.5:9', a: 'A2628' },
    { b: 'Apple', m: 'iPhone 12 Pro Max', d: 6.7, r: '19.5:9', a: 'A2411' },
    { b: 'Apple', m: 'iPhone 12 Pro', d: 6.1, r: '19.5:9', a: 'A2407' },
    { b: 'Apple', m: 'iPhone 12', d: 6.1, r: '19.5:9', a: 'A2403' },
    { b: 'Apple', m: 'iPhone 12 Mini', d: 5.4, r: '19.5:9', a: 'A2399' },
    { b: 'Apple', m: 'iPhone 11 Pro Max', d: 6.5, r: '19.5:9', a: 'A2218' },
    { b: 'Apple', m: 'iPhone 11 Pro', d: 5.8, r: '19.5:9', a: 'A2215' },
    { b: 'Apple', m: 'iPhone 11', d: 6.1, r: '19.5:9', a: 'A2221' },
    { b: 'Apple', m: 'iPhone XS Max', d: 6.5, r: '19.5:9', a: 'A2101' },
    { b: 'Apple', m: 'iPhone XS', d: 5.8, r: '19.5:9', a: 'A2097' },
    { b: 'Apple', m: 'iPhone XR', d: 6.1, r: '19.5:9', a: 'A2105' },
    { b: 'Apple', m: 'iPhone X', d: 5.8, r: '19.5:9', a: 'A1901' },
    { b: 'Apple', m: 'iPhone 8 Plus', d: 5.5, r: '16:9', a: 'A1897' },
    { b: 'Apple', m: 'iPhone 8', d: 4.7, r: '16:9', a: 'A1905' },
    { b: 'Apple', m: 'iPhone 7 Plus', d: 5.5, r: '16:9', a: 'A1784' },
    { b: 'Apple', m: 'iPhone 7', d: 4.7, r: '16:9', a: 'A1778' },
    { b: 'Apple', m: 'iPhone 6S Plus', d: 5.5, r: '16:9', a: 'A1687' },
    { b: 'Apple', m: 'iPhone 6S', d: 4.7, r: '16:9', a: 'A1688' },

    // SAMSUNG (S Series)
    { b: 'Samsung', m: 'Galaxy S24 Ultra', d: 6.8, r: '19.5:9', a: 'SM-S928B' },
    { b: 'Samsung', m: 'Galaxy S24 Plus', d: 6.7, r: '19.5:9', a: 'SM-S926B' },
    { b: 'Samsung', m: 'Galaxy S24', d: 6.2, r: '19.5:9', a: 'SM-S921B' },
    { b: 'Samsung', m: 'Galaxy S23 Ultra', d: 6.8, r: '19.3:9', a: 'SM-S918B' },
    { b: 'Samsung', m: 'Galaxy S23 Plus', d: 6.6, r: '19.5:9', a: 'SM-S916B' },
    { b: 'Samsung', m: 'Galaxy S23', d: 6.1, r: '19.5:9', a: 'SM-S911B' },
    { b: 'Samsung', m: 'Galaxy S23 FE', d: 6.4, r: '19.5:9', a: 'SM-S711B' },
    { b: 'Samsung', m: 'Galaxy S22 Ultra', d: 6.8, r: '19.3:9', a: 'SM-S908B' },
    { b: 'Samsung', m: 'Galaxy S22 Plus', d: 6.6, r: '19.5:9', a: 'SM-S906B' },
    { b: 'Samsung', m: 'Galaxy S22', d: 6.1, r: '19.5:9', a: 'SM-S901B' },
    { b: 'Samsung', m: 'Galaxy S21 Ultra', d: 6.8, r: '20:9', a: 'SM-G998B' },
    { b: 'Samsung', m: 'Galaxy S21 Plus', d: 6.7, r: '20:9', a: 'SM-G996B' },
    { b: 'Samsung', m: 'Galaxy S21', d: 6.2, r: '20:9', a: 'SM-G991B' },
    { b: 'Samsung', m: 'Galaxy S21 FE', d: 6.4, r: '20:9', a: 'SM-G990B' },
    { b: 'Samsung', m: 'Galaxy S20 Ultra', d: 6.9, r: '20:9', a: 'SM-G988B' },
    { b: 'Samsung', m: 'Galaxy S20 Plus', d: 6.7, r: '20:9', a: 'SM-G986B' },
    { b: 'Samsung', m: 'Galaxy S20', d: 6.2, r: '20:9', a: 'SM-G981B' },
    { b: 'Samsung', m: 'Galaxy S20 FE', d: 6.5, r: '20:9', a: 'SM-G780F' },
    { b: 'Samsung', m: 'Galaxy S10 Plus', d: 6.4, r: '19:9', a: 'SM-G975F' },
    { b: 'Samsung', m: 'Galaxy S10', d: 6.1, r: '19:9', a: 'SM-G973F' },
    { b: 'Samsung', m: 'Galaxy S10e', d: 5.8, r: '19:9', a: 'SM-G970F' },
    { b: 'Samsung', m: 'Galaxy S9 Plus', d: 6.2, r: '18.5:9', a: 'SM-G965F' },
    { b: 'Samsung', m: 'Galaxy S9', d: 5.8, r: '18.5:9', a: 'SM-G960F' },
    { b: 'Samsung', m: 'Galaxy S8 Plus', d: 6.2, r: '18.5:9', a: 'SM-G955F' },
    { b: 'Samsung', m: 'Galaxy S8', d: 5.8, r: '18.5:9', a: 'SM-G950F' },
    { b: 'Samsung', m: 'Galaxy S7 Edge', d: 5.5, r: '16:9', a: 'SM-G935F' },
    { b: 'Samsung', m: 'Galaxy S7', d: 5.1, r: '16:9', a: 'SM-G930F' },
    { b: 'Samsung', m: 'Galaxy S6 Edge', d: 5.1, r: '16:9', a: 'SM-G925F' },
    { b: 'Samsung', m: 'Galaxy S6', d: 5.1, r: '16:9', a: 'SM-G920F' },

    // SAMSUNG (Note Series)
    { b: 'Samsung', m: 'Galaxy Note 20 Ultra', d: 6.9, r: '19.3:9', a: 'SM-N986B' },
    { b: 'Samsung', m: 'Galaxy Note 20', d: 6.7, r: '20:9', a: 'SM-N981B' },
    { b: 'Samsung', m: 'Galaxy Note 10 Plus', d: 6.8, r: '19:9', a: 'SM-N975F' },
    { b: 'Samsung', m: 'Galaxy Note 10', d: 6.3, r: '19:9', a: 'SM-N970F' },
    { b: 'Samsung', m: 'Galaxy Note 9', d: 6.4, r: '18.5:9', a: 'SM-N960F' },
    { b: 'Samsung', m: 'Galaxy Note 8', d: 6.3, r: '18.5:9', a: 'SM-N950F' },
    { b: 'Samsung', m: 'Galaxy Note 5', d: 5.7, r: '16:9', a: 'SM-N920F' },

    // SAMSUNG (A Series - Popular)
    { b: 'Samsung', m: 'Galaxy A55', d: 6.6, r: '19.5:9', a: 'SM-A556B' },
    { b: 'Samsung', m: 'Galaxy A54 5G', d: 6.4, r: '19.5:9', a: 'SM-A546B' },
    { b: 'Samsung', m: 'Galaxy A34 5G', d: 6.6, r: '19.5:9', a: 'SM-A346B' },
    { b: 'Samsung', m: 'Galaxy A15', d: 6.5, r: '19.5:9', a: 'SM-A155F' },
    { b: 'Samsung', m: 'Galaxy A53 5G', d: 6.5, r: '20:9', a: 'SM-A536B' },
    { b: 'Samsung', m: 'Galaxy A73 5G', d: 6.7, r: '20:9', a: 'SM-A736B' },
    { b: 'Samsung', m: 'Galaxy A52s 5G', d: 6.5, r: '20:9', a: 'SM-A528B' },
    { b: 'Samsung', m: 'Galaxy A52', d: 6.5, r: '20:9', a: 'SM-A525F' },
    { b: 'Samsung', m: 'Galaxy A72', d: 6.7, r: '20:9', a: 'SM-A725F' },
    { b: 'Samsung', m: 'Galaxy A51', d: 6.5, r: '20:9', a: 'SM-A515F' },
    { b: 'Samsung', m: 'Galaxy A71', d: 6.7, r: '20:9', a: 'SM-A715F' },
    { b: 'Samsung', m: 'Galaxy A50', d: 6.4, r: '19.5:9', a: 'SM-A505F' },

    // GOOGLE
    { b: 'Google', m: 'Pixel 8 Pro', d: 6.7, r: '20:9', a: 'GC3VE' },
    { b: 'Google', m: 'Pixel 8', d: 6.2, r: '20:9', a: 'GKWS6' },
    { b: 'Google', m: 'Pixel 7 Pro', d: 6.7, r: '19.5:9', a: 'GE2AE' },
    { b: 'Google', m: 'Pixel 7', d: 6.3, r: '20:9', a: 'GVU6C' },
    { b: 'Google', m: 'Pixel 6 Pro', d: 6.7, r: '19.5:9', a: 'GLU0G' },
    { b: 'Google', m: 'Pixel 6', d: 6.4, r: '20:9', a: 'GR1YH' },
    { b: 'Google', m: 'Pixel 5', d: 6.0, r: '19.5:9', a: 'GD1YQ' },
    { b: 'Google', m: 'Pixel 4a', d: 5.8, r: '19.5:9', a: 'G025J' },

    // ONEPLUS
    { b: 'OnePlus', m: 'OnePlus 12', d: 6.82, r: '19.8:9', a: 'CPH2581' },
    { b: 'OnePlus', m: 'OnePlus 11', d: 6.7, r: '20:9', a: 'CPH2449' },
    { b: 'OnePlus', m: 'OnePlus 10 Pro', d: 6.7, r: '20:9', a: 'NE2213' },
    { b: 'OnePlus', m: 'OnePlus 9 Pro', d: 6.7, r: '20:9', a: 'LE2123' },
    { b: 'OnePlus', m: 'OnePlus 8 Pro', d: 6.78, r: '19.8:9', a: 'IN2023' },
    { b: 'OnePlus', m: 'OnePlus 7 Pro', d: 6.67, r: '19.5:9', a: 'GM1913' },
    { b: 'OnePlus', m: 'Nord 3', d: 6.74, r: '20:9', a: 'CPH2493' },

    // XIAOMI
    { b: 'Xiaomi', m: 'Xiaomi 14 Ultra', d: 6.73, r: '20:9', a: '24030PN60G' },
    { b: 'Xiaomi', m: 'Xiaomi 13 Pro', d: 6.73, r: '20:9', a: '2210132G' },
    { b: 'Xiaomi', m: 'Redmi Note 13 Pro+', d: 6.67, r: '20:9', a: '23090RA98G' },
    { b: 'Xiaomi', m: 'Redmi Note 12 Pro', d: 6.67, r: '20:9', a: '22101316G' },
    { b: 'Xiaomi', m: 'POCO F5', d: 6.67, r: '20:9', a: '23049PCD8G' },
];

const csvHeader = 'Brand,Model,Aliases,Diagonal(inch),Width(mm),Height(mm)\n';
const csvRows = phones.map(p => {
    const dim = calcDim(p.d, p.r);
    return `${p.b},${p.m},"${p.a}",${p.d},${dim.width},${dim.height}`;
});

const content = csvHeader + csvRows.join('\n');
fs.writeFileSync('d:/repairos/phones_pro_dataset.csv', content);
console.log('✅ Generated phones_pro_dataset.csv with ' + phones.length + ' models.');
