(function(){"use strict";
function ready(f){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",f,{once:true}):f()}
function https(){var h=window.location.hostname,l=!h||h==="localhost"||h==="127.0.0.1"||h==="0.0.0.0";if(window.location.protocol==="http:"&&!l)window.location.replace("https://"+window.location.host+window.location.pathname+window.location.search+window.location.hash)}
var langs=[["en","English"],["zh-TW","繁體中文"],["de","Deutsch"],["ja","日本語"],["ko","한국어"],["it","Italiano"],["nl","Nederlands"],["ru","русский язык"],["es","Español"]];
var codes=langs.map(function(x){return x[0]});
function cleanPageName(name){name=(name||"index.html").split("#")[0].split("?")[0];if(!name||name.indexOf(".")<0)return"index.html";return name}
function currentInfo(){
  var doc=document.documentElement;
  var lang=(doc.getAttribute("data-lang-code")||doc.getAttribute("lang")||"en").trim();
  if(codes.indexOf(lang)<0)lang="en";
  var page=cleanPageName(doc.getAttribute("data-current-page")||doc.getAttribute("data-page"));
  var path=(window.location.pathname||"").replace(/\\/g,"/");
  var last=path.split("/").filter(Boolean).pop()||"";
  if(!doc.getAttribute("data-current-page")&&!doc.getAttribute("data-page")&&/\.html$/.test(last))page=cleanPageName(decodeURIComponent(last));
  return{lang:lang,page:page,inLang:lang!=="en"};
}
function langHref(target){
  var info=currentInfo(),page=info.page||"index.html",up=info.inLang?"../":"";
  if(target==="en")return up+page;
  return up+target+"/"+page;
}
function initLangSwitch(){
  var info=currentInfo();
  document.documentElement.setAttribute("data-selected-language",info.lang);
  if(document.body)document.body.setAttribute("data-selected-lang",info.lang);
  document.querySelectorAll(".lang-menu a[data-lang], .mobile-language-option[data-lang]").forEach(function(a){
    var c=a.getAttribute("data-lang");
    a.setAttribute("href",langHref(c));
    if(c===info.lang){a.classList.add("active");a.setAttribute("aria-current","true")}else{a.classList.remove("active");a.removeAttribute("aria-current")}
  });
  document.querySelectorAll(".lang-button,.language-current").forEach(function(b){
    var name=(langs.find(function(x){return x[0]===info.lang})||langs[0])[1];
    b.textContent="";b.appendChild(document.createTextNode(name+" "));
    var s=document.createElement("span");s.setAttribute("aria-hidden","true");s.textContent="⌃";b.appendChild(s);b.setAttribute("aria-expanded","false")
  });
  document.querySelectorAll(".lang-switch").forEach(function(box){
    var btn=box.querySelector(".lang-button,.language-current");
    if(btn){btn.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var open=box.classList.toggle("is-open");btn.setAttribute("aria-expanded",String(open))})}
  });
  document.addEventListener("click",function(e){if(e.target.closest(".lang-switch"))return;document.querySelectorAll(".lang-switch.is-open").forEach(function(b){b.classList.remove("is-open");var btn=b.querySelector(".lang-button,.language-current");if(btn)btn.setAttribute("aria-expanded","false")})});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")document.querySelectorAll(".lang-switch.is-open").forEach(function(b){b.classList.remove("is-open")})});
}
function init(){var header=document.querySelector(".site-header,.header");if(!header)return;var nav=header.querySelector(".nav");var actions=header.querySelector(".header-actions,.actions")||header;var download=header.querySelector('.header-actions a.btn-primary,.actions a.btn-primary,a[href="downloads.html"]');if(download){download.classList.add("header-download-link");download.setAttribute("aria-label",download.getAttribute("aria-label")||"Download Wallet");download.setAttribute("title",download.getAttribute("title")||"Download Wallet")}var toggle=header.querySelector("[data-mobile-menu-toggle]");if(!toggle){toggle=document.createElement("button");toggle.className="mobile-menu-toggle";toggle.type="button";toggle.setAttribute("data-mobile-menu-toggle","");toggle.setAttribute("aria-label","Open navigation");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","mobileNav");toggle.innerHTML="<span></span><span></span><span></span>";actions.appendChild(toggle)}var panel=document.getElementById("mobileNav");if(!panel){panel=document.createElement("aside");panel.id="mobileNav";panel.className="mobile-nav-panel";panel.setAttribute("aria-hidden","true");panel.setAttribute("aria-label","Mobile navigation");var inner=document.createElement("div");inner.className="mobile-nav-inner";if(nav){Array.prototype.forEach.call(nav.querySelectorAll(".nav-item"),function(item){var group=document.createElement("section");group.className="mobile-nav-group";var title=document.createElement("strong"),tb=item.querySelector(".nav-button");title.textContent=tb?tb.textContent.trim().replace(/[⌄⌃]/g,""):"Navigation";group.appendChild(title);Array.prototype.forEach.call(item.querySelectorAll(".dropdown a"),function(link){var clone=link.cloneNode(true);clone.removeAttribute("style");group.appendChild(clone)});inner.appendChild(group)})}var lang=document.createElement("section");lang.className="mobile-nav-group mobile-language-group notranslate";lang.setAttribute("translate","no");var langTitle=document.createElement("strong");langTitle.textContent="Language";lang.appendChild(langTitle);var grid=document.createElement("div");grid.className="mobile-language-grid";var info=currentInfo();langs.forEach(function(item){var a=document.createElement("a");a.className="mobile-language-option notranslate";a.setAttribute("translate","no");a.setAttribute("data-lang",item[0]);a.setAttribute("href",langHref(item[0]));a.textContent=item[1];if(item[0]===info.lang){a.classList.add("active");a.setAttribute("aria-current","true")}grid.appendChild(a)});lang.appendChild(grid);inner.appendChild(lang);panel.appendChild(inner);header.insertAdjacentElement("afterend",panel)}function setOpen(open){document.body.classList.toggle("mobile-nav-open",open);toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Close navigation":"Open navigation");panel.setAttribute("aria-hidden",String(!open))}toggle.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();setOpen(!document.body.classList.contains("mobile-nav-open"))});panel.addEventListener("click",function(e){if(e.target.closest("a"))setOpen(false)});document.addEventListener("click",function(e){if(!document.body.classList.contains("mobile-nav-open"))return;if(panel.contains(e.target)||toggle.contains(e.target))return;setOpen(false)});document.addEventListener("keydown",function(e){if(e.key==="Escape")setOpen(false)});window.addEventListener("resize",function(){if(window.innerWidth>1040)setOpen(false)},{passive:true});}
https();ready(function(){initLangSwitch();init()});})();
