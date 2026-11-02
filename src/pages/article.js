/**
 * Entry point of the content pages (DIY guide, what is a kinegram): shared styles and analytics.
 * These pages are plain HTML, so search engines and AI crawlers read them without running JavaScript.
 */
import { inject } from '@vercel/analytics';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/article.css';

inject({ mode: import.meta.env.DEV ? 'development' : 'production' });
