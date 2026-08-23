import {ProductPage} from '../../components/ui/ProductPage';
import PlayersDirectory from '../../components/players/PlayersDirectory';
import {normalizePlayerFilters} from '../../lib/internal-pages-models.mjs';

export default async function Players({searchParams}:{searchParams:Promise<{search?:string;region?:string;role?:string;status?:string}>}){
  const query=await searchParams;
  const initialFilters=normalizePlayerFilters(query);
  return <ProductPage eyebrow="PEAKGG / PLAYER DIRECTORY" title="FIND YOUR FIVE." description="SEARCH EUROPEAN COMPETITORS BY REGION, ROLE, AND TEAM STATUS."><PlayersDirectory initialFilters={initialFilters}/></ProductPage>
}
