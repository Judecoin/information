(function () {
  document.querySelectorAll('.copy-btn').forEach(function (button) {
    button.addEventListener('click', async function () {
      const shell = button.closest('.code-shell');
      const code = shell ? shell.querySelector('pre code') : null;
      if (!code) return;
      const text = code.innerText;
      try {
        await navigator.clipboard.writeText(text);
        const old = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () { button.textContent = old; }, 1200);
      } catch (e) {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  });
})();
(function(){
  const links=Array.from(document.querySelectorAll('.toc-link[href^="#"]'));
  function openForTarget(target){
    const el=document.getElementById(target);
    if(!el)return null;
    const details=el.closest('details.doc-section');
    if(details)details.open=true;
    return el;
  }
  links.forEach(function(link){
    link.addEventListener('click',function(event){
      const id=decodeURIComponent(link.getAttribute('href').slice(1));
      const el=openForTarget(id);
      if(!el)return;
      event.preventDefault();
      el.scrollIntoView({behavior:'smooth',block:'start'});
      history.replaceState(null,'','#'+id);
      links.forEach(function(item){item.classList.toggle('active',item===link);});
    });
  });
  const observed=links.map(function(link){return document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));}).filter(Boolean);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(function(entries){
      const visible=entries.filter(function(entry){return entry.isIntersecting;}).sort(function(a,b){return b.intersectionRatio-a.intersectionRatio;})[0];
      if(!visible)return;
      const id=visible.target.id;
      links.forEach(function(link){link.classList.toggle('active',link.getAttribute('href')==='#'+id);});
    },{rootMargin:'-140px 0px -60% 0px',threshold:[0.04,0.12,0.22]});
    observed.forEach(function(el){observer.observe(el);});
  }
})();
