export function getRoute(){
  const hash = location.hash || '#/habits';
  const route = hash.replace('#','');
  return route.startsWith('/') ? route : '/habits';
}

export function setActiveTab(){
  document.querySelectorAll('[data-route]').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    const isActive = href === location.hash || (location.hash==='' && href==='#/habits');
    a.classList.toggle('active', isActive);
  });
}

