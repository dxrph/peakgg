import type {Metadata} from 'next';
import TournamentsHero from '@/components/tournaments/TournamentsHero';
import TournamentDiscovery from '@/components/tournaments/TournamentDiscovery';
import CompetitionFlow from '@/components/tournaments/CompetitionFlow';
import CompetitionBenefits from '@/components/tournaments/CompetitionBenefits';
import TournamentsFinalCta from '@/components/tournaments/TournamentsFinalCta';
import {tournaments} from '@/data/tournaments';
import './tournaments.css';
export const metadata:Metadata={title:'Tournaments — PeakGG',description:'Explore the local PeakGG Season 01 tournament circuit.'};
export default function TournamentsPage(){return <><a className="skip-link" href="#tournaments-main">SKIP TO CONTENT</a><main className="tournaments-page" id="tournaments-main"><TournamentsHero/><TournamentDiscovery items={tournaments}/><CompetitionFlow/><CompetitionBenefits/><TournamentsFinalCta/></main></>}
