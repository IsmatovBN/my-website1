async function loadProjects() {
  const res = await fetch('http://localhost:3000/posts')
  const projects = await res.json();
  document.getElementById('projectList').innerHTML = projects.map(
    p => `<div><h3>${p.title}</h3><p>${p.description}</p></div>`
  ).join('');
}
loadProjects();