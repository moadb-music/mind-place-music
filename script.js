lucide.createIcons();

const data = {
    'moadb': {
        title: "MIND OF A DEAD BODY",
        historia: "Projeto de Modern Metalcore que une o peso visceral à precisão digital. Transita entre o renascimento de 'Silent Rebirth' e o horror de 'Eldritch Awakening'.",
        filosofia: "A tecnologia é o pincel, mas a alma e a técnica são puramente humanas. Cada música é construída em camadas milimétricas.",
        color: "#ff0000",
        cover: "silent rebirth cover.jpg",
        links: [
            { n: 'SPOTIFY', l: 'https://open.spotify.com/intl-pt/artist/7zLPRu5akdcZHeDbVMm3o8' },
            { n: 'INSTAGRAM', l: 'https://www.instagram.com/mindofadeadbody' },
            { n: 'YOUTUBE', l: 'https://www.youtube.com/@mindofadeadbody' },
            { n: 'TIKTOK', l: 'https://www.tiktok.com/@mind.of.a.dead.bo' }
        ]
    },
    'som': {
        title: "STATE OF MIND",
        historia: "Digital sanctuary for calm, focus, and late-night introspection. Curated selection of Lo-fi beats and ambient sounds.",
        filosofia: "Designed to accompany study sessions, coding marathons, or just to help you unwind after a long day.",
        color: "#00ccff",
        cover: "state of mind logo.jpg",
        links: [
            { n: 'YOUTUBE', l: 'https://www.youtube.com/@SoM-Lo-Fi' }
        ]
    }
};

function openProject(id) {
    const p = data[id];
    document.getElementById('proj-title').innerText = p.title;
    document.getElementById('proj-bio-historia').innerText = p.historia;
    document.getElementById('proj-bio-filosofia').innerText = p.filosofia;
    document.getElementById('bg-texture').style.backgroundImage = `url('${p.cover}')`;
    document.getElementById('dynamic-bg').style.background = `radial-gradient(circle at 50% -20%, ${p.color}22 0%, #000 70%)`;
    
    const grid = document.getElementById('social-grid');
    grid.innerHTML = p.links.map(link => `<a href="${link.l}" target="_blank">${link.n}</a>`).join('');
    
    document.getElementById('project-details').classList.add('active');
}

function goBack() {
    document.getElementById('project-details').classList.remove('active');
    document.getElementById('dynamic-bg').style.background = `radial-gradient(circle at 50% -20%, #1a1a1a 0%, #000 70%)`;
}