import fs from 'fs';
import path from 'path';

const SOGNI_REGEX = /Sogni/g;
const SOGNI_DIGITALI_REGEX = /Sogni Digitali/ig;
const SOGNI_LOWER_REGEX = /sogni/g;
const BELLE_REGEX = /BELLE E RIBELLE/ig;
const BELLE_LOWER_REGEX = /belle e ribelle/ig;
const DIGITALISOGNI_REGEX = /digitalisogni/g;

function walkAndReplace(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walkAndReplace(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.json')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(SOGNI_DIGITALI_REGEX, 'Nexus Agency');
      content = content.replace(/SOGNI DIGITALI/g, 'NEXUS AGENCY');
      content = content.replace(/SOGNI/g, 'NEXUS');
      content = content.replace(SOGNI_REGEX, 'Nexus');
      content = content.replace(SOGNI_LOWER_REGEX, 'nexus');
      content = content.replace(BELLE_LOWER_REGEX, 'mock client corp');
      content = content.replace(BELLE_REGEX, 'MOCK CLIENT CORP');
      content = content.replace(DIGITALISOGNI_REGEX, 'mockuser');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

walkAndReplace('./src');
walkAndReplace('./lib'); // if exists
walkAndReplace('./public'); // if exists
