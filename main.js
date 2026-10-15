const $=s=>document.querySelector(s);
const m=$('.menu'),l=$('#navlinks');
m.addEventListener('click',()=>{const o=l.classList.toggle('open');m.setAttribute('aria-expanded',o)});
l.addEventListener('click',e=>{if(e.target.tagName==='A'){l.classList.remove('open');m.setAttribute('aria-expanded',false)}});
$('.signup').addEventListener('submit',e=>{e.preventDefault();e.target.querySelector('.ok').hidden=false});
// rotating verdict word
const w=[...document.querySelectorAll('[data-rot] b')];let i=0;w[0].classList.add('on');
if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{w[i].classList.replace('on','out');const p=w[i];setTimeout(()=>p.classList.remove('out'),700);i=(i+1)%w.length;w[i].classList.add('on')},2200);
// hide nav on scroll down
let y=0;const n=$('[data-nav]');addEventListener('scroll',()=>{const c=scrollY;n.classList.toggle('hide',c>y&&c>200&&!l.classList.contains('open'));y=c},{passive:true});
// scroll reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
