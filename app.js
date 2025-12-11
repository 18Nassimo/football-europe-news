// Configuration des sources RSS de football europÃ©en
const RSS_FEEDS = [
    // Sources en franÃ§ais
    { url: 'https://www.lequipe.fr/rss/actu_rss_Football.xml', source: 'L\'Ãquipe', category: 'GÃ©nÃ©ral' },
    { url: 'https://www.eurosport.fr/football/rss.xml', source: 'Eurosport', category: 'GÃ©nÃ©ral' },
    
    // Sources internationales (via RSS to JSON API)
    { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport', category: 'GÃ©nÃ©ral' },
    { url: 'https://www.skysports.com/rss/12040', source: 'Sky Sports', category: 'Premier League' },
    { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN', category: 'GÃ©nÃ©ral' }
];

// API proxy pour contourner CORS (gratuit)
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

let allNews = [];
let displayedNews = 0;
const NEWS_PER_PAGE = 10;

// Fonction pour rÃ©cupÃ©rer les news d'une source RSS
async function fetchRSSFeed(feed) {
    try {
        const response = await fetch(RSS_API + encodeURIComponent(feed.url));
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
            return data.items.map(item => ({
                title: item.title,
                link: item.link,
                description: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
                pubDate: new Date(item.pubDate),
                source: feed.source,
                category: feed.category
            }));
        }
        return [];
    } catch (error) {
        console.error(`Erreur lors du chargement de ${feed.source}:`, error);
        return [];
    }
}

// Fonction pour charger toutes les actualitÃ©s
async function loadAllNews() {
    const loadingEl = document.getElementById('loading');
    const newsContainer = document.getElementById('news-container');
    const loadMoreBtn = document.getElementById('load-more');
    
    try {
        // Charger toutes les sources en parallÃ¨le
        const promises = RSS_FEEDS.map(feed => fetchRSSFeed(feed));
        const results = await Promise.all(promises);
        
        // Combiner et trier par date
        allNews = results.flat().sort((a, b) => b.pubDate - a.pubDate);
        
        loadingEl.style.display = 'none';
        
        if (allNews.length === 0) {
            newsContainer.innerHTML = '<p style="text-align:center; padding:2rem;">Aucune actualitÃ© disponible pour le moment.</p>';
            return;
        }
        
        // Afficher les premiers articles
        displayNews();
        
        if (allNews.length > NEWS_PER_PAGE) {
            loadMoreBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        loadingEl.innerHTML = '<p style="color:red;">Erreur lors du chargement des actualitÃ©s. Veuillez rÃ©essayer.</p>';
    }
}

// Fonction pour afficher les actualitÃ©s
function displayNews() {
    const newsContainer = document.getElementById('news-container');
    const loadMoreBtn = document.getElementById('load-more');
    
    const newsToShow = allNews.slice(displayedNews, displayedNews + NEWS_PER_PAGE);
    
    newsToShow.forEach(news => {
        const newsItem = document.createElement('article');
        newsItem.className = 'news-item';
        
        const timeAgo = getTimeAgo(news.pubDate);
        
        newsItem.innerHTML = `
            <h3><a href="${news.link}" target="_blank" rel="noopener noreferrer">${news.title}</a></h3>
            <div class="news-meta">
                <span class="news-source">${news.source}</span>
                <span class="news-date">${timeAgo}</span>
            </div>
            <p class="news-description">${news.description}</p>
            <span class="news-category">${news.category}</span>
        `;
        
        newsContainer.appendChild(newsItem);
    });
    
    displayedNews += newsToShow.length;
    
    // Cacher le bouton "Charger plus" si tous les articles sont affichÃ©s
    if (displayedNews >= allNews.length) {
        loadMoreBtn.style.display = 'none';
    }
}

// Fonction pour calculer le temps Ã©coulÃ©
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' an' + (Math.floor(interval) > 1 ? 's' : '');
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' mois';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' jour' + (Math.floor(interval) > 1 ? 's' : '');
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' heure' + (Math.floor(interval) > 1 ? 's' : '');
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '');
    
    return Math.floor(seconds) + ' seconde' + (Math.floor(seconds) !== 1 ? 's' : '');
}

// Filtrer par catÃ©gorie
function filterByCategory(category) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';
    displayedNews = 0;
    
    if (category === 'tous') {
        displayNews();
    } else {
        const filtered = allNews.filter(news => 
            news.category.toLowerCase().includes(category.toLowerCase())
        );
        
        filtered.slice(0, NEWS_PER_PAGE).forEach(news => {
            const newsItem = document.createElement('article');
            newsItem.className = 'news-item';
            const timeAgo = getTimeAgo(news.pubDate);
            
            newsItem.innerHTML = `
                <h3><a href="${news.link}" target="_blank" rel="noopener noreferrer">${news.title}</a></h3>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <span class="news-date">${timeAgo}</span>
                </div>
                <p class="news-description">${news.description}</p>
                <span class="news-category">${news.category}</span>
            `;
            
            newsContainer.appendChild(newsItem);
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Charger les actualitÃ©s au dÃ©marrage
    loadAllNews();
    
    // Bouton "Charger plus"
    document.getElementById('load-more').addEventListener('click', displayNews);
    
    // Navigation - filtres par catÃ©gorie
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('href').substring(1);
            filterByCategory(category);
        });
    });
    
    // Refresh automatique toutes les 5 minutes
    setInterval(() => {
        console.log('RafraÃ®chissement automatique des actualitÃ©s...');
        allNews = [];
        displayedNews = 0;
        document.getElementById('news-container').innerHTML = '';
        loadAllNews();
    }, 300000); // 5 minutes
});