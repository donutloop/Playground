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
        url: 'https://www.quantinuum.com/news/news#press-release'
    },
    {
        id: 'psiquantum',
        name: 'PsiQuantum',
        type: 'direct',
        url: 'https://www.psiquantum.com/news'
    }
];

// --- Utilities ---
// Rotating proxies. Direct fetch first, then Jina, then others.
const fetchWithFallback = async (url) => {
    const proxies = [
        (u) => u, // Try direct fetch first (will specificially work if user has CORS disabled or server allows)
        (u) => `https://r.jina.ai/${u}`, // Very robust for text content
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];

    for (const proxyGen of proxies) {
        try {
            const proxyUrl = proxyGen(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Proxy ${proxyUrl} failed`);

            const text = await response.text();
            let content = text;
            let isMarkdown = false;

            // Check if Jina response (it's markdown)
            // Jina usually starts with Title or URL Source metadata
            if (proxyUrl.includes('r.jina.ai')) {
                isMarkdown = true;
            } else {
                try {
                    const json = JSON.parse(text);
                    if (json.contents) {
                        content = json.contents;
                    }
                } catch (e) {
                    // Not JSON, assume raw HTML
                }
            }

            if (!content || content.length < 50) throw new Error('Empty content');

            return { contents: content, isMarkdown };
        } catch (e) {
            console.warn(`Proxy failed: ${proxyGen(url)}`, e);
            continue;
        }
    }
    throw new Error('All proxies failed');
};

const fetchUrl = async (url) => {
    return await fetchWithFallback(url);
};

// --- Parsers ---

// Helper to parse Markdown links [Title](URL)
const parseMarkdown = (mdString, domain) => {
    const items = [];

    // Quick date extraction helper
    const extractDate = (text) => {
        if (!text) return null;
        // Match DD.MM.YY, YYYY-MM-DD, Month DD, YYYY
        const dateMatch = text.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|([A-Za-z]+ \d{1,2},? \d{4})/);
        return dateMatch ? dateMatch[0] : null;
    };

    const lines = mdString.split('\n');

    // Secondary pass for Rigetti-style: ### Title 
    // AND Quantinuum-style: Title 
    // date 
    // [Read the paper](Link)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Rigetti Headers
        if (line.startsWith('### ')) {
            const title = line.replace(/^###\s+/, '').trim();
            let date = 'Recent';
            // Look backward for date
            for (let k = 1; k <= 3; k++) {
                if (i - k >= 0) {
                    const prevDate = extractDate(lines[i - k]);
                    if (prevDate) { date = prevDate; break; }
                }
            }

            // Look ahead for Link
            for (let j = 1; j < 6 && i + j < lines.length; j++) {
                const nextLine = lines[i + j];
                const linkMatch = nextLine.match(/\[(Learn More|Read more|Source|.*?)\]\((https?:\/\/[^\)]+)\)/i);
                if (linkMatch) {
                    items.push({ title, link: linkMatch[2], date });
                    break;
                }
            }
        }

        // Quantinuum "Plain text title" heuristic
        // It's hard to distinguish a title from random text, but let's look for:
        // Text line -> Date line -> [Read the paper] link
        else if (line.length > 30 && !line.startsWith('[') && !line.startsWith('![')) {
            // Potential title?
            let title = line;
            let date = 'Recent';
            let link = null;

            // Check next few lines for date and link
            for (let j = 1; j < 5 && i + j < lines.length; j++) {
                const nextLine = lines[i + j].trim();
                if (!nextLine) continue;

                const d = extractDate(nextLine);
                if (d) { date = d; continue; }

                const linkMatch = nextLine.match(/\[(Read the paper|Read more|Link text llorem)\]\((https?:\/\/[^\)[#]+)\)/i);
                if (linkMatch) {
                    link = linkMatch[2];
                    break;
                }

                // If we hit another big text block or header, abort
                if (nextLine.length > 50) break;
            }

            if (link) {
                items.push({ title, link, date });
            }
        }
    }

    // Strategy 2: Standard [Title](Link) lines, potentially with date on previous line
    for (let i = 0; i < lines.length; i++) { // Re-iterate for standard links
        const line = lines[i].trim();
        if (!line) continue;

        const linkMatch = line.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)$/);
        if (linkMatch) {
            const title = linkMatch[1].trim();
            const link = linkMatch[2].trim();

            // Filter heuristics
            if (title.length < 15) continue;
            if (title.includes('Image')) continue;
            if (title.includes('Skip to')) continue;
            if (domain && !link.includes(domain)) continue;

            // Look backward for date
            let date = 'Recent';
            for (let k = 1; k <= 3; k++) {
                if (i - k >= 0) {
                    const prevDate = extractDate(lines[i - k]);
                    if (prevDate) {
                        date = prevDate;
                        break;
                    }
                }
            }

            items.push({ title, link, date });
        }
    }

    // Fallback: If line-by-line failed to find enough, do the bulk regex (no date support usually)
    if (items.length < 2) {
        const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
        let match;
        while ((match = regex.exec(mdString)) !== null) {
            const title = match[1].trim();
            const link = match[2].trim();
            // Filter heuristics
            if (title.length < 20) continue;
            if (title.includes('Image')) continue;
            if (domain && !link.includes(domain)) continue;

            // Check if we already have this
            if (!items.find(it => it.link === link)) {
                items.push({ title, link, date: 'Recent' });
            }
        }
    }

    return items;
};

const deduplicateByLink = (items) => {
    const seen = new Set();
    return items.filter(item => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
    });
};

const parseIonQ = (content, isMarkdown) => {
    if (isMarkdown) return deduplicateByLink(parseMarkdown(content, 'ionq.com'));

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
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
        return deduplicateByLink(items).slice(0, 5);
    } catch (e) {
        console.error("Parse Error IonQ", e);
        return [];
    }
};

const parseRigetti = (content, isMarkdown) => {
    // Pass null domain to allow external links (GlobeNewswire, Medium, etc)
    if (isMarkdown) return deduplicateByLink(parseMarkdown(content, null));

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
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
        return deduplicateByLink(items).slice(0, 5);
    } catch (e) {
        console.error("Parse Error Rigetti", e);
        return [];
    }
};

const parseDWave = (content, isMarkdown) => {
    if (isMarkdown) return deduplicateByLink(parseMarkdown(content, 'dwavequantum.com'));

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
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
        return deduplicateByLink(items).slice(0, 5);
    } catch (e) {
        console.error("Parse Error D-Wave", e);
        return [];
    }
};

const parseQuantinuum = (content, isMarkdown) => {
    if (isMarkdown) return deduplicateByLink(parseMarkdown(content, 'quantinuum.com'));

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const items = [];

        // Robust selector: .news_card_wrap (Primary) or generic search
        const cards = doc.querySelectorAll('.news_card_wrap');

        if (cards.length > 0) {
            cards.forEach(card => {
                const titleElem = card.querySelector('.title_wrap');
                const linkElem = card.querySelector('a');
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
        }

        return deduplicateByLink(items).slice(0, 5);
    } catch (e) {
        console.error("Parse Error Quantinuum", e);
        return [];
    }
};

const parsePsiQuantum = (content, isMarkdown) => {
    if (isMarkdown) return deduplicateByLink(parseMarkdown(content, 'psiquantum.com'));

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const items = [];

        // Squarespace Selector
        const links = doc.querySelectorAll('.summary-title-link, .summary-title a');
        links.forEach(node => {
            const title = node.innerText.trim();
            const href = node.getAttribute('href');
            if (title && href) {
                items.push({
                    title: title,
                    link: href.startsWith('http') ? href : 'https://www.psiquantum.com' + href,
                    date: 'Recent'
                });
            }
        });

        return deduplicateByLink(items).slice(0, 5);
    } catch (e) {
        console.error("Parse Error PsiQuantum", e);
        return [];
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
                const { contents: content, isMarkdown } = result;

                if (company.id === 'ionq') data = parseIonQ(content, isMarkdown);
                else if (company.id === 'rigetti') data = parseRigetti(content, isMarkdown);
                else if (company.id === 'dwave') data = parseDWave(content, isMarkdown);
                else if (company.id === 'quantinuum') data = parseQuantinuum(content, isMarkdown);
                else if (company.id === 'psiquantum') data = parsePsiQuantum(content, isMarkdown);

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
