// Accurate map of both sites, derived from the real repos + Django backend.
//
// Each site has:
//  - staticPages: real Next.js files (app/.../page.tsx) verified to exist.
//    SEO for these lives in the page's `metadata` export → edited via GitHub.
//  - collections: dynamic [slug] routes (Tours, Vehicles) whose content lives
//    in the Django CMS (Experience / Carsforhire models). These are loaded at
//    runtime from the live API and edited via the CMS SEO endpoints.

export const SITES = {
  ctc: {
    id: 'ctc',
    name: 'Cape Town Concierge',
    domain: 'capetown-concierge.co.za',
    baseUrl: 'https://www.capetown-concierge.co.za',
    color: '#16a05a',
    repo: 'mohamadxnadeem/capetown-concierge',
    branch: 'main',
    staticPages: [
      { id: 'home', name: 'Homepage', path: '/', filePath: 'app/page.tsx', cat: 'Main',
        primaryKw: 'luxury chauffeur Cape Town',
        secondary: ['private chauffeur Cape Town', 'chauffeur service Cape Town'] },
      { id: 'chauffeur', name: 'Chauffeur Services', path: '/chauffeur-services', filePath: 'app/chauffeur-services/page.tsx', cat: 'Main',
        primaryKw: 'private chauffeur hire Cape Town',
        secondary: ['hire a driver Cape Town', 'personal driver Cape Town'] },
      { id: 'tours', name: 'Private Tours', path: '/private-tours', filePath: 'app/private-tours/page.tsx', cat: 'Main',
        primaryKw: 'private tours Cape Town',
        secondary: ['luxury tours Cape Town', 'Cape Town private guided tour'] },
      { id: 'airport', name: 'Airport Transfers', path: '/airport-transfers-cape-town', filePath: 'app/airport-transfers-cape-town/page.tsx', cat: 'Main',
        primaryKw: 'airport transfer Cape Town',
        secondary: ['luxury airport transfer Cape Town', 'Cape Town airport pickup'] },
      { id: 'wine-farms', name: 'Wine Farms Guide', path: '/best-wine-farms-in-cape-town', filePath: 'app/best-wine-farms-in-cape-town/page.tsx', cat: 'Main',
        primaryKw: 'best wine farms Cape Town',
        secondary: ['Cape Town wine tasting tour', 'Stellenbosch wine estates'] },
      { id: 'activities', name: 'Experiences', path: '/best-activities-to-do-in-cape-town', filePath: 'app/best-activities-to-do-in-cape-town/page.tsx', cat: 'Main',
        primaryKw: 'best things to do in Cape Town',
        secondary: ['Cape Town experiences', 'activities Cape Town tourists'] },
      { id: 'itinerary', name: '7-Day Itinerary', path: '/7-day-cape-town-itinerary', filePath: 'app/7-day-cape-town-itinerary/page.tsx', cat: 'Main',
        primaryKw: '7 day Cape Town itinerary',
        secondary: ['Cape Town travel itinerary', 'one week Cape Town'] },
      { id: 'contact', name: 'Contact', path: '/contact', filePath: 'app/contact/page.tsx', cat: 'Main',
        primaryKw: 'book luxury chauffeur Cape Town',
        secondary: ['contact Cape Town chauffeur', 'Cape Town concierge booking'] },
    ],
    collections: [
      { id: 'tours', name: 'Private Tours', cat: 'Tours', kind: 'experience',
        listPath: '/api/experiences/all/', routeBase: '/private-tours' },
      { id: 'vehicles', name: 'Vehicles', cat: 'Vehicles', kind: 'car',
        listPath: '/api/cars-for-hire/all/', routeBase: '/chauffeur-services' },
    ],
  },

  sigma: {
    id: 'sigma',
    name: 'Sigma VIP',
    domain: 'sigmachauffeur.vip',
    baseUrl: 'https://sigmachauffeur.vip',
    color: '#c9982a',
    repo: 'mohamadxnadeem/sigma-chauffeur',
    branch: 'main',
    staticPages: [
      { id: 'home', name: 'Homepage', path: '/', filePath: 'app/page.tsx', cat: 'Main',
        primaryKw: 'VIP chauffeur service Cape Town',
        secondary: ['premium chauffeur Cape Town', 'luxury transport Cape Town'] },
      { id: 'chauffeur', name: 'Chauffeur Services', path: '/chauffeur-services', filePath: 'app/chauffeur-services/page.tsx', cat: 'Main',
        primaryKw: 'chauffeur service Cape Town',
        secondary: ['professional driver Cape Town', 'private driver hire Cape Town'] },
      { id: 'wine-farms', name: 'Wine Farms Guide', path: '/best-wine-farms-in-cape-town', filePath: 'app/best-wine-farms-in-cape-town/page.tsx', cat: 'Main',
        primaryKw: 'Cape Town wine tour private driver',
        secondary: ['Stellenbosch wine tasting tour', 'Franschhoek wine farms'] },
      { id: 'activities', name: 'Cape Town Activities', path: '/best-activities-to-do-in-cape-town', filePath: 'app/best-activities-to-do-in-cape-town/page.tsx', cat: 'Main',
        primaryKw: 'Cape Town activities private tour',
        secondary: ['things to do Cape Town with driver', 'Cape Town sightseeing'] },
      { id: 'itinerary', name: '7-Day Itinerary', path: '/7-day-cape-town-itinerary', filePath: 'app/7-day-cape-town-itinerary/page.tsx', cat: 'Main',
        primaryKw: 'Cape Town 7 day travel guide',
        secondary: ['Cape Town itinerary planning', 'week in Cape Town luxury'] },
    ],
    collections: [
      { id: 'tours', name: 'Private Tours', cat: 'Tours', kind: 'experience',
        listPath: '/api/experiences/all/', routeBase: '/private-tours' },
      { id: 'vehicles', name: 'Vehicles', cat: 'Vehicles', kind: 'car',
        listPath: '/api/cars-for-hire/all/', routeBase: '/chauffeur-services' },
    ],
  },
}

export const SITE_LIST = [SITES.ctc, SITES.sigma]

// Normalise a static page config into the unified "page" shape the UI uses.
export function staticPageToEntry(site, p) {
  return {
    uid: `${site.id}:static:${p.id}`,
    id: p.id,
    type: 'static',
    name: p.name,
    path: p.path,
    filePath: p.filePath,
    cat: p.cat,
    primaryKw: p.primaryKw,
    secondary: p.secondary || [],
  }
}

// Normalise a CMS item (from /api/experiences/all/ or /api/cars-for-hire/all/)
// into the unified "page" shape. The list endpoints wrap each item, e.g.
// { experience: {...} } or { car: {...} }; we unwrap defensively.
export function cmsItemToEntry(site, collection, raw) {
  const item = raw?.experience || raw?.car || raw || {}
  const slug = item.slug || ''
  const title = item.title || 'Untitled'
  return {
    uid: `${site.id}:${collection.id}:${item.id}`,
    id: `${collection.id}-${item.id}`,
    type: 'cms',
    kind: collection.kind, // experience | car
    cmsId: item.id,
    name: title,
    slug,
    path: `${collection.routeBase}/${slug}`,
    cat: collection.cat,
    primaryKw: `${title} Cape Town`,
    secondary: [],
    seo: {
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
      short_description: item.short_description || '',
      highlight: item.highlight || '',
      body: item.body || '',
    },
  }
}
