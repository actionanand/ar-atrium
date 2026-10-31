// Temporary local-only audit harness. Never include these files in a production build.
import { copyFile, writeFile, rm } from 'node:fs/promises';
const files = ['public/__audit.html', 'public/__audit-axe.js'];
if (process.argv[2] === 'clean') {
  for (const file of files) await rm(file, { force: true });
} else {
  await copyFile('node_modules/axe-core/axe.min.js', files[1]);
  await writeFile(
    files[0],
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AR Atrium local accessibility audit</title><style>body{margin:0;font:14px Arial}iframe{width:100%;height:85vh;border:0}button{padding:12px}pre{white-space:pre-wrap}</style></head><body><button id="run">Run axe audit</button><pre id="result" role="status">Ready</pre><iframe title="AR Atrium audit target" id="app"></iframe><script src="__audit-axe.js"></script><script>const target=new URLSearchParams(location.search).get('route')||'/';document.getElementById('app').src=target.startsWith('/')&&!target.startsWith('//')?target:'/';document.getElementById('run').onclick=async()=>{const frame=document.getElementById('app');const w=frame.contentWindow;if(!w.axe)await new Promise((resolve,reject)=>{const script=w.document.createElement('script');script.src='/__audit-axe.js';script.onload=resolve;script.onerror=reject;w.document.head.append(script);});const r=await w.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}});document.getElementById('result').textContent=JSON.stringify({violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:r.passes.length,incomplete:r.incomplete.map(v=>v.id)},null,2);};</script></body></html>`,
  );
  console.log('Local audit: http://localhost:3043/__audit.html?route=/explore');
}
