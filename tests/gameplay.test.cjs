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

test('completed homes contribute automatically while spare followers use the environment', () => {
  const g = game(.217);
  assert.equal(g.eval('plotAt(CAMPS[0].x,CAMPS[0].z+3,0)&&plotAt(CAMPS[1].x,CAMPS[1].z+3,1)'), true);
  assert.ok(g.eval('devotionRate(0)>0'),'the starting completed home contributes without a Bless command');
  g.advance(50);
  assert.ok(g.eval('devotion[0]>0'));
  assert.ok(g.eval('people.filter(p=>p.owner===0).length<=housingCapacity(0)'));
  assert.ok(g.eval("people.some(p=>p.owner===0&&['hunt','mine','explore'].includes(p.intent?.kind)||p.owner===0&&p.ambientReturn)"), 'spare workers should leave the houses for useful environmental jobs');
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

test('spare followers find jobs from terrain-linked environmental opportunities', () => {
  const g = game(.217);
  g.eval(`for(let b of buildings.filter(b=>b.owner===0))b.progress=1;
    var roamingWorker=people.find(p=>p.owner===0&&p.type==='brave');
    roamingWorker.intent=null;roamingWorker.workSite=null;roamingWorker.supportSite=null;
    var localHome=nearest(buildings.filter(b=>b.owner===0&&b.type==='hut'&&b.progress===1),roamingWorker);
    for(let z=1;z<H-1;z++)for(let x=1;x<W-1;x++){let t=at(x,z);if(dist({x,z},localHome)<=15){t.mineral=0}}
    var high=null;for(let z=1;z<H-1&&!high;z++)for(let x=1;x<W-1&&!high;x++){let t=at(x,z);if(t.h>=4&&!t.tree&&!t.building&&dist({x,z},localHome)>3&&dist({x,z},localHome)<15)high={x,z}}
    at(high.x,high.z).mineral=4;`);
  assert.ok(g.eval("ambientTarget(roamingWorker,'hunt')"), 'woodland provides a hunting destination');
  assert.ok(g.eval("ambientTarget(roamingWorker,'mine')"), 'high-ground mineral seams provide mining destinations');
  assert.ok(g.eval("ambientTarget(roamingWorker,'explore')"), 'distant open land provides an exploration destination');
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

test('sacred terrain attracts worshippers and threats attract guards automatically', () => {
  const g = game(.217);
  g.eval(`finishedStone(shrines[0],0);
    let edit;while(terraceScore(shrines[0])<STONE_RITE_TERRACE&&(edit=bestTerraceBrush(shrines[0])))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    for(let i=0;i<5;i++)addPerson(0,shrines[0].x+2,shrines[0].z,'brave');
    syncSitePolicies(0)`);
  assert.equal(g.eval('people.filter(p=>p.worshipSite===shrines[0]).length'),2,'a seven-tile terrace attracts festival worshippers');
  g.eval(`var rival=people.find(p=>p.owner===1&&p.type==='shaman');rival.x=shrines[0].x;rival.z=shrines[0].z;shrines[0].spirit=60;syncSitePolicies(0)`);
  assert.equal(g.eval('people.filter(p=>p.guardSite===shrines[0]).length'),1,'a nearby rival attracts a keeper');
  g.eval(`rival.x=shrines[0].x+12;rival.z=shrines[0].z;syncSitePolicies(0)`);
  assert.equal(g.eval('people.filter(p=>p.guardSite===shrines[0]).length'),0,'the keeper returns to work when the threat leaves');
});

test('prepared sacred terrain can trigger a festival and starts a tribe-wide cooldown', () => {
  const g = game(.217);
  g.eval(`finishedStone(shrines[0],0);shrines[0].belief=80;
    for(let i=0;i<6;i++)addPerson(0,shrines[0].x+2,shrines[0].z,'brave');
    let edit;while(terraceScore(shrines[0])<STONE_RITE_TERRACE&&(edit=bestTerraceBrush(shrines[0])))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    syncSitePolicies(0);for(let p of people.filter(p=>p.worshipSite===shrines[0])){p.x=shrines[0].x+.2;p.z=shrines[0].z}
    faith[0]=100;riteClock=4;ai(.1)`);
  assert.equal(g.eval("regionalVows[0].has('North')"),true);
  assert.ok(g.eval('nextFestivalAt[0]>elapsed'));

  g.eval(`finishedStone(shrines[1],0);shrines[1].belief=90;
    let edit;while(terraceScore(shrines[1])<STONE_RITE_TERRACE&&(edit=bestTerraceBrush(shrines[1])))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    syncSitePolicies(0);for(let p of people.filter(p=>p.worshipSite===shrines[1])){p.x=shrines[1].x+.2;p.z=shrines[1].z}`);
  assert.equal(g.eval('festivalReady(shrines[1])'),false,'the tribe-wide cooldown blocks another immediate celebration');
});

test('devotion alone cannot end the contest; each distinct region still needs prepared land', () => {
  const g=game(.217);
  g.eval('devotion[0]=DEVOTION_GOAL+500;ai(.1)');
  assert.equal(g.eval('ended'),'');
  g.eval(`for(let i=0;i<10;i++)addPerson(0,shrines[2].x,shrines[2].z,'brave');
    for(let site of [shrines[0],shrines[1],shrines[2]]){
      finishedStone(site,0);site.belief=90;
      let edit;while(terraceScore(site)<STONE_RITE_TERRACE&&(edit=bestTerraceBrush(site)))terrainBrush(edit.x,edit.z,edit.dir,true,0);
    }
    syncSitePolicies(0);
    for(let site of [shrines[0],shrines[1],shrines[2]])for(let p of people.filter(p=>p.worshipSite===site)){p.x=site.x+.2;p.z=site.z}`);
  assert.equal(g.eval('festivalReady(shrines[0])'),true);
  g.eval('faith[0]=160;festival(shrines[0]);nextFestivalAt[0]=0;shrines[0].festivalUntil=0;faith[0]=160;festival(shrines[0])');
  assert.equal(g.eval('regionalVows[0].size'),1);
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
  const blocked = game(.217);
  blocked.eval(`var home=at(12,24).building;home.progress=1;home.completedAt=0;home.born=10;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(dx||dz){let tile=at(12+dx,24+dz);tile.h=2;tile.tree=false}
    var neighbour=addBuilding(13,25,1,'hut',true);growBuilding(home,2);growBuilding(home,3);home.lastGrowthAt=0;elapsed=180;ai(.1)`);
  assert.equal(blocked.eval('home.level'), 3);
  assert.equal(blocked.eval('at(13,25).building===neighbour'), true);
});

test('Ember uses the same environmental placement rules and costs as the player',()=>{
  const g=game(.217);
  g.eval(`var emberShaman=people.find(p=>p.owner===1&&p.type==='shaman');
    var emberHome=buildings.find(b=>b.owner===1&&b.type==='hut'&&b.progress===1);
    for(let z=Math.max(1,emberHome.z-10);z<=Math.min(H-2,emberHome.z+10);z++)for(let x=Math.max(1,emberHome.x-10);x<=Math.min(W-2,emberHome.x+10);x++){let t=at(x,z);if(t&&!t.building){t.tree=false;t.mineral=0}}
    var groveSite=null;for(let z=Math.max(1,emberHome.z-8);z<=Math.min(H-2,emberHome.z+8)&&!groveSite;z++)for(let x=Math.max(1,emberHome.x-8);x<=Math.min(W-2,emberHome.x+8)&&!groveSite;x++){let t=at(x,z);if(t&&t.h>=1&&t.h<=3&&!t.building&&!sacredResourceBlocked(x,z))groveSite={x,z}}
    emberShaman.x=groveSite.x;emberShaman.z=groveSite.z;faith[1]=100`);
  const before=g.eval('faith[1]');
  assert.equal(g.eval("placeEnvironmentFeature('grove',groveSite.x,groveSite.z,1)"),true);
  assert.equal(g.eval('at(groveSite.x,groveSite.z).tree'),true);
  assert.equal(g.eval('faith[1]'),before-g.eval('GROVE_COST'));

  g.eval(`var mineralSite=null;for(let z=1;z<H-1&&!mineralSite;z++)for(let x=W/2;x<W-1&&!mineralSite;x++){let t=at(x,z);if(t&&t.h>=4&&!t.building&&!t.tree&&!sacredResourceBlocked(x,z))mineralSite={x,z}}
    emberShaman.x=mineralSite.x;emberShaman.z=mineralSite.z`);
  const mineralBefore=g.eval('faith[1]');
  assert.equal(g.eval("placeEnvironmentFeature('mineral',mineralSite.x,mineralSite.z,1)"),true);
  assert.equal(g.eval('at(mineralSite.x,mineralSite.z).mineral'),4);
  assert.equal(g.eval('faith[1]'),mineralBefore-g.eval('MINERAL_COST'));
});

test('Ember chooses resource-poor settlements for environmental intervention',()=>{
  const g=game(.217);
  g.eval(`var emberHome=buildings.find(b=>b.owner===1&&b.type==='hut'&&b.progress===1);
    for(let z=Math.max(1,emberHome.z-10);z<=Math.min(H-2,emberHome.z+10);z++)for(let x=Math.max(1,emberHome.x-10);x<=Math.min(W-2,emberHome.x+10);x++){let t=at(x,z);if(t&&!t.building){t.tree=false;t.mineral=0}}
    faith[1]=120;aiStyle='villages';var ecologyChoice=aiEnvironmentChoice(1)`);
  assert.ok(g.eval('ecologyChoice'));
  assert.equal(g.eval("['grove','mineral'].includes(ecologyChoice.kind)"),true);
  assert.equal(g.eval("environmentFeatureAllowed(ecologyChoice.kind,ecologyChoice.x,ecologyChoice.z)"),true);
});

test('Ember must move its shaman into range before creating an environmental feature',()=>{
  const g=game(.217);
  g.eval(`var emberShaman=people.find(p=>p.owner===1&&p.type==='shaman'),emberHome=buildings.find(b=>b.owner===1&&b.type==='hut'&&b.progress===1);
    var target=null;for(let z=1;z<H-1&&!target;z++)for(let x=W/2;x<W-1&&!target;x++){let t=at(x,z);if(groveAllowed(t)&&!sacredResourceBlocked(x,z)&&dist(emberShaman,{x,z})>5.5)target={kind:'grove',x,z}}
    faith[1]=120;emberShaman.environmentGoal=target;var targetWasTree=at(target.x,target.z).tree;ai(.1)`);
  assert.equal(g.eval('at(target.x,target.z).tree'),false,'the feature is not created remotely');
  assert.equal(g.eval("emberShaman.job==='SEEKING GROVE SITE'"),true);
  g.eval('emberShaman.x=target.x;emberShaman.z=target.z;emberShaman.goal=null;ai(.1)');
  assert.equal(g.eval('at(target.x,target.z).tree'),true,'the grove appears once Ember reaches casting range');
});

test('player action set contains no direct labour-management commands',()=>{
  const g=game(.217);
  assert.equal(g.eval("commands.some(c=>['hut'].includes(c[0]))"),false);
  assert.equal(g.eval("spells.some(s=>['convert','bless','ritual'].includes(s[0]))"),false);
  assert.equal(g.eval("spells.some(s=>s[0]==='grove')"),true);
  assert.equal(g.eval("spells.some(s=>s[0]==='mineral')"),true);
});

test('groves belong to low-mid land and minerals belong to high ground',()=>{
  const g=game(.217);
  const low=g.eval(`(()=>{for(let z=2;z<H-2;z++)for(let x=2;x<W-2;x++){let t=at(x,z);if(t.h>=1&&t.h<=3&&!t.tree&&!t.mineral&&!t.building&&!shrines.some(s=>s.x===x&&s.z===z))return {x,z}}})()`);
  const high=g.eval(`(()=>{for(let z=2;z<H-2;z++)for(let x=2;x<W-2;x++){let t=at(x,z);if(t.h>=4&&!t.tree&&!t.mineral&&!t.building)return {x,z}}})()`);
  assert.ok(low&&high);
  assert.equal(g.eval(`groveAllowed(at(${low.x},${low.z}))`),true);
  assert.equal(g.eval(`mineralAllowed(at(${low.x},${low.z}))`),false);
  assert.equal(g.eval(`mineralAllowed(at(${high.x},${high.z}))`),true);
  assert.equal(g.eval(`groveAllowed(at(${high.x},${high.z}))`),false);

  g.eval(`faith[0]=100;shaman.x=${low.x};shaman.z=${low.z};mode='grove';action(${low.x},${low.z})`);
  assert.equal(g.eval(`at(${low.x},${low.z}).tree`),true);
  g.eval(`shaman.x=${high.x};shaman.z=${high.z};mode='mineral';action(${high.x},${high.z})`);
  assert.equal(g.eval(`at(${high.x},${high.z}).mineral`),4);
});

test('sculpting across ecological height bands removes incompatible resources',()=>{
  const g=game(.217);
  g.eval(`var ecoTile=at(6,6);ecoTile.building=null;ecoTile.h=3;ecoTile.tree=true;ecoTile.mineral=0;terrainBrush(6,6,1,true,0)`);
  assert.equal(g.eval('at(6,6).h'),4);
  assert.equal(g.eval('at(6,6).tree'),false,'woodland disappears when raised into mineral country');
  g.eval(`at(6,6).mineral=4;terrainBrush(6,6,-1,true,0)`);
  assert.equal(g.eval('at(6,6).h'),3);
  assert.equal(g.eval('at(6,6).mineral'),0,'mineral seam disappears when lowered below high ground');
});

test('local resource density changes the environmental pull around a settlement',()=>{
  const g=game(.217);
  g.eval(`var ecoHome=buildings.find(b=>b.owner===0&&b.type==='hut'&&b.progress===1);
    for(let z=Math.max(1,ecoHome.z-10);z<=Math.min(H-2,ecoHome.z+10);z++)for(let x=Math.max(1,ecoHome.x-10);x<=Math.min(W-2,ecoHome.x+10);x++){let t=at(x,z);if(t&&!t.building){t.tree=false;t.mineral=0}}
    var emptyEnv=localEnvironment(ecoHome);
    for(let [dx,dz] of [[4,0],[5,0],[4,1],[5,1],[4,-1],[5,-1]]){let t=at(ecoHome.x+dx,ecoHome.z+dz);t.h=2;t.tree=true}
    var forestEnv=localEnvironment(ecoHome);
    for(let [dx,dz] of [[-5,0],[-6,0],[-5,1]]){let t=at(ecoHome.x+dx,ecoHome.z+dz);t.h=4;t.tree=false;t.mineral=4}
    var mixedEnv=localEnvironment(ecoHome)`);
  assert.ok(g.eval('forestEnv.hunt>emptyEnv.hunt'),'more nearby woodland increases hunting pull');
  assert.ok(g.eval('mixedEnv.mine>forestEnv.mine'),'nearby rich seams increase mining pull');
  assert.ok(g.eval('mixedEnv.open<emptyEnv.open'),'resource development reduces the relative amount of open scouting country');
});

test('useful level ground is enough for settlers to plan homes without a player build order',()=>{
  const g=game(.217);
  const plan=g.eval(`(()=>{for(let z=3;z<H-3;z++)for(let x=2;x<W/2;x++)if(dist(shaman,{x,z})<5.5)for(let dir of [-1,1]){let result=terrainBrush(x,z,dir);if(result.newPlot)return {x,z,dir,plot:result.newPlot}}})()`);
  assert.ok(plan);
  const before=g.eval('buildings.length');
  g.eval(`mode='${plan.dir>0?'raise':'lower'}';action(${plan.x},${plan.z});settlementClock=4;ai(.1)`);
  assert.ok(g.eval('buildings.length')>before);
});

