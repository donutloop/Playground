import { createElement, useState, useEffect } from 'https://esm.sh/react@18.2.0?dev';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client?dev';
import htm from 'https://esm.sh/htm@3.1.1';

// Initialize htm with React
const html = htm.bind(createElement);

// --- Configuration ---
const COMPANIES = [
    {
        id: 'ionq',
        name: 'IonQ',
        type: 'direct',
        url: 'https://ionq.com/news',
        logo: 'https://ionq.com/favicon.ico'
    },
    {
        id: 'rigetti',
        name: 'Rigetti',
        type: 'direct',
        url: 'https://www.rigetti.com/news'
    },
    {
        id: 'dwave',
        name: 'D-Wave',
        type: 'direct',
        url: 'https://dwavequantum.com/company/newsroom/'
    },
    {
        id: 'quantinuum',
        name: 'Quantinuum',
        type: 'direct',
        url: 'https://www.quantinuum.com/news'
    },
    {
        id: 'psiquantum',
        name: 'PsiQuantum',
        type: 'direct',
        url: 'https://www.psiquantum.com/news'
    }
];

// --- Utilities ---
const fetchWithFallback = async (url) => {
    // Rotating proxies to bypass simple blocks
    const proxies = [
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];

    for (const proxyGen of proxies) {
        try {
            const proxyUrl = proxyGen(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Proxy ${proxyUrl} failed`);
            const data = await response.json();

            // Normalize response: allorigins uses .contents, codetabs returns raw JSON/HTML
            // If data has .contents, use it. If data IS the content (codetabs often returns raw), use data.
            let content = data.contents || data;

            // Type check: content should be string for HTML parsing
            if (typeof content !== 'string') {
                content = JSON.stringify(content); // Fallback if API returns JSON
            }

            return { contents: content };
        } catch (e) {
            console.warn(`Proxy failed`, e);
            continue;
        }
    }
    throw new Error('All proxies failed');
};

const fetchUrl = async (url) => {
    return await fetchWithFallback(url);
};

// --- Parsers ---
const parseIonQ = (htmlString) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const items = [];
        const nodes = doc.querySelectorAll('a[href^="/news/"]');
        nodes.forEach(node => {
            const title = node.innerText.trim();
            if (title && title.length > 20) {
                items.push({
                    title: title,
                    link: 'https://ionq.com' + node.getAttribute('href'),
                    date: 'Recent'
                });
            }
        });
        return Array.from(new Set(items.map(i => JSON.stringify(i)))).map(s => JSON.parse(s)).slice(0, 5);
    } catch (e) {
        console.error("Parse Error IonQ", e);
        return [];
    }
};

const parseRigetti = (htmlString) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const items = [];
        // Rigetti: Titles are h3, links are often "Learn More" or external
        const h3s = doc.querySelectorAll('h3');
        h3s.forEach(h3 => {
            const title = h3.innerText.trim();
            if (title.length < 10) return;

            // Look for link in same container or next sibling
            let link = 'https://www.rigetti.com/news';

            // Strategy: Search forwards for the next 'a' tag
            let next = h3.nextElementSibling;
            while (next && next.tagName !== 'H3') {
                const a = next.querySelector('a') || (next.tagName === 'A' ? next : null);
                if (a && a.href) {
                    link = a.href; // Likely the "Learn More" link
                    break;
                }
                next = next.nextElementSibling;
            }

            items.push({
                title: title,
                link: link,
                date: 'Recent'
            });
        });
        return items.slice(0, 5);
    } catch (e) {
        console.error("Parse Error Rigetti", e);
        return [];
    }
};

const parseDWave = (htmlString) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const items = [];
        const nodes = doc.querySelectorAll('a');
        nodes.forEach(node => {
            const href = node.getAttribute('href');
            if (href && (href.includes('/news/') || href.includes('/press-release/'))) {
                const title = node.innerText.trim();
                if (title.length > 20) {
                    items.push({
                        title: title,
                        link: href.startsWith('http') ? href : 'https://dwavequantum.com' + href,
                        date: 'Recent'
                    });
                }
            }
        });
        return Array.from(new Set(items.map(i => JSON.stringify(i)))).map(s => JSON.parse(s)).slice(0, 5);
    } catch (e) {
        console.error("Parse Error D-Wave", e);
        return [];
    }
};

const parseQuantinuum = (htmlString) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const items = [];
        // Robust selector: .title_wrap OR just a text match
        const cards = doc.querySelectorAll('.news_card_wrap');

        if (cards.length === 0) {
            // Fallback: look for ANY link to press-releases
            const links = doc.querySelectorAll('a[href*="/press-releases/"]');
            links.forEach(a => {
                const title = a.innerText.trim();
                // "Read our announcement" is not a title.
                // If text is generic, look at parent or sibling?
                // This fallback is risky.
            });
        }

        cards.forEach(card => {
            const titleElem = card.querySelector('.title_wrap');
            const linkElem = card.querySelector('a'); // Any link in card
            const dateElem = card.querySelector('.blog_eyebrow');

            if (titleElem) {
                const title = titleElem.innerText.trim();
                const link = linkElem ? linkElem.getAttribute('href') : '';
                const date = dateElem ? dateElem.innerText.trim() : 'Recent';

                if (title) {
                    items.push({
                        title: title,
                        link: link.startsWith('http') ? link : 'https://www.quantinuum.com' + link,
                        date: date
                    });
                }
            }
        });
        return items.slice(0, 5);
    } catch (e) {
        console.error("Parse Error Quantinuum", e);
        return [];
    }
};

const parsePsiQuantum = (htmlString) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        // Check for CSR placeholder
        if (htmlString.includes('Loading articles') || htmlString.length < 5000) {
            // Fallback for CSR
            return [{
                title: "Latest News (Visit Site)",
                link: "https://www.psiquantum.com/news",
                date: "Live"
            }];
        }

        const items = [];
        const nodes = doc.querySelectorAll('a');
        nodes.forEach(node => {
            const href = node.getAttribute('href');
            if (href && (href.includes('/news/') || href.includes('/press/'))) {
                const title = node.innerText.trim();
                if (title.length > 25) {
                    items.push({
                        title: title,
                        link: href.startsWith('http') ? href : 'https://www.psiquantum.com' + href,
                        date: 'Recent'
                    });
                }
            }
        });
        return items.length ? Array.from(new Set(items.map(i => JSON.stringify(i)))).map(s => JSON.parse(s)).slice(0, 5) : [{
            title: "No articles found (Click to Open)",
            link: "https://www.psiquantum.com/news",
            date: "Check"
        }];
    } catch (e) {
        return [{ title: "Access Error (Visit Site)", link: "https://www.psiquantum.com/news", date: "Error" }];
    }
};

// --- Components ---

const NewsCard = ({ company }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const loadNews = async () => {
            try {
                let data = [];
                // Direct scraping for everyone now
                const result = await fetchUrl(company.url);
                const content = result.contents;

                if (company.id === 'ionq') data = parseIonQ(content);
                else if (company.id === 'rigetti') data = parseRigetti(content);
                else if (company.id === 'dwave') data = parseDWave(content);
                else if (company.id === 'quantinuum') data = parseQuantinuum(content);
                else if (company.id === 'psiquantum') data = parsePsiQuantum(content);

                if (mounted) setNews(data);
            } catch (err) {
                console.error(`Error fetching ${company.name}:`, err);
                if (mounted) setError('Failed to load updates.');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadNews();
        return () => { mounted = false; };
    }, [company]);

    return html`
        <div className="card">
            <div className="card-header">
                <span className=${`company-badge badge-${company.id}`}>${company.name}</span>
            </div>
            ${loading ? html`
                <div style=${{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loader"></div>
                </div>
            ` : error ? html`
                <div style=${{ color: 'var(--text-secondary)', textAlign: 'center' }}>${error}</div>
            ` : html`
                <ul className="news-list">
                    ${news.map((item, idx) => html`
                        <li key=${item.link || idx} className="news-item">
                            ${item.date && html`<span className="news-date">${item.date}</span>`}
                            <a href=${item.link} target="_blank" rel="noopener noreferrer" className="news-link">
                                ${item.title}
                            </a>
                        </li>
                    `)}
                    ${news.length === 0 && html`<li className="news-item" style=${{ color: 'grey' }}>No recent news found via scraper.</li>`}
                </ul>
            `}
        </div>
    `;
};

const App = () => {
    return html`
        <main>
            <header>
                <h1>Quantum Nexus</h1>
                <div className="subtitle">Live Intelligence Feed // 2025</div>
            </header>
            <div className="news-grid">
                ${COMPANIES.map(company => html`<${NewsCard} key=${company.id} company=${company} />`)}
            </div>
        </main>
    `;
};

const root = createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
