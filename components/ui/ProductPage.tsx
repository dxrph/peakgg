import type {ReactNode} from 'react';
export function ProductPage({eyebrow,title,description,actions,children}:{eyebrow:string;title:string;description?:string;actions?:ReactNode;children?:ReactNode}){return <main className="product-page"><header className="product-hero peak-container"><p className="mono-label">{eyebrow}</p><h1>{title}</h1>{description&&<p>{description}</p>}{actions&&<div className="product-actions">{actions}</div>}</header>{children}</main>}
export function EmptyState({title,body,action}:{title:string;body?:string;action?:ReactNode}){return <section className="empty-state" aria-live="polite"><h2>{title}</h2>{body&&<p>{body}</p>}{action}</section>}
export function StatusBadge({children}:{children:ReactNode}){return <span className="status-badge">{children}</span>}
