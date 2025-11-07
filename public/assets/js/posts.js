/* return EVERY post that exists: server + localStorage backup */
async function getAllPosts(type){
  let remote = [];
  try{                                   // 1.  try server
     const r = await fetch('/api/'+type);
     if(r.ok) remote = await r.json();
  }catch(e){}

  let local = [];
  try{                                   // 2.  merge with localStorage
     const all = JSON.parse(localStorage.getItem('adminPosts')||'[]');
     local = all.filter(p => p.type === type);
  }catch(e){}

  const together = [...remote, ...local];           // 3.  de-duplicate by id
  return together.filter((p,idx,arr)=> arr.findIndex(x=>x.id===p.id)===idx);
}