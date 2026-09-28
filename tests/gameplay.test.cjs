const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
const logic = source.slice(source.indexOf('const DEVOTION_GOAL='), source.indexOf("stage.addEventListener('pointermove',landPreview)"));

function game(seed) {
  const document = {querySelector: () => ({classList: {add() {}, remove() {}}, querySelector: () => ({}), querySelectorAll: () => []})};
  const context = vm.createContext({document, console, performance: {now: () => 0}, setTimeout() {}, clearTimeout() {}});
  vm.runInContext(`
    Math.random = () => ${seed};
    const W=64,H=48,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    const $=s=>document.querySelector(s),stage={clientWidth:1400,clientHeight:800},target={x:0,z:0};let angle=0,zoom=1;
    const mat=c=>({color:c}),THREE={Vector3:class{constructor(x,y,z){this.x=x;this.y=y;this.z=z}},Object3D:class{}};
    const unitsGroup={children:[]},fxGroup={children:[]},hoverGroup={children:[]},box={},sphere={},cone={},cyl={},ringGeo={};
    ${logic}
    renderTerrain=()=>{};renderObjects=()=>{};updateUI=()=>{};
    let refreshCalls=0;refreshTerrainAt=()=>{refreshCalls++};
    ping=()=>{};log=()=>{};toast=()=>{};cameraTarget=()=>{};updateCamera=()=>{};
    finish=win=>{ended=win?'victory':'defeat';running=false};
    makeWorld();
    function finishedStone(site,owner){
      let edit;while((edit=stonePreparation(site)))terrainBrush(edit.x,edit.z,edit.dir,true,owner);
      let plot=stoneCandidate(site);faith[owner]=160;startStoneProject(site,plot.x,plot.z,owner);
      site.progress=1;consecrateStone(site,owner);
    }
  `, context);
  return {
    eval: code => vm.runInContext(code, context),
    advance(seconds) {
      for (let i = 0; i < seconds * 10 && !this.eval('ended'); i++) this.eval('ai(.1)');
    }
  };
}

test('the larger world has reachable starts and five distributed sacred sites', () => {
  const g = game(.217);
  assert.equal(g.eval('tiles.length'), 64 * 48);
  assert.equal(g.eval('shrines.length'), 5);
  assert.ok(g.eval('dist(CAMPS[0],CAMPS[1])>W/2'));
  assert.ok(g.eval('Math.max(...shrines.map(s=>s.z))-Math.min(...shrines.map(s=>s.z))>=12'));
  assert.ok(g.eval('people.some(p=>p.owner===2&&dist(p,shaman)<5.5)'), 'a wild follower is available for the opening tutorial');
  assert.ok(g.eval('shrines.every(s=>validLand(s.x,s.z))'));
  assert.ok(g.eval('CAMPS.every(camp=>shrines.every(site=>landRoute(camp,site)))'));
});

test('every generated world has mountains, hills, connected rivers and lakes', () => {
  for(const seed of [.043,.217,.999]){
    const g=game(seed);
    assert.equal(g.eval('[at(8,16),at(55,16),at(10,31),at(53,31)].every(t=>t.h===5)'),true);
    assert.equal(g.eval('tiles.some(t=>t.h===3)&&tiles.some(t=>t.h===4)'),true);
    assert.equal(g.eval('at(31,12).feature===\'lake\'&&at(31,35).feature===\'lake\''),true);
    assert.equal(g.eval(`(()=>{let queue=[],seen=new Set();for(let z=0;z<17;z++)if(at(0,z).feature==='river')queue.push([0,z]);
      for(let head=0;head<queue.length;head++){let [x,z]=queue[head],key=z*W+x;if(seen.has(key))continue;seen.add(key);
        if(x===W-1)return true;for(let [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          let nx=x+dx,nz=z+dz,t=at(nx,nz);if(t&&(t.feature==='river'||t.feature==='lake')&&!seen.has(nz*W+nx))queue.push([nx,nz])}}
      return false})()`),true,'a connected northern river crosses the world');
    assert.equal(g.eval('Array.from({length:W},(_,x)=>x).every(x=>Array.from({length:12},(_,d)=>at(x,31+d)).some(t=>t.feature===\'river\'||t.feature===\'lake\'))'),true);
  }
});

test('vertical dragging moves the map with the pointer without changing horizontal drag',()=>{
  const g=game(.217);
  g.eval('panCamera(0,30)');
  assert.ok(g.eval('target.z<0&&Math.abs(target.x)<.001'));
  g.eval('target.x=0;target.z=0;panCamera(30,0)');
  assert.ok(g.eval('target.x<0&&Math.abs(target.z)<.001'));
});

test('land bridges cross the new rivers and clear the water markers',()=>{
  const g=game(.217);
  g.eval("var riverZ=Array.from({length:18},(_,z)=>z).find(z=>at(8,z).feature==='river')");
  assert.equal(g.eval('bridgeTiles(8,riverZ).every(p=>p.x===8)'),true);
  g.eval("refreshCalls=0;shaman.x=8;shaman.z=riverZ+2;mode='bridge';faith[0]=100;action(8,riverZ)");
  assert.ok(g.eval('refreshCalls>0'),'Land Bridge must refresh the rendered terrain mesh');
  assert.equal(g.eval('at(8,riverZ).h'),1);
  assert.equal(g.eval('at(8,riverZ).feature'),null);
  assert.equal(g.eval('faith[0]'),70);
});

test('idle followers have housing, but earn no devotion without productive sites', () => {
  const g = game(.217);
  assert.equal(g.eval('devotion[0]'), 0);
  assert.equal(g.eval('plotAt(CAMPS[0].x,CAMPS[0].z+3,0)&&plotAt(CAMPS[1].x,CAMPS[1].z+3,1)'), true);
  g.advance(50);
  assert.equal(g.eval('devotion[0]'), 0);
  assert.ok(g.eval('people.filter(p=>p.owner===0).length<=housingCapacity(0)'));
  assert.ok(g.eval("people.some(p=>p.owner===0&&['hunt','mine','explore'].includes(p.intent?.kind)||p.owner===0&&p.ambientReturn)"), 'spare workers should leave the houses for useful roaming jobs');
  assert.ok(g.eval('devotion[1]>0'));
});

test('one shaped tile can open a plot and prompt an automatic hut', () => {
  const g = game(.217);
  const plan = g.eval(`(()=>{for(let z=3;z<H-3;z++)for(let x=2;x<W/2;x++)if(dist(shaman,{x,z})<5.5)for(let dir of [-1,1]){
    let result=terrainBrush(x,z,dir);if(result.newPlot)return {x,z,dir,plot:result.newPlot}
  }return null})()`);
  assert.ok(plan, 'a useful land edit must be possible near the opening village');
  const before = g.eval('buildings.length');
  g.eval('refreshCalls=0');
  g.eval(`mode='${plan.dir > 0 ? 'raise' : 'lower'}';action(${plan.x},${plan.z});ai(.1)`);
  assert.ok(g.eval('refreshCalls>0'),'Raise/Lower must refresh the rendered terrain mesh');
  assert.equal(g.eval('buildings.length'), before + 1);
  assert.equal(g.eval(`at(${plan.plot.x},${plan.plot.z}).building?.owner`), 0);
  assert.equal(g.eval('faith[0] < 45'), true);
  g.advance(25);
  assert.equal(g.eval(`at(${plan.plot.x},${plan.plot.z}).building?.progress`), 1);
});

test('workers respond to graded belief, distance and unfinished construction', () => {
  const g = game(.217);
  g.eval(`for(let b of buildings.filter(b=>b.owner===0))b.progress=1;
    finishedStone(shrines[0],0);
    var testWorker=people.find(p=>p.owner===0&&p.type==='brave');
    testWorker.x=shrines[0].x;testWorker.z=shrines[0].z;testWorker.workSite=null;testWorker.supportSite=null;
    shrines[0].belief=10`);
  assert.equal(g.eval('chooseWorkerIntent(testWorker).kind'), 'tend');
  g.eval('shrines[0].belief=90');
  assert.equal(g.eval('chooseWorkerIntent(testWorker).kind'), 'support');
  g.eval(`let edit;while((edit=stonePreparation(shrines[1])))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    let plot=stoneCandidate(shrines[1]);startStoneProject(shrines[1],plot.x,plot.z,0)`);
  assert.equal(g.eval('chooseWorkerIntent(testWorker).kind'), 'build');
  assert.ok(g.eval('fuzzyNear(5)>fuzzyNear(9)&&fuzzyNear(9)>fuzzyNear(13)'));
});

test('spare followers can hunt, mine and explore away from the village', () => {
  const g = game(.217);
  g.eval(`for(let b of buildings.filter(b=>b.owner===0))b.progress=1;
    var roamingWorker=people.find(p=>p.owner===0&&p.type==='brave');
    roamingWorker.intent=null;roamingWorker.workSite=null;roamingWorker.supportSite=null;`);
  assert.ok(g.eval("ambientTarget(roamingWorker,'hunt')"), 'woodland provides a hunting destination');
  assert.ok(g.eval("ambientTarget(roamingWorker,'mine')"), 'high ground provides a mining destination');
  assert.ok(g.eval("ambientTarget(roamingWorker,'explore')"), 'distant land provides an exploration destination');
  assert.equal(g.eval("['hunt','mine','explore'].every(kind=>validWorkerIntent({kind,site:ambientTarget(roamingWorker,kind)},0))"), true);
});

test('roaming jobs return useful benefits to the settlement', () => {
  const g = game(.217);
  g.eval(`var home=buildings.find(b=>b.owner===0&&b.type==='hut'&&b.progress===1);
    var worker=people.find(p=>p.owner===0&&p.type==='brave');
    home.provisions=0;worker.ambientReturn='hunt';worker.ambientHome=home;finishAmbientTrip(worker)`);
  assert.equal(g.eval('home.provisions'),1,'hunting stocks provisions');

  g.eval("worker.ambientReturn='mine';worker.ambientHome=home;finishAmbientTrip(worker)");
  assert.equal(g.eval('home.stonework'),1,'mining supplies building stone');

  const faithBefore=g.eval('faith[0]');
  g.eval("worker.ambientReturn='explore';worker.ambientHome=home;finishAmbientTrip(worker)");
  assert.equal(g.eval('faith[0]'),faithBefore+4,'scouting discoveries return faith');
  assert.equal(g.eval('home.discoveries'),1);
});

test('homes use village-wide staffing rather than requiring followers to huddle nearby', () => {
  const g = game(.217);
  g.eval(`var staffedHome=buildings.find(b=>b.owner===0&&b.type==='hut'&&b.progress===1);
    for(let p of people.filter(p=>p.owner===0&&p.type==='brave')){p.x=staffedHome.x+12;p.z=staffedHome.z;p.role='worker'}`);
  assert.ok(g.eval('villageStaffing(0)>=1'));
  assert.equal(g.eval('siteNeeds(staffedHome,0).healthy'),true,'a dispersed active workforce keeps the home healthy');
  assert.equal(g.eval('people.filter(p=>p.owner===0&&p.type==="brave"&&dist(p,staffedHome)<3).length'),0,'no follower needs to stand beside the home');
});

test('mined stone can bring a mature house forward to fort readiness', () => {
  const g=game(.217);
  g.eval(`var stoneHome=at(12,24).building;stoneHome.progress=1;stoneHome.level=2;stoneHome.born=6;stoneHome.completedAt=0;stoneHome.lastGrowthAt=50;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){let t=at(12+dx,24+dz);t.h=2;t.tree=false;if(t.building!==stoneHome)t.building=null}
    elapsed=82;stoneHome.stonework=0`);
  assert.equal(g.eval('hutLevel(stoneHome)'),2,'without mined stone the house is still waiting');
  g.eval('stoneHome.stonework=1');
  assert.equal(g.eval('hutLevel(stoneHome)'),3,'one stone delivery advances the fort maturation clock');
});

test('a bare sacred site requires one shaped tile, a 2×2 foundation and actual follower work', () => {
  const g = game(.217);
  g.eval('shaman.x=shrines[0].x;shaman.z=shrines[0].z');
  g.advance(4);
  assert.equal(g.eval('shrines[0].owner'), 2);
  assert.equal(g.eval('shrines[0].progress'), 0);
  assert.equal(g.eval('stoneCandidate(shrines[0])'), null);
  const edit = g.eval('stonePreparation(shrines[0])');
  assert.equal(edit.edits, 1);
  g.eval(`mode='${edit.dir > 0 ? 'raise' : 'lower'}';action(${edit.x},${edit.z})`);
  const plot = g.eval('stoneCandidate(shrines[0])');
  assert.ok(plot);
  const faithBefore = g.eval('faith[0]');
  g.eval(`mode='stone';action(${plot.x},${plot.z})`);
  assert.equal(g.eval('shrines[0].owner'), 2);
  assert.equal(g.eval('shrines[0].projectOwner'), 0);
  assert.equal(g.eval('faith[0] <= ' + faithBefore + '-STONE_COST'), true);
  assert.equal(g.eval('shrineFlow(shrines[0])'), 0);
  assert.equal(g.eval(`terrainBrush(${edit.x},${edit.z},1).changed`), 0);
  g.advance(40);
  assert.equal(g.eval('shrines[0].owner'), 0);
  assert.ok(g.eval('devotionRate(0)>0'));
});

test('Worship allocates followers; Guard slows a contested stone conversion', () => {
  const g = game(.217);
  g.eval(`finishedStone(shrines[0],0);shrines[0].policy='worship';syncSitePolicies(0)`);
  assert.equal(g.eval('people.filter(p=>p.worshipSite===shrines[0]).length'), 2);
  assert.ok(g.eval("people.filter(p=>p.owner===0&&p.role==='worker').length>=3"));
  g.eval(`shrines[0].policy='guard';syncSitePolicies(0)`);
  assert.equal(g.eval('people.filter(p=>p.guardSite===shrines[0]).length'), 1);
  assert.equal(g.eval('people.filter(p=>p.worshipSite===shrines[0]).length'), 1);
  const guardDelta = g.eval(`(()=>{let site=shrines[0],guard=people.find(p=>p.guardSite===site),rival=people.find(p=>p.owner===1&&p.type==='shaman');guard.x=site.x+.7;guard.z=site.z;rival.x=site.x;rival.z=site.z;site.spirit=60;updateStoneSpirit(site,1);return site.spirit-60})()`);
  const growDelta = g.eval(`(()=>{let site=shrines[0];site.policy='grow';syncSitePolicies(0);site.spirit=60;updateStoneSpirit(site,1);return site.spirit-60})()`);
  assert.ok(guardDelta > growDelta + 4);
});

test('one festival starts a tribe-wide cooldown across sites', () => {
  const g = game(.217);
  g.eval(`finishedStone(shrines[0],0);shrines[0].policy='worship';syncSitePolicies(0);
    shrines[0].belief=70;for(let p of people.filter(p=>p.worshipSite===shrines[0])){p.x=shrines[0].x+.2;p.z=shrines[0].z}
    let edit;while(terraceScore(shrines[0])<STONE_RITE_TERRACE&&(edit=bestTerraceBrush(shrines[0])))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    faith[0]=100;festival(shrines[0])`);
  assert.ok(g.eval('devotion[0]>0'));
  assert.ok(g.eval('nextFestivalAt[0]>elapsed'));
  assert.equal(g.eval("regionalVows[0].has('North')"),true);
  g.eval(`finishedStone(shrines[1],0);addPerson(0,shrines[1].x,shrines[1].z,'brave');addPerson(0,shrines[1].x,shrines[1].z,'brave');
    shrines[1].policy='worship';syncSitePolicies(0);shrines[1].belief=80;
    for(let p of people.filter(p=>p.worshipSite===shrines[1])){p.x=shrines[1].x+.2;p.z=shrines[1].z}
    faith[0]=100`);
  assert.equal(g.eval('festivalReady(shrines[1])'), false);
});

test('devotion alone cannot end the contest; each distinct region needs its own prepared festival', () => {
  const g=game(.217);
  g.eval('devotion[0]=DEVOTION_GOAL+500;ai(.1)');
  assert.equal(g.eval('ended'),'');
  g.eval(`for(let site of [shrines[0],shrines[1],shrines[2]]){
    finishedStone(site,0);site.policy='worship';site.belief=90;
    let edit;while(terraceScore(site)<STONE_RITE_TERRACE&&(edit=bestTerraceBrush(site)))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    addPerson(0,site.x,site.z,'brave');addPerson(0,site.x,site.z,'brave');
  }syncSitePolicies(0);for(let site of [shrines[0],shrines[1],shrines[2]])for(let p of people.filter(p=>p.worshipSite===site)){p.x=site.x+.2;p.z=site.z}`);
  assert.equal(g.eval('festivalReady(shrines[0])'),true);
  g.eval('faith[0]=160;festival(shrines[0]);nextFestivalAt[0]=0;shrines[0].festivalUntil=0;shrines[0].belief=90;faith[0]=160;festival(shrines[0])');
  assert.equal(g.eval('regionalVows[0].size'),1,'repeating a festival does not satisfy a second region');
  g.eval('nextFestivalAt[0]=0;faith[0]=160;festival(shrines[1]);nextFestivalAt[0]=0;faith[0]=160;festival(shrines[2])');
  assert.equal(g.eval('regionalVows[0].size'),3);
  assert.equal(g.eval('victoryReady(0)'),true);
});

test('the rival must develop all three regions before it can win',()=>{
  for(const seed of [.043,.217]){
    const g=game(seed);
    g.advance(150);
    assert.equal(g.eval('ended'),'','the opening cannot finish as a passive score race');
    g.advance(190);
    assert.equal(g.eval('ended'),'defeat');
    assert.equal(g.eval('regionalVows[1].size'),3);
    assert.ok(g.eval('elapsed')>=190&&g.eval('elapsed')<=300);
  }
});

test('an occupied hut grows in stages only after land, births and maturity milestones', () => {
  const g = game(.217);
  g.eval(`var home=at(12,24).building;home.progress=1;home.completedAt=0;home.lastGrowthAt=0;home.blessed=true;home.belief=70;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(dx||dz){let tile=at(12+dx,24+dz);tile.h=1;tile.tree=false}
    for(let [dx,dz] of [[-1,-1],[0,-1],[1,-1],[1,0]])at(12+dx,24+dz).h=2;
    home.born=3`);
  const firstCapacity = g.eval('housingCapacity(0)');
  g.eval('elapsed=24;ai(.1)');
  assert.equal(g.eval('home.level'), 1,'a young hut does not become a house despite level land and births');
  g.eval('elapsed=25');
  g.eval('ai(.1)');
  assert.equal(g.eval('home.level'), 2);
  assert.equal(g.eval('housingCapacity(0)'), firstCapacity + 3);
  const houseDevotion = g.eval('siteDevotion(home)');

  g.eval('home.born=6;at(11,24).h=2');
  assert.equal(g.eval('terrainBrush(12,25,1).upgrade'),null,'a house cannot immediately become a fort');
  g.eval('elapsed=85');
  assert.equal(g.eval('terrainBrush(12,25,1).upgrade.level'), 3);
  g.eval('terrainBrush(12,25,1,true)');
  assert.equal(g.eval('home.level'), 3);
  assert.equal(g.eval('home.footprint.length'), 4);
  assert.equal(g.eval('housingCapacity(0)'), firstCapacity + 7);

  g.eval('home.born=10;at(11,25).h=2;terrainBrush(13,25,1,true)');
  assert.equal(g.eval('home.level'), 3, 'level land alone does not produce a castle');
  g.eval('elapsed=160;home.lastGrowthAt=130;ai(.1)');
  assert.equal(g.eval('home.level'), 3, 'late fort growth must also mature before castle');
  g.eval('elapsed=180;ai(.1)');
  assert.equal(g.eval('home.level'), 4);
  assert.equal(g.eval('home.footprint.length'), 9);
  assert.equal(g.eval('home.footprint.every(q=>at(q.x,q.z).building===home)'), true);
  assert.equal(g.eval('terrainBrush(13,25,1).changed'), 0);
  assert.equal(g.eval('housingCapacity(0)'), firstCapacity + 12);
  assert.ok(g.eval('siteDevotion(home)') > houseDevotion);
  g.eval(`home.blessed=false;mode='bless';faith[0]=100;action(13,25)`);
  assert.equal(g.eval('home.blessed'), true, 'the castle can be blessed from its outer footprint');

  const blocked = game(.217);
  blocked.eval(`var home=at(12,24).building;home.progress=1;home.completedAt=0;home.born=10;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(dx||dz){let tile=at(12+dx,24+dz);tile.h=2;tile.tree=false}
    var neighbour=addBuilding(13,25,1,'hut',true);growBuilding(home,2);growBuilding(home,3);home.lastGrowthAt=0;elapsed=180;ai(.1)`);
  assert.equal(blocked.eval('home.level'), 3);
  assert.equal(blocked.eval('at(13,25).building===neighbour'), true);
});

const villagePlan = `{
  let route=[[15,22],[17,26],[21,24],[25,24],[28,24]],sites=route.map(([x,z])=>buildings.find(b=>b.owner===0&&b.x===x&&b.z===z));
  let ready=buildings.find(b=>b.owner===0&&faithRegion(b)&&!regionalVows[0].has(faithRegion(b))&&festivalReady(b));
  if(ready&&faith[0]>=FESTIVAL_COST)festival(ready);
  for(let b of buildings.filter(b=>b.owner===0&&b.blessed&&b.progress===1&&faithRegion(b))){let required=faithRegion(b)==='Crossing'?3:2;if(b.level>=required&&b.policy!=='worship'){b.policy='worship';syncSitePolicies(0)}}
  let unfinished=route.findIndex((point,i)=>!sites[i]);if(unfinished>=0){let [x,z]=route[unfinished];if(plotAt(x,z,0)){mode='hut';action(x,z)}}
  let unblessed=buildings.find(b=>b.owner===0&&b.type==='hut'&&b.progress===1&&!b.blessed);
  if(unblessed&&faith[0]>=30){if(dist(shaman,unblessed)>5.5)shaman.goal={x:unblessed.x,z:unblessed.z};else{mode='bless';action(unblessed.x,unblessed.z)}}
  else if(faith[0]>=4){let home=sites.find(b=>b?.progress===1&&faithRegion(b)&&b.level<(faithRegion(b)==='Crossing'?3:2));if(home){let edit=null,level=height(home.x,home.z);for(let dz=-1;dz<=1&&!edit;dz++)for(let dx=-1;dx<=1&&!edit;dx++)if(dx||dz){let x=home.x+dx,z=home.z+dz,t=at(x,z),dir=Math.sign(level-t.h);if(dir&&terrainBrush(x,z,dir).changed)edit={x,z,dir}}if(edit){if(dist(shaman,edit)>5.5)shaman.goal={x:home.x,z:home.z};else{mode=edit.dir>0?'raise':'lower';action(edit.x,edit.z)}}}
  }
}`;

const stonePlan = `{
  let owned=shrines.filter(s=>s.owner===0),enemy=people.find(p=>p.owner===1&&p.type==='shaman');
  for(let site of owned)site.policy=dist(enemy,site)<3?'guard':'worship';syncSitePolicies(0);
  if(faith[0]>=FESTIVAL_COST){let ready=owned.find(s=>!regionalVows[0].has(faithRegion(s))&&festivalReady(s));if(ready)festival(ready)}
  let target=owned.find(s=>!regionalVows[0].has(faithRegion(s))&&terraceScore(s)<STONE_RITE_TERRACE)
    ||shrines.find(s=>!regionalVows[0].has(faithRegion(s))&&s.owner===2&&s.projectOwner===2)
    ||shrines.find(s=>!regionalVows[0].has(faithRegion(s))&&s.owner===1);
  if(target){
    if(target.owner===0){if(dist(shaman,target)>4.4)shaman.goal={x:target.x,z:target.z};else if(faith[0]>=4){let edit=bestTerraceBrush(target);if(edit){mode=edit.dir>0?'raise':'lower';action(edit.x,edit.z)}}}
    else if(dist(shaman,target)>(target.owner===2?2.8:1.1))shaman.goal={x:target.x,z:target.z};
    else if(target.owner===1&&faith[0]>=45){mode='ritual';action(target.x,target.z)}
    else if(target.owner===2){let plot=stoneCandidate(target);if(plot&&faith[0]>=STONE_COST){mode='stone';action(plot.x,plot.z)}else if(!plot&&faith[0]>=4){let edit=stonePreparation(target);if(edit){mode=edit.dir>0?'raise':'lower';action(edit.x,edit.z)}}}
  }
}`;

test('stone plan reaches all regional festivals against both rival styles', () => {
  for (const seed of [.043, .217]) {
    const g = game(seed);
    let firstThree=null;
    for (let t = 0; t < 400 && !g.eval('ended'); t++) {
      if (t % 3 === 0) g.eval(stonePlan);
      g.advance(1);
      if(!firstThree&&g.eval('regionalVows[0].size===3'))firstThree=[t,Math.floor(g.eval('devotion[0]'))];
    }
    assert.equal(g.eval('ended'), 'victory', `stone plan failed on seed ${seed}: ${g.eval('devotion.map(Math.floor)')}`);
    assert.equal(g.eval('regionalVows[0].size'),3);
    assert.ok(firstThree&&g.eval('elapsed')-firstThree[0]<40,'the score should follow the active third festival without a long passive wait');
    assert.ok(g.eval('elapsed')>=160&&g.eval('elapsed')<260);
  }
});

test('village plan reaches all regional festivals against both rival styles', () => {
  for(const seed of [.043,.217]){
    const g=game(seed);
    for(let t=0;t<420&&!g.eval('ended');t++){
      if(t%3===0)g.eval(villagePlan);
      g.advance(1);
    }
    assert.equal(g.eval('ended'),'victory',`village plan failed on seed ${seed}: ${g.eval('devotion.map(Math.floor)')} ${g.eval('regionalVows.map(s=>[...s])')}`);
    assert.equal(g.eval('regionalVows[0].size'),3);
    assert.equal(g.eval('shrines.filter(s=>s.owner===0).length'),0,'villages can complete the map without stone circles');
    assert.ok(g.eval('elapsed')>=160&&g.eval('elapsed')<260);
  }
});
