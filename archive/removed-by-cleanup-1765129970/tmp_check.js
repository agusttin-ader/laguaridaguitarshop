const fs=require('fs');
const s=fs.readFileSync('app/admin/dashboard/page.jsx','utf8');
const c1=(s.match(/{/g)||[]).length;
const c2=(s.match(/}/g)||[]).length;
const p=(s.match(/\(/g)||[]).length;
const q=(s.match(/\)/g)||[]).length;
const l=(s.match(/`/g)||[]).length;
console.log('braces { }:',c1,c2,'parens ( ):',p,q,'backticks `:',l);
