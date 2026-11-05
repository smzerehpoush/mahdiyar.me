#!/bin/zsh
# move.sh '<old header>' 'M/D/YYYY' '<expected Posting at text>'  — date-only reschedule of one LinkedIn post; stops on any mismatch.
cd "${0:A:h}"
L() { node li2.mjs "$@"; }
waitfor() { for i in 1 2 3 4 5 6 7 8 9 10; do r=$(L find "$1"); [[ "$r" == *'"x"'* ]] && return 0; sleep 2; done; echo "ERR waiting for $1"; exit 1; }
L eval '(()=>{const e=[...document.querySelectorAll("button, div[role=button], a")].find(e=>/^Start a post$/.test((e.innerText||"").trim()));e.scrollIntoView({block:"center"});return 1})()' >/dev/null
sleep 1; L click '^Start a post$' >/dev/null
clock() { L find '^\d+$' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s).filter(o=>o.tag=="SPAN"&&o.y>300&&o.x>800);console.log(a.length?(a[0].x-15)+" "+a[0].y:"")})'; }
xy=""; for i in 1 2 3 4 5 6 7 8 9 10; do xy=$(clock); [[ -n "$xy" ]] && break; sleep 2; done
[[ -n "$xy" ]] || { echo "ERR no composer clock"; exit 1; }
L clickxy ${=xy} >/dev/null
waitfor '^Scheduled \(\d+\)$'
L click '^Scheduled \(\d+\)$' >/dev/null
waitfor '^Posting \w+, \w+ \d+, 2026 at'
hy=""
for i in 1 2 3 4 5 6 7 8; do
  # Scroll the row to the top: a row low in the list sits outside the dialog's visible area, and a click there closes it (2026-11-05). Alternate with centre: a row at the very top can end up under the dialog header.
  L eval '(()=>{const h=[...document.querySelectorAll("span")].find(e=>(e.innerText||"").trim()==="'"$1"'");if(h)h.scrollIntoView({block:"'"$([[ $((i%2)) == 1 ]] && echo start || echo center)"'"});return !!h})()' >/dev/null; sleep 1
  hy=$(L find "^$1\$" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s).filter(o=>o.tag=="SPAN"&&o.y>40&&o.y<600);console.log(a.length==1?a[0].y:"")})')
  [[ -n "$hy" ]] && break
  L eval '(()=>{const h=[...document.querySelectorAll("span")].filter(e=>/^Posting \w+, \w+ \d+, 2026 at/.test((e.innerText||"").trim()));if(h.length)h[h.length-1].scrollIntoView({block:"start"});return h.length})()' >/dev/null; sleep 1.5
done
[[ -n "$hy" ]] || { echo "ERR header not unique/visible"; exit 1; }
bx=$(L findl '^More options$' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s).filter(o=>Math.abs(o.y-'"$hy"')<=10);console.log(a.length==1?a[0].x+" "+a[0].y:"")})')
[[ -n "$bx" ]] || { echo "ERR no single More options at y=$hy"; exit 1; }
sleep 1; L clickxy ${=bx} >/dev/null; echo "menu for $1 at $bx"; sleep 1; [[ "$(L find "^Modify schedule$")" == *\"x\"* ]] || { sleep 1; L clickxy ${=bx} >/dev/null; echo "retry click"; }
waitfor '^Modify schedule$'
L click '^Modify schedule$' >/dev/null
waitfor '^Posting at'
L eval '(()=>{const i=[...document.querySelectorAll("input")].find(x=>x.offsetParent&&/^\d+\/\d+\/2026$/.test(x.value));i.focus();i.select();return i.value})()' >/dev/null
L type "$2" >/dev/null; L key Tab >/dev/null; sleep 1
# Confirm can stay disabled until the time is re-entered too (seen 2026-11-02).
L eval '(()=>{const i=[...document.querySelectorAll("input")].find(x=>x.offsetParent&&/^\d+:\d+ ?(AM|PM)$/.test(x.value));i.focus();i.select();return i.value})()' >/dev/null
L type "11:30 AM" >/dev/null; L key Tab >/dev/null; sleep 1
pa=$(L find '^Posting at' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);console.log(a[0].x+" "+a[0].y+"|"+a[0].text)})')
L clickxy ${=pa%%|*} >/dev/null; sleep 1.5
got=$(L find '^Posting at' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)[0].text))')
echo "dialog: $got"
[[ "$got" == "$3" ]] || { echo "ERR expected $3"; L key Escape >/dev/null; exit 1; }
cd_=$(L eval '(()=>{const b=[...document.querySelectorAll("button")].find(x=>x.offsetParent&&(x.innerText||"").trim()==="Confirm");return b?String(!!(b.disabled||b.getAttribute("aria-disabled")==="true")):"none"})()')
[[ "$cd_" == '"false"' ]] || { echo "ERR Confirm not enabled ($cd_)"; exit 1; }
L click '^Confirm$' >/dev/null
waitfor '^Schedule$'
got2=$(L find '^Posting at' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)[0].text))')
[[ "$got2" == "$3"* ]] || { echo "ERR composer shows $got2"; exit 1; }
L click '^Schedule$'
sleep 4
echo "OK $1 -> $3"
