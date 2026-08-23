import Hero from '@/components/home/Hero';
import NextTournament from '@/components/home/NextTournament';
import CompetitivePath from '@/components/home/CompetitivePath';
import Squad from '@/components/home/Squad';
import TeamFinder from '@/components/home/TeamFinder';
import TournamentWorld from '@/components/home/TournamentWorld';
import RankJourney from '@/components/home/RankJourney';
import LiveNetwork from '@/components/home/LiveNetwork';
import MatchRoom from '@/components/home/MatchRoom';
import Community from '@/components/home/Community';
import HomeMotion from './peak-motion';
export default function Home(){return <HomeMotion><a className="skip-link" href="#main-content">SKIP TO CONTENT</a><main className="home" id="main-content"><Hero/><CompetitivePath/><NextTournament/><Squad/><TeamFinder/><TournamentWorld/><RankJourney/><MatchRoom/><LiveNetwork/><Community/></main></HomeMotion>}
