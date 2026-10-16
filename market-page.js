const exampleToggle = document.getElementById('website-examples-toggle');
if (exampleToggle) exampleToggle.addEventListener('click', () => {
  const examples = document.getElementById('website-examples');
  examples.hidden = !examples.hidden;
  exampleToggle.setAttribute('aria-expanded', String(!examples.hidden));
});
function openMarketFromHash() {
  if (location.hash === '#market') document.getElementById('market-tab')?.click();
}
openMarketFromHash();
window.addEventListener('hashchange', openMarketFromHash);
