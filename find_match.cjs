const fs=require('fs');
const s=fs.readFileSync('app/admin/dashboard/page.jsx','utf8');
const lines = s.split(/\r?\n/);
let startLine=-1;
for (let i=0;i<lines.length;i++){
  if (lines[i].includes('export default function AdminDashboard')){ startLine = i+1; break }
}
if (startLine===-1){ console.log('start not found'); process.exit(1) }
let open=0; let found=-1;
for (let i=startLine-1;i<lines.length;i++){
  for (const ch of lines[i]){
    if (ch==='{' ) open++;
    else if (ch==='}') { open--; if (open===0){ found = i+1; break } }
  }
  if (found!==-1) break
}
console.log('function starts at',startLine,'and closes at',found);
if (found!==-1) console.log('closing line content:', lines[found-1].trim());