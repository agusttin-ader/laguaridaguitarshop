const fs=require('fs');
const s=fs.readFileSync('app/admin/dashboard/page.jsx','utf8');
const lines = s.split(/\r?\n/);
let open=0, close=0;
for (let i=0;i<lines.length;i++){
	const line = lines[i];
	for (const ch of line){
		if (ch === '{') open++;
		else if (ch === '}') close++;
		if (close > open) {
			console.log('Imbalance at line', i+1, 'char', line.indexOf('}')+1);
			console.log('Line content:', line.trim());
			process.exit(0);
		}
	}
}
console.log('No early imbalance. Totals -> { :',open,', } :',close);
