import {ProductPage} from '../../../components/ui/ProductPage';
import CreateTeamWizard from '../../../components/teams/CreateTeamWizard';

export default async function CreateTeam({searchParams}:{searchParams:Promise<{error?:string}>}){
  const q=await searchParams;
  return <ProductPage eyebrow="TEAMS / CREATE" title="BUILD YOUR FIVE." description="THE CREATOR BECOMES TEAM CAPTAIN AND STARTER."><CreateTeamWizard serverError={q.error}/></ProductPage>
}
