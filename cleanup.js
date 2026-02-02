
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('Deleted dist folder');
} else {
    console.log('dist folder not found');
}
