import Link from 'next/link';
export default function PeakGGWordmark({href='/',className=''}:{href?:string;className?:string}){return <Link className={'peak-wordmark '+className} href={href} aria-label="PeakGG home" translate="no"><span>PEAK</span><i className="peak-slash" aria-hidden="true"/><strong>GG</strong></Link>}
