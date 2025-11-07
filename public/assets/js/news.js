async function loadNews() {
  try {
    const res = await fetch('http://localhost:3000/posts')

    const posts = await res.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      document.getElementById('newsList').innerHTML =
        '<p class="text-center text-gray-500 col-span-full">Yangiliklar mavjud emas.</p>';
      return;
    }

    document.getElementById('newsList').innerHTML = posts.map(p => `
      <article class="bg-lightBg rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-default group w-full">
        <img src="${p.image_url || 'https://placehold.co/600x400/e2e8f0/4a5568?text=No+Image'}"
             alt="${p.title}" class="w-full h-48 object-cover transition-default group-hover:scale-105">
        <div class="p-6">
          <time class="text-sm text-secondary">${new Date(p.created_at).toISOString().slice(0,10)}</time>
          <h2 class="text-xl font-bold mt-2 mb-2 text-gray-800">${p.title}</h2>
          <p class="text-secondary text-sm leading-relaxed">${p.content}</p>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('Error loading news:', err);
    document.getElementById('newsList').innerHTML =
      '<p class="text-center text-red-500 col-span-full">Xatolik yuz berdi.</p>';
  }
}

loadNews();