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
    const $=s=>document.querySelector(s),stage={clientWidth:1400};
    const mat=c=>({color:c}),THREE={Vector3:class{constructor(x,y,z){this.x=x;this.y=y;this.z=z}},Object3D:class{}};
    const unitsGroup={children:[]},fxGroup={children:[]},hoverGroup={children:[]},box={},sphere={},cone={},cyl={},ringGeo={};
    ${logic}
    renderTerrain=()=>{};renderObjects=()=>{};updateUI=()=>{};updateGuide=()=>{};
    ping=()=>{};log=()=>{};toast=()=>{};cameraTarget=()=>{};
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
});

test('idle followers have housing, but earn no devotion without productive sites', () => {
  const g = game(.217);
  assert.equal(g.eval('devotion[0]'), 0);
  assert.equal(g.eval('plotAt(CAMPS[0].x,CAMPS[0].z+3,0)&&plotAt(CAMPS[1].x,CAMPS[1].z+3,1)'), true);
  g.advance(50);
  assert.equal(g.eval('devotion[0]'), 0);
  assert.ok(g.eval('people.filter(p=>p.owner===0).length<=housingCapacity(0)'));
  assert.ok(g.eval("people.some(p=>p.owner===0&&p.job.startsWith('SUPPORTING'))"));
  assert.ok(g.eval('devotion[1]>0'));
});

test('one shaped tile can open a plot and prompt an automatic hut', () => {
  const g = game(.217);
  const plan = g.eval(`(()=>{for(let z=3;z<H-3;z++)for(let x=2;x<W/2;x++)if(dist(shaman,{x,z})<5.5)for(let dir of [-1,1]){
    let result=terrainBrush(x,z,dir);if(result.newPlot)return {x,z,dir,plot:result.newPlot}
  }return null})()`);
  assert.ok(plan, 'a useful land edit must be possible near the opening village');
  const before = g.eval('buildings.length');
  g.eval(`mode='${plan.dir > 0 ? 'raise' : 'lower'}';action(${plan.x},${plan.z});ai(.1)`);
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
    faith[0]=100;festival(shrines[0])`);
  assert.ok(g.eval('devotion[0]>0'));
  assert.ok(g.eval('nextFestivalAt>elapsed'));
  g.eval(`finishedStone(shrines[1],0);addPerson(0,shrines[1].x,shrines[1].z,'brave');addPerson(0,shrines[1].x,shrines[1].z,'brave');
    shrines[1].policy='worship';syncSitePolicies(0);shrines[1].belief=80;
    for(let p of people.filter(p=>p.worshipSite===shrines[1])){p.x=shrines[1].x+.2;p.z=shrines[1].z}
    faith[0]=100`);
  assert.equal(g.eval('festivalReady(shrines[1])'), false);
});

test('an occupied hut grows into a house, fort and castle on level land', () => {
  const g = game(.217);
  g.eval(`var home=at(12,24).building;home.progress=1;home.blessed=true;home.belief=70;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(dx||dz){let tile=at(12+dx,24+dz);tile.h=1;tile.tree=false}
    for(let [dx,dz] of [[-1,-1],[0,-1],[1,-1],[1,0]])at(12+dx,24+dz).h=2;
    home.born=2`);
  const firstCapacity = g.eval('housingCapacity(0)');
  g.eval('ai(.1)');
  assert.equal(g.eval('home.level'), 2);
  assert.equal(g.eval('housingCapacity(0)'), firstCapacity + 3);
  const houseDevotion = g.eval('siteDevotion(home)');

  g.eval('home.born=4;at(11,24).h=2');
  assert.equal(g.eval('terrainBrush(12,25,1).upgrade.level'), 3);
  g.eval('terrainBrush(12,25,1,true)');
  assert.equal(g.eval('home.level'), 3);
  assert.equal(g.eval('home.footprint.length'), 4);
  assert.equal(g.eval('housingCapacity(0)'), firstCapacity + 7);

  g.eval('home.born=5;at(11,25).h=2;terrainBrush(13,25,1,true)');
  assert.equal(g.eval('home.level'), 3, 'level land alone does not produce a castle');
  g.eval('home.born=6;ai(.1)');
  assert.equal(g.eval('home.level'), 4);
  assert.equal(g.eval('home.footprint.length'), 9);
  assert.equal(g.eval('home.footprint.every(q=>at(q.x,q.z).building===home)'), true);
  assert.equal(g.eval('terrainBrush(13,25,1).changed'), 0);
  assert.equal(g.eval('housingCapacity(0)'), firstCapacity + 12);
  assert.ok(g.eval('siteDevotion(home)') > houseDevotion);
  g.eval(`home.blessed=false;mode='bless';faith[0]=100;action(13,25)`);
  assert.equal(g.eval('home.blessed'), true, 'the castle can be blessed from its outer footprint');

  const blocked = game(.217);
  blocked.eval(`var home=at(12,24).building;home.progress=1;home.born=6;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(dx||dz){let tile=at(12+dx,24+dz);tile.h=2;tile.tree=false}
    var neighbour=addBuilding(13,25,1,'hut',true);ai(.1)`);
  assert.equal(blocked.eval('home.level'), 3);
  assert.equal(blocked.eval('at(13,25).building===neighbour'), true);
});

const villagePlan = `{
  if(faith[0]>=30){let hut=buildings.find(b=>b.owner===0&&b.type==='hut'&&b.progress===1&&!b.blessed);
    if(hut){if(dist(shaman,hut)<=5.5){mode='bless';action(hut.x,hut.z);hut.policy=buildings.some(b=>b.owner===0&&b.blessed&&b!==hut&&b.policy==='grow')?'worship':'grow';syncSitePolicies(0)}else shaman.goal={x:hut.x,z:hut.z}}}
  if(faith[0]>=FESTIVAL_COST){let ready=buildings.find(b=>b.owner===0&&festivalReady(b));if(ready)festival(ready)}
  if(people.filter(p=>p.owner===0).length>=housingCapacity(0)-4&&!buildings.some(b=>b.owner===0&&b.type==='hut'&&b.progress<1)&&faith[0]>=4){
    let plan=null;for(let z=2;z<H-2&&!plan;z++)for(let x=2;x<W/2&&!plan;x++)if(dist(shaman,{x,z})<=5.5)for(let dir of [-1,1])if(terrainBrush(x,z,dir).newPlot){plan={x,z,dir};break}
    if(plan){mode=plan.dir>0?'raise':'lower';action(plan.x,plan.z)}
  }
}`;

const stonePlan = `{
  if(elapsed<1)shaman.goal={x:shrines[0].x,z:shrines[0].z};
  let owned=shrines.filter(s=>s.owner===0),enemy=people.find(p=>p.owner===1&&p.type==='shaman');
  for(let site of owned)site.policy=dist(enemy,site)<5?'guard':'worship';syncSitePolicies(0);
  if(faith[0]>=FESTIVAL_COST){let ready=owned.find(s=>festivalReady(s));if(ready)festival(ready)}
  let contested=owned.find(s=>s.spirit<60&&dist(enemy,s)<2);
  if(contested){shaman.goal={x:contested.x,z:contested.z};if(faith[0]>=30&&dist(shaman,contested)<3){mode='ritual';action(contested.x,contested.z)}}
  else{let target=nearest(shrines.filter(s=>s.owner===1||s.owner===2&&s.projectOwner===2),shaman);if(target){if(dist(shaman,target)>(target.owner===2?3:1.25)){if(!shaman.goal||dist(shaman.goal,target)>1)shaman.goal={x:target.x,z:target.z}}else if(target.owner===1&&faith[0]>=45){mode='ritual';action(target.x,target.z)}else if(target.owner===2){let plot=stoneCandidate(target);if(plot&&faith[0]>=STONE_COST){mode='stone';action(plot.x,plot.z)}else if(!plot&&faith[0]>=4){let edit=stonePreparation(target);if(edit){mode=edit.dir>0?'raise':'lower';action(edit.x,edit.z)}}}}}
  if(faith[0]>=4){let rough=owned.find(s=>terraceScore(s)<4&&dist(shaman,s)<5),plan=rough&&bestTerraceBrush(rough);if(plan&&dist(shaman,plan)<5){mode=plan.dir>0?'raise':'lower';action(plan.x,plan.z)}}
}`;

test('village and stone plans can each beat both rival styles', () => {
  for (const seed of [.043, .217]) for (const plan of [villagePlan, stonePlan]) {
    const g = game(seed);
    for (let t = 0; t < 240 && !g.eval('ended'); t++) {
      if (t % 3 === 0) g.eval(plan);
      g.advance(1);
    }
    assert.equal(g.eval('ended'), 'victory', `${plan === villagePlan ? 'village' : 'stone'} plan failed on seed ${seed}: ${g.eval('devotion.map(Math.floor)')}`);
    assert.ok(g.eval('elapsed') < 210);
  }
});
