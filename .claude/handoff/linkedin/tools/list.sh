#!/bin/zsh
cd "${0:A:h}"; L() { node li2.mjs "$@"; }
L eval '(()=>{const e=[...document.querySelectorAll("button, div[role=button], a")].find(e=>/^Start a post$/.test((e.innerText||"").trim()));e.scrollIntoView({block:"center"});return 1})()' >/dev/null
sleep 1; L click '^Start a post$' >/dev/null; sleep 4
xy=$(L find '^\d+$' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s).filter(o=>o.tag=="SPAN"&&o.y>300&&o.x>800);console.log(a.length?(a[0].x-15)+" "+a[0].y+" n="+a[0].text:"")})')
echo "clock: $xy"; L clickxy ${=${xy% n=*}} >/dev/null; sleep 3; L click '^Scheduled \(\d+\)$' >/dev/null; sleep 4
for i in 1 2 3 4; do
  L eval '(()=>{const h=[...document.querySelectorAll("span")].filter(e=>/^Posting \w+, \w+ \d+, 2026 at/.test((e.innerText||"").trim()));return h.map(e=>{let it=e;while(it&&!/Feed post/.test(it.innerText||""))it=it.parentElement;const t=(it?it.innerText:"").split("\n").map(x=>x.trim()).filter(x=>x&&!/^Posting|^Feed post/.test(x));return e.innerText.trim().replace(/^Posting /,"").replace(/, 2026 at 11:30 AM/,"")+" | "+(t[0]||"").slice(0,60)})})()'
  L eval '(()=>{const h=[...document.querySelectorAll("span")].filter(e=>/^Posting \w+, \w+ \d+, 2026 at/.test((e.innerText||"").trim()));if(h.length)h[h.length-1].scrollIntoView({block:"start"});return 1})()' >/dev/null; sleep 1.5
done
