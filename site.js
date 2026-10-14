// Content and language navigation are usable without JavaScript.
const languageLink = document.querySelector('[data-language-switch]');
if (languageLink) {
  languageLink.addEventListener('click', () => {
    const section = window.location.hash;
    if (/^#[a-z-]+$/.test(section)) {
      const destination = new URL(languageLink.href);
      destination.hash = section;
      languageLink.href = destination.href;
    }
  });
}
const navLinks = [...document.querySelectorAll('.main-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const entry = entries.filter(item => item.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!entry) return;
    navLinks.forEach(link => {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.1, 0.5]});
  sections.forEach(section => observer.observe(section));
}
