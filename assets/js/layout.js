/* En-tête et pied de page mutualisés — source unique pour les 5 pages.
   Injectés au chargement dans les conteneurs [data-site-header] et
   [data-site-footer]. Le balisage est ici en gabarit JS (pas de fetch) :
   aucune requête réseau, aucune dépendance au cache, et un seul endroit à
   modifier pour faire évoluer le menu ou le pied de page.

   Note : les liens de navigation sont donc injectés par JS et non présents
   dans le HTML initial. Acceptable ici (contenu indexable dans chaque page),
   à garder en tête pour le référencement si le site grossit. */

/* Note : « Compose ta mélodie » (jeu-melodie.html) n'est volontairement PAS
   dans le menu — c'est un easter egg qui ne s'ouvre qu'en cliquant le toucan
   de la page d'accueil. La page reste servie et référencée (sitemap), elle
   n'est simplement pas exposée dans la navigation. */
const NAV = [
  { key: "index", href: "index.html", label: "Accueil" },
  { key: "programmation", href: "programmation.html", label: "Au programme" },
  { key: "principe", href: "principe.html", label: "Le festival" },
  { key: "infos", href: "infos.html", label: "Infos pratiques" },
  { key: "contact", href: "contact.html", label: "Contact" },
];

/* Bouton d'action à droite du menu — spécifique à chaque page. */
const CTA = {
  index: { label: "Comment venir", href: "infos.html" },
  programmation: { label: "Comment venir", href: "infos.html" },
  infos: { label: "Itinéraire", href: "https://maps.app.goo.gl/QZw5W5pmu2b2eQoy6", external: true },
  principe: { label: "La soirée", href: "programmation.html" },
  "jeu-melodie": { label: "Comment venir", href: "infos.html" },
  contact: { label: "Devenir bénévole", href: "#benevole" },
};

/* Clé de la page courante d'après le nom de fichier (index par défaut). */
function currentPage() {
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return file.replace(/\.html$/, "") || "index";
}

function headerHtml(page) {
  const links = NAV.map((item) => {
    const current = item.key === page ? ' aria-current="page"' : "";
    return `<li><a class="main-nav__link" href="${item.href}"${current}>${item.label}</a></li>`;
  }).join("");

  const cta = CTA[page] || CTA.index;
  const ctaAttrs = cta.external ? ' rel="noopener noreferrer" target="_blank"' : "";

  return `
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="index.html" aria-label="Accueil — À Dos d'Arts">
        <span class="brand__mark"><img src="assets/img/elements/toucan.svg" alt="" width="40" height="40" /></span>
        À Dos d'Arts
      </a>
      <nav class="main-nav" id="main-nav" data-main-nav aria-label="Navigation principale">
        <ul class="main-nav__list">${links}</ul>
      </nav>
      <div class="header-actions">
        <a class="btn btn--primary btn--sm" href="${cta.href}"${ctaAttrs}>${cta.label}</a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false"
          aria-controls="main-nav" aria-label="Ouvrir le menu">
          <span class="nav-toggle__bar" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>`;
}

function footerHtml() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h3>À Dos d'Arts</h3>
          <p>La soirée concerts gratuite qui clôt l'été à Rouffach. 8ᵉ édition le samedi 22 août 2026.</p>
        </div>
        <div class="footer-col">
          <h3>Naviguer</h3>
          <ul>
            <li><a href="programmation.html">Au programme</a></li>
            <li><a href="infos.html">Infos pratiques</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="principe.html">Le principe du festival</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Suivre</h3>
          <ul>
            <li><a href="https://www.facebook.com/festivaladosdarts" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="https://www.instagram.com/festival_adosdarts/" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="mailto:contact@adosdarts.fr">contact@adosdarts.fr</a></li>
          </ul>
        </div>
        <!-- Colonne « Légal » : n'expose que les pages qui existent réellement
             (pas de lien mort). La page Accessibilité reste à créer. -->
        <div class="footer-col">
          <h3>Légal</h3>
          <ul>
            <li><a href="mentions-legales.html">Mentions légales</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Festival À Dos d'Arts — Rouffach (68)</p>
        <p>Organisé par la Fédération des Foyers Clubs d'Alsace &amp; la CCPAROVIC</p>
      </div>
    </div>
  </footer>`;
}

/* Remplace les conteneurs vides par l'en-tête et le pied de page complets.
   À appeler avant initNav() (qui a besoin du menu présent dans le DOM). */
export function renderLayout() {
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");
  if (header) header.outerHTML = headerHtml(currentPage());
  if (footer) footer.outerHTML = footerHtml();
}
