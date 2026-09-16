import {safeInternalPath} from '../auth/redirects.mjs';
const leaders=new Set(['CAPTAIN','CO_CAPTAIN']);
const transitions={DRAFT:'PUBLISHED',PUBLISHED:'REGISTRATION_OPEN',REGISTRATION_OPEN:'REGISTRATION_CLOSED',REGISTRATION_CLOSED:'CHECK_IN',CHECK_IN:'LIVE',LIVE:'COMPLETED',COMPLETED:'ARCHIVED'};
const bases={MATCH_WIN:10,QUARTERFINAL:15,SEMIFINAL:30,RUNNER_UP:60,TOURNAMENT_WIN:100};
const multipliers={COMMUNITY:1,OPEN:1,PREMIER:1.25,'PEAK LEAGUE':1.5,CHAMPIONSHIP:2};

export function authorizeRoute(user,next){const safe=safeInternalPath(next,'');return user?{allowed:true}:{allowed:false,redirect:safe?`/login?next=${encodeURIComponent(next)}`:'/login'}}
export function validateTeam(team){const errors={};if(!team.name||team.name.trim().length<2)errors.name='TEAM NAME MUST BE AT LEAST 2 CHARACTERS.';if(team.name&&team.name.trim().length>60)errors.name='TEAM NAME MUST BE AT MOST 60 CHARACTERS.';if(!/^[A-Za-z0-9]{2,6}$/.test(team.tag||''))errors.tag='TEAM TAG MUST BE 2–6 LETTERS OR NUMBERS.';if(!['EU WEST','EU NORTH/EAST','EU OTHER'].includes(team.region))errors.region='SELECT A VALID EUROPEAN REGION.';return{ok:Object.keys(errors).length===0,errors}}
export function canInvitePlayer({leadership,activeCount,alreadyInvited,targetHasTeam}){return leaders.has(leadership)&&activeCount<7&&!alreadyInvited&&!targetHasTeam}
export function validateRegistration(input){const players=[...input.starters,...input.substitutes];const errors=[];if(!leaders.has(input.leadership))errors.push('TEAM_LEADER_REQUIRED');if(!input.tournamentOpen)errors.push('REGISTRATION_CLOSED');if(input.teamAlreadyRegistered)errors.push('DUPLICATE_REGISTRATION');if(input.starters.length!==5)errors.push('FIVE_STARTERS_REQUIRED');if(input.substitutes.length>2)errors.push('TOO_MANY_SUBSTITUTES');if(new Set(players).size!==players.length)errors.push('DUPLICATE_PLAYER');if(!input.capacityAvailable&&!input.waitlistEnabled)errors.push('TOURNAMENT_FULL');return{ok:errors.length===0,state:errors.length?null:input.capacityAvailable?'REGISTERED':'WAITLISTED',errors}}
export function canEditRoster(now,lock,isAdmin){return isAdmin||now<lock}
export function canCheckIn({leadership,status,now,open,close}){return leaders.has(leadership)&&status==='REGISTERED'&&now>=open&&now<=close}
export function nextTournamentState(current,requested=transitions[current]){if(!requested||transitions[current]!==requested)throw new Error('INVALID_TRANSITION');return requested}
export function confirmResult({status,teamA,teamB,scoreA,scoreB}){if(status!=='AWAITING_CONFIRMATION'||scoreA===scoreB)throw new Error('INVALID_RESULT');return{status:'COMPLETED',winner:scoreA>scoreB?teamA:teamB,advance:true}}
export function createDispute({status,reason}){if(status!=='AWAITING_CONFIRMATION'||!reason?.trim())throw new Error('INVALID_DISPUTE');return{matchStatus:'DISPUTED',disputeStatus:'OPEN',advance:false}}
export function calculatePoints(type,tier){if(!(type in bases)||!(tier in multipliers))throw new Error('INVALID_POINT_EVENT');return bases[type]*multipliers[tier]}
export function canAdmin(role,action){if(role==='SUPER_ADMIN')return true;if(role==='ADMIN')return !['ROLE_CHANGED','USER_BANNED','BRACKET_DESTRUCTIVE_OVERRIDE'].includes(action);return role==='MODERATOR'&&['DISPUTE_REVIEWED','MESSAGE_REMOVED'].includes(action)}

