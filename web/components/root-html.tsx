import '@/app/globals.css';
import '@/app/product.css';
import '@/app/landing.css';
import '@/app/seo.css';
import '@/app/(ru)/blog/blog.css';
import type {Locale} from '@/lib/seo';
export default function RootHtml({children,locale}:{children:React.ReactNode;locale:Locale}){return <html lang={locale} className="dark"><body className="antialiased">{children}</body></html>}
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#111113'};
