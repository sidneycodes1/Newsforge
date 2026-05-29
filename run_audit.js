const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = path.join(dir, file);
    if (name.includes('node_modules') || name.includes('.next') || name.includes('agent\\dist') || name.includes('agent/dist')) continue;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.json')) {
        files.push(name);
      }
    }
  }
  return files;
}

const allFiles = getFiles('.');
let output = '';

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  
  let deps = new Set();
  const importRegex = /import .*? from ["'](.*?)["']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    deps.add(match[1]);
  }
  
  const requireRegex = /require\(["'](.*?)["']\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    deps.add(match[1]);
  }
  
  const depsStr = deps.size > 0 ? Array.from(deps).join(', ') : 'None';
  
  let type = 'Script';
  if (file.endsWith('.tsx')) type = 'React Component';
  else if (file.endsWith('.ts')) type = 'TypeScript';
  else if (file.endsWith('.json')) type = 'Config/Data';
  
  output += 'FILE: ' + file.replace(/\\/g, '/') + '\n';
  output += 'TYPE: ' + type + '\n';
  output += 'SIZE: ' + lines + ' lines\n';
  output += 'DEPENDENCIES: ' + depsStr + '\n';
  output += '---\n';
}

fs.writeFileSync('audit_summary.txt', output, 'utf8');
console.log('Done!');
