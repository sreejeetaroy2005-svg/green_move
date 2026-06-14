const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules') {
      fixFiles(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically target backslash + backtick
      if (content.includes('\`') || content.includes('\$')) {
        console.log('Fixing: ' + fullPath);
        content = content.replace(/\`/g, '`');
        content = content.replace(/\\$/g, '$');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

fixFiles(__dirname);
console.log('Done');
