import assert from 'node:assert/strict';
import test from 'node:test';
import {authorizeRoute, canInvitePlayer, validateTeam, validateRegistration, canEditRoster, canCheckIn, nextTournamentState, confirmResult, createDispute, calculatePoints, canAdmin} from '../lib/domain/rules.mjs';

test('auth guards preserve internal return paths and reject external redirects', () => {
  assert.deepEqual(authorizeRoute(null, '/dashboard/matches?status=upcoming'), {allowed:false,redirect:'/login?next=%2Fdashboard%2Fmatches%3Fstatus%3Dupcoming'});
  assert.equal(authorizeRoute(null, 'https://evil.test').redirect, '/login');
});

test('team creation validates name, tag and region', () => {
  assert.equal(validateTeam({name:'Peak Unit',tag:'PEAK',region:'EU WEST'}).ok, true);
  assert.equal(validateTeam({name:'P',tag:'TOOLONG',region:'NA'}).ok, false);
});

test('team invite rules reject duplicates, full teams and existing membership', () => {
  assert.equal(canInvitePlayer({leadership:'CAPTAIN',activeCount:6,alreadyInvited:false,targetHasTeam:false}), true);
  assert.equal(canInvitePlayer({leadership:'MEMBER',activeCount:6,alreadyInvited:false,targetHasTeam:false}), false);
  assert.equal(canInvitePlayer({leadership:'CAPTAIN',activeCount:7,alreadyInvited:false,targetHasTeam:false}), false);
  assert.equal(canInvitePlayer({leadership:'CAPTAIN',activeCount:5,alreadyInvited:true,targetHasTeam:false}), false);
  assert.equal(canInvitePlayer({leadership:'CAPTAIN',activeCount:5,alreadyInvited:false,targetHasTeam:true}), false);
});

test('registration requires leadership, five starters, at most two substitutes and no duplicates', () => {
  const base={leadership:'CAPTAIN',tournamentOpen:true,teamAlreadyRegistered:false,capacityAvailable:true,waitlistEnabled:true,starters:['1','2','3','4','5'],substitutes:['6','7']};
  assert.equal(validateRegistration(base).state,'REGISTERED');
  assert.equal(validateRegistration({...base,capacityAvailable:false}).state,'WAITLISTED');
  assert.equal(validateRegistration({...base,starters:['1','2','3','4']}).ok,false);
  assert.equal(validateRegistration({...base,substitutes:['5']}).ok,false);
  assert.equal(validateRegistration({...base,teamAlreadyRegistered:true}).ok,false);
});

test('roster lock and check-in windows are enforced', () => {
  const now=new Date('2026-08-23T12:00:00Z');
  assert.equal(canEditRoster(now,new Date('2026-08-23T13:00:00Z'),false),true);
  assert.equal(canEditRoster(now,new Date('2026-08-23T11:00:00Z'),false),false);
  assert.equal(canEditRoster(now,new Date('2026-08-23T11:00:00Z'),true),true);
  assert.equal(canCheckIn({leadership:'CO_CAPTAIN',status:'REGISTERED',now,open:new Date('2026-08-23T11:00:00Z'),close:new Date('2026-08-23T13:00:00Z')}),true);
});

test('tournament state transitions cannot be skipped', () => {
  assert.equal(nextTournamentState('DRAFT'),'PUBLISHED');
  assert.throws(()=>nextTournamentState('DRAFT','LIVE'),/INVALID_TRANSITION/);
});

test('result confirmation determines winner and disputes pause advancement', () => {
  assert.deepEqual(confirmResult({status:'AWAITING_CONFIRMATION',teamA:'a',teamB:'b',scoreA:2,scoreB:1}),{status:'COMPLETED',winner:'a',advance:true});
  assert.deepEqual(createDispute({status:'AWAITING_CONFIRMATION',reason:'Score evidence differs'}),{matchStatus:'DISPUTED',disputeStatus:'OPEN',advance:false});
});

test('TP calculation uses exact bases and tier multipliers', () => {
  assert.equal(calculatePoints('MATCH_WIN','COMMUNITY'),10);
  assert.equal(calculatePoints('QUARTERFINAL','PREMIER'),18.75);
  assert.equal(calculatePoints('TOURNAMENT_WIN','CHAMPIONSHIP'),200);
});

test('admin authorization is stored-role based', () => {
  assert.equal(canAdmin('USER','TOURNAMENT_PUBLISHED'),false);
  assert.equal(canAdmin('ADMIN','TOURNAMENT_PUBLISHED'),true);
  assert.equal(canAdmin('ADMIN','ROLE_CHANGED'),false);
  assert.equal(canAdmin('SUPER_ADMIN','ROLE_CHANGED'),true);
});
