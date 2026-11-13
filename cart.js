/* LAKKA STORIES Phase 1 cart. Customer-side only; no orders or payments are created. */
(function(){
  const KEY='lakka_stories_cart_v1';
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return []}}
  function write(items){localStorage.setItem(KEY,JSON.stringify(items));updateCount();}
  function updateCount(){const n=read().reduce((s,x)=>s+(Number(x.qty)||0),0);document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=n);}
  function add(product){if(!product||!product.id||String(product.availability||'').trim().toLowerCase()!=='available')return false;const items=read();const found=items.find(x=>String(x.id)===String(product.id));if(found)found.qty=Math.min(99,(Number(found.qty)||1)+1);else items.push({id:String(product.id),name:String(product.name||'Product'),price:Math.max(0,Number(product.price)||0),image:String(product.image||''),availability:String(product.availability||''),qty:1});write(items);return true;}
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}
  window.LakkaCart={read,write,add,updateCount,money};
  updateCount();
  document.addEventListener('DOMContentLoaded',updateCount);
})();
