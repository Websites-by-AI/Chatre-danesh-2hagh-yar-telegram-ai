const fs = require('fs');
const code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const lines = code.split('\n');

let openDivs = 0;
let openBraces = 0;
let openParens = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let cleanLine = line.replace(/\{\/\*.*?\*\/\}/g, '').replace(/\/\/.*$/g, '');
  
  // count divs
  const openDivMatches = cleanLine.match(/<div(\s|>)/g);
  const closeDivMatches = cleanLine.match(/<\/div>/g);
  openDivs += (openDivMatches ? openDivMatches.length : 0) - (closeDivMatches ? closeDivMatches.length : 0);

  // count braces (avoid inside strings if possible, but keep it simple first)
  const openBraceMatches = cleanLine.match(/\{/g);
  const closeBraceMatches = cleanLine.match(/\}/g);
  openBraces += (openBraceMatches ? openBraceMatches.length : 0) - (closeBraceMatches ? closeBraceMatches.length : 0);

  // count parens
  const openParenMatches = cleanLine.match(/\(/g);
  const closeParenMatches = cleanLine.match(/\)/g);
  openParens += (openParenMatches ? openParenMatches.length : 0) - (closeParenMatches ? closeParenMatches.length : 0);

  if (openDivs < 0 || openBraces < 0 || openParens < 0) {
    console.log(`NEGATIVE mismatch on line ${i + 1}: divs=${openDivs}, braces=${openBraces}, parens=${openParens} | ${line.trim()}`);
  }
}

console.log(`FINAL BALANCE AT END OF FILE:
divs: ${openDivs}
braces: ${openBraces}
parens: ${openParens}
`);
