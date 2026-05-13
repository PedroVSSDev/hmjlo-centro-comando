// ============================================================
//  CONFIGURAÇÃO DO TAILWIND CSS
//  Arquivo: scripts/tailwind.config.js
// ============================================================

tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    50:  '#f0fdfa',
                    100: '#ccfbf1',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    900: '#134e4a'
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif']
            }
        }
    }
}
