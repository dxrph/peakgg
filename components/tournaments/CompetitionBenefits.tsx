const items=['STRUCTURED COMPETITION','TEAM CHECK-IN','LIVE BRACKETS','MATCH ROOMS','STAFF SUPPORT'];
export default function CompetitionBenefits(){return <section className="t-product-strip" aria-label="Competition capabilities"><ol className="t-wrap">{items.map((item,index)=><li key={item}><span>0{index+1}</span><b>{item}</b></li>)}</ol></section>}
