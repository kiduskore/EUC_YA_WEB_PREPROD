const fs = require('fs');
let content = fs.readFileSync('views/dashboard.ejs', 'utf-8');

// Replace fonts
content = content.replace(
    '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">'
);

// Replace tailwind config
content = content.replace(/tailwind\.config = \{[\s\S]*?\}/, `tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Montserrat', 'sans-serif'],
                    },
                    colors: {
                        navy: {
                            900: '#0B1120',
                            800: '#141E33',
                        },
                        slate: {
                            900: '#0F172A',
                            800: '#1E293B',
                        },
                        accent: '#3b82f6',
                        success: '#10b981',
                        brandDark: '#0B1120',
                        cardDark: 'rgba(255, 255, 255, 0.12)',
                        borderDark: 'rgba(255, 255, 255, 0.3)'
                    }
                }
            }
        }`);

// Replace style block
content = content.replace(/<style>[\s\S]*?<\/style>/, `<style>
        [v-cloak] { display: none; }
        html { scroll-behavior: smooth; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            -webkit-font-smoothing: antialiased; 
            background: #0b1120; 
            color: #f1f0ea; 
        }

        /* Abstract Flowing Background */
        .flowing-bg {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            z-index: -1;
            background-color: #0b1120;
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(30, 45, 80, 0.9) 0%, transparent 45%),
                radial-gradient(circle at 85% 30%, rgba(60, 45, 20, 0.5) 0%, transparent 45%),
                radial-gradient(circle at 50% 80%, rgba(30, 41, 59, 0.7) 0%, transparent 50%);
            pointer-events: none;
        }

        .glass, .stat-card, .kanban-card { 
            position: relative;
            background-color: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px) saturate(150%);
            -webkit-backdrop-filter: blur(20px) saturate(150%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 1.5rem;
            box-shadow: 
                0 20px 40px -10px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            color: #f1f0ea;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            overflow: hidden;
        }
        
        .glass-dark { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
        .glass-input { 
            background: rgba(255, 255, 255, 0.1); 
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2); 
            border-radius: 0.75rem;
            outline: none; 
            backdrop-filter: blur(10px);
        }
        .glass-input:focus { border-color: rgba(255,255,255,0.5); box-shadow: 0 0 15px rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.15); }
        .sidebar-bg { 
            background-color: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(30px);
            border-right: 1px solid rgba(255,255,255,0.1);
        }
        .stat-card:hover, .kanban-card:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5); }
        .accent { color: #f1f0ea; }
        .bg-accent { background-color: rgba(255,255,255,0.2); box-shadow: 0 0 15px rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.3); }
        
        h1, h2, h3, h4, h5, h6, .font-heading { font-family: 'Montserrat', sans-serif; }

        /* Pulse Animation for Loading */
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>`);

// Insert the flowing background div right after <body>
content = content.replace(/<body class="bg-brandDark text-white">/, '<body class="bg-brandDark text-white font-sans">\n<div class="flowing-bg"></div>');

// Inject Lucide script right before </body>
content = content.replace(/<\/body>/, '<script src="https://unpkg.com/lucide@latest"></script>\n<script>lucide.createIcons();</script>\n</body>');

fs.writeFileSync('views/dashboard.ejs', content);
console.log('Patched dashboard');
