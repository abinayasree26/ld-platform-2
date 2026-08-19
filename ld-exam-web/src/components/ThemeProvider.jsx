import React, { useEffect } from 'react';
import useThemeStore from '../services/themeStore';

const FONT_SIZES = {
  small: '13px',
  medium: '15px',
  big: '18px',
};

const DARK_STYLE_ID = 'ld-dark-overrides';

const DARK_CSS = `
/* === LD Student Dark Mode Overrides === */

/* Main background */
.ld-dark .sp-main {
  background: #0f172a !important;
}
.ld-dark .sp-content {
  background: #0f172a !important;
}

/* Force ALL text to light in student content area */
.ld-dark .sp-content,
.ld-dark .sp-content *,
.ld-dark .sp-content p,
.ld-dark .sp-content span,
.ld-dark .sp-content div,
.ld-dark .sp-content h1,
.ld-dark .sp-content h2,
.ld-dark .sp-content h3,
.ld-dark .sp-content h4,
.ld-dark .sp-content h5,
.ld-dark .sp-content label {
  color: #e2e8f0 !important;
}

/* Borders */
.ld-dark .sp-content *  {
  border-color: #334155 !important;
}

/* All divs with inline background become dark cards */
.ld-dark .sp-content div[style] {
  background-color: #1e293b !important;
}

/* The outermost sp-content itself stays the page bg */
.ld-dark .sp-content[style],
.ld-dark .sp-content > div:first-child {
  background-color: #0f172a !important;
}

/* Buttons with purple/indigo bg keep white text */
.ld-dark .sp-content button {
  color: #e2e8f0 !important;
}

/* Keep the Back button visible */
.ld-dark .sp-content button[style*="4f46e5"] {
  color: #fff !important;
  background-color: #4f46e5 !important;
}

/* Progress bar backgrounds (the grey track) */
.ld-dark .sp-content div[style*="border-radius"][style*="height"] {
  background-color: #334155 !important;
}

/* The header in dark mode */
.ld-dark header,
.ld-dark header[style] {
  background: #1e293b !important;
  border-color: #334155 !important;
}
.ld-dark header *,
.ld-dark header span,
.ld-dark header div {
  color: #e2e8f0 !important;
}

/* Sidebar stays as-is (already dark) */

/* Keep emoji/icons visible */
.ld-dark .sp-content span[style*="fontSize"] {
  color: inherit !important;
}

/* Input fields */
.ld-dark .sp-content input,
.ld-dark .sp-content textarea,
.ld-dark .sp-content select {
  background: #1e293b !important;
  color: #f1f5f9 !important;
  border-color: #475569 !important;
}

/* Scrollbar for dark mode */
.ld-dark .sp-content ::-webkit-scrollbar-track {
  background: #1e293b;
}
.ld-dark .sp-content ::-webkit-scrollbar-thumb {
  background: #475569;
}
`;

const ThemeProvider = ({ children }) => {
  const { mode, fontSize } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.add('ld-dark');
    } else {
      root.classList.remove('dark');
      root.classList.remove('ld-dark');
    }
    root.style.setProperty('--ld-font-size', FONT_SIZES[fontSize] || FONT_SIZES.medium);
  }, [mode, fontSize]);

  // Inject/remove dark override stylesheet
  useEffect(() => {
    let styleEl = document.getElementById(DARK_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = DARK_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = mode === 'dark' ? DARK_CSS : '';
  }, [mode]);

  return <>{children}</>;
};

export default ThemeProvider;
