import SiteHome from '@/components/site-home';
import {applicationSchema} from '@/lib/seo';
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(applicationSchema('ru')).replace(/</g,'\\u003c')}}/><SiteHome/></>}
