import * as THREE from '../vendor/three.module.js';
const $=s=>document.querySelector(s), W=64,H=48, clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const colors=[0x78c5ac,0xe48369,0xb9b7a5];
const stage=$('#viewport'),scene=new THREE.Scene();scene.background=new THREE.Color(0x567e8b);scene.fog=new THREE.Fog(0x567e8b,28,58);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;stage.append(renderer.domElement);
const camera=new THREE.OrthographicCamera(-13,13,9,-9,.1,100),target=new THREE.Vector3(0,0,0);let angle=Math.PI/4,zoom=1,drag=null;
scene.add(new THREE.HemisphereLight(0xd5eeff,0x4c5143,2.6));const sun=new THREE.DirectionalLight(0xffe5b0,2.9);sun.position.set(-13,23,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.bias=-.0005;scene.add(sun,sun.target);
const water=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x376d78,roughness:.42,metalness:.14}));water.rotation.x=-Math.PI/2;water.position.y=.03;scene.add(water);
const terrain=new THREE.Group(),terrainMarks=new THREE.Group(),objects=new THREE.Group(),unitsGroup=new THREE.Group(),fxGroup=new THREE.Group(),hoverGroup=new THREE.Group();scene.add(terrain,terrainMarks,objects,unitsGroup,fxGroup,hoverGroup);
const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,8),cone=new THREE.ConeGeometry(1,1,8),cyl=new THREE.CylinderGeometry(1,1,1,8),ringGeo=new THREE.TorusGeometry(1,.035,5,28);
const roofGeo=new THREE.BufferGeometry(),roofPoints=[[-.5,.45,0],[.5,.45,0],[-.5,0,.5],[.5,0,.5],[-.5,0,-.5],[.5,0,-.5]];
roofGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,2,3,0,3,1,0,1,5,0,5,4,0,4,2,1,3,5,2,4,5,2,5,3].flatMap(i=>roofPoints[i]),3));roofGeo.computeVertexNormals();
const mat=(c,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:.92,...extra});const landMats=[null,mat(0x988665),mat(0x869a66),mat(0x73a26a),mat(0x7e9569),mat(0xb9b8ae)],sideMats=[null,mat(0x605747),mat(0x5e6650),mat(0x52684b),mat(0x53624d),mat(0x777d7b)];const woodMat=mat(0x725746),roofMats=[mat(0x446a56),mat(0xa45043)],stoneMat=mat(0xc0ad83),wildMat=mat(0xc8c0a4),trunkMat=mat(0x654c38),leafMats=[mat(0x294e3c),mat(0x38664a),mat(0x54825a)],waterMat=mat(0x9cc4bc,{transparent:true,opacity:.35}),terraceGold=mat(0xd1bd7b),terraceRough=mat(0xb17b68),plotHighlight=mat(0x8fffe1,{emissive:0x216e58,emissiveIntensity:.6}),hoverLineMat=new THREE.LineBasicMaterial({color:0xe9fff8,transparent:true,opacity:.95,depthTest:false}),hoverResultMat=new THREE.LineBasicMaterial({color:0x8fffe1,transparent:true,opacity:.9,depthTest:false}),spiritBack=mat(0x172b30),sacredGround=mat(0xd6ba7b,{emissive:0x9a7140,emissiveIntensity:.45});
const plasterMat=mat(0xdacba8),thatchMat=mat(0xb5a16d),timberMat=mat(0x583f31),masonryMat=mat(0x929e91),masonryLight=mat(0xd1c5a7),doorMat=mat(0x352c2b),windowMat=mat(0xf6d486,{emissive:0x9c6b24,emissiveIntensity:.45}),pebbleMat=mat(0xffffff),mineralMat=mat(0x9aa6b2,{metalness:.18}),oreTraceMat=mat(0x66737b,{metalness:.08});
const DEVOTION_GOAL=4000,FESTIVAL_COST=70,STONE_COST=20,GROVE_COST=12,MINERAL_COST=16,TREE_TIMBER_MAX=2,STONE_RITE_TERRACE=7,REGIONAL_FESTIVAL_REWARD=900,REGIONS=['North','Crossing','South'];
const GROVE_OFFSETS=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
const BUILDING_TIERS=[null,{name:'Hut',flat:0,born:0,age:0,wait:0,rooms:6},{name:'House',flat:4,born:3,age:25,wait:0,rooms:9},{name:'Fort',flat:6,born:6,age:85,wait:35,rooms:13},{name:'Castle',flat:8,born:10,age:160,wait:50,rooms:18}];
const CAMPS=[{x:10,z:H/2},{x:W-11,z:H/2}];
const SHRINE_SPOTS=[{x:18,z:H/2-6},{x:18,z:H/2+6},{x:W/2,z:H/2},{x:W-19,z:H/2-6},{x:W-19,z:H/2+6}];
let nextFestivalAt=[0,0],regionalVows=[new Set(),new Set()],riteClock=0,forestClock=0,enemyPilgrimAt=15,aiStyle='stones',seed=2026,tiles=[],buildings=[],people=[],faith=[45,45],devotion=[0,0],lastSettlementAt=[-30,-30],shrines=[],mode='inspect',running=true,speed=1,elapsed=0,tick=0,aiClock=0,settlementClock=0,ended='',logs=[],toastTimer=0,fx=[],shaman,selectedSite=null,lastMini=-1000;
let terrainLevels=[],terrainSlots=null,terrainHeights=null,pebbleSlots=null,pebbleInstances=null;
const instanceTransform=new THREE.Object3D();
function newShrines(){return SHRINE_SPOTS.map(({x,z})=>({x,z,owner:2,projectOwner:2,progress:0,buildX:null,buildZ:null,spirit:0,lock:0}))}
const rand=(x,y,s=seed)=>{let n=Math.imul(x+11,374761393)+Math.imul(y+23,668265263)+Math.imul(s,2246822519);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296};
function geologyAt(x,z){
 let mirror=Math.min(x,W-1-x),coarse=rand(Math.floor(mirror/5),Math.floor(z/5),seed+301),mid=rand(Math.floor(mirror/2),Math.floor(z/2),seed+302),fine=rand(mirror,z,seed+303),vein=coarse*.58+mid*.3+fine*.12;
 if(vein<.57)return 0;
 return clamp(2+Math.floor((vein-.57)/.105),2,5)
}
const at=(x,z)=>x>=0&&z>=0&&x<W&&z<H?tiles[z*W+x]:null;const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);const height=(x,z)=>at(Math.round(x),Math.round(z))?.h||0;const pos=(x,z)=>new THREE.Vector3(x-W/2+.5,surfaceHeight(x+.5,z+.5)*.48,z-H/2+.5);
function mesh(geo,material,parent,x,y,z,sx=1,sy=1,sz=1){let o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function clear(group){while(group.children.length){let child=group.children[0];group.remove(child);if(child.isInstancedMesh)child.dispose();if(child.geometry&&!([box,sphere,cone,cyl,ringGeo,roofGeo].includes(child.geometry)))child.geometry.dispose()}}
function log(s){logs.unshift(s);logs=logs.slice(0,5);$('#events').innerHTML=logs.map(v=>`<p>${v}</p>`).join('');toast(s)}
function toast(s){let e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2600)}
function paintLandforms(){
 // Mirrored highlands keep each tribe's opening terrain comparable.
 for(let peak of [{x:8,z:16},{x:10,z:31}])for(let cx of [peak.x,W-1-peak.x]){
  for(let z=peak.z-4;z<=peak.z+4;z++)for(let x=cx-4;x<=cx+4;x++){
   let d=Math.hypot(x-cx,(z-peak.z)*1.08),level=d<=1.4?5:d<=2.5?4:d<=4?3:0,t=at(x,z);
   if(t&&level){t.h=Math.max(t.h,level);if(t.h>=4)t.tree=false}
  }
 }
 // Each river joins a broad lake and reaches both shores. Fill bends so the
 // channels remain connected even when the rounded centre line changes row.
 for(let bank of [0,1]){
  let previous=null;
  for(let x=0;x<W;x++){
   let mirror=Math.min(x,W-1-x),north=11+Math.round(Math.sin(mirror*.23+.45)*1.3+Math.sin(mirror*.45)*.45),z=bank?H-1-north:north;
   for(let row=Math.min(z,previous??z);row<=Math.max(z,previous??z);row++){let t=at(x,row);t.h=0;t.tree=false;t.feature='river'}
   previous=z
  }
  let centre=bank?H-13:12;
  for(let z=centre-3;z<=centre+3;z++)for(let x=27;x<=36;x++)if(((x-31.5)/4.8)**2+((z-centre)/3.2)**2<=1){let t=at(x,z);t.h=0;t.tree=false;t.feature='lake'}
 }
}
function makeWorld(){
 clear(unitsGroup);clear(fxGroup);fx=[];seed=Math.floor(Math.random()*900000)+1000;aiStyle=rand(41,67)>.5?'villages':'stones';
 tiles=[];buildings=[];people=[];faith=[45,45];devotion=[0,0];lastSettlementAt=[-30,-30];nextFestivalAt=[0,0];regionalVows=[new Set(),new Set()];enemyPilgrimAt=aiStyle==='villages'?40:15;shrines=newShrines();
 elapsed=0;tick=0;aiClock=0;settlementClock=0;riteClock=0;forestClock=0;ended='';running=true;speed=1;logs=[];mode='inspect';selectedSite=null;lastMini=-1000;
 $('#sitePanel').hidden=true;$('#result').hidden=true;$('#pause').textContent='PAUSE';$('#speed').textContent='1× SPEED';
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){
  let mirror=Math.min(x,W-1-x),island=Math.min(x,W-1-x,z,H-1-z);
  let noise=rand(Math.floor(mirror/3),Math.floor(z/3))*.7+rand(mirror,z)*.3;
  let h=island<2||noise<.16?0:clamp(Math.floor(noise*4.5),1,4);
  let tree=h>0&&h<=3&&rand(mirror,z,seed+1)>.76;tiles.push({h,tree,wood:tree?TREE_TIMBER_MAX:0,regrowAt:0,geology:geologyAt(x,z),mineral:0,building:null,feature:null})
 }
 paintLandforms();
 for(let camp of CAMPS)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){let t=at(camp.x+dx,camp.z+dz);t.h=2;t.tree=false}
 for(let z=H/2-2;z<=H/2+2;z++)for(let x=CAMPS[0].x+3;x<=CAMPS[1].x-3;x++){let t=at(x,z);t.h=2;t.tree=false}
 for(let x of [18,W-19])for(let z=H/2-6;z<=H/2+6;z++)for(let dx=-1;dx<=1;dx++){let t=at(x+dx,z);t.h=2;t.tree=false}
 for(let shrine of shrines)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
  let t=at(shrine.x+dx,shrine.z+dz);t.tree=false;
  if(dx||dz)t.h=dx===0&&dz===-1?2:(dx+dz+shrine.z)%3===0?2:(dx*dz>0?3:1);
  else t.h=2
 }
 for(let camp of CAMPS)for(let x of [camp.x,camp.x+1])for(let z of [camp.z+3,camp.z+4]){let t=at(x,z);t.h=2;t.tree=false}
 // Ecology follows the final terrain. Geology is latent and fixed by the seed; only an explicit Expose Minerals action creates a mineable seam.
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){let t=at(x,z);t.mineral=0;if(t.h>=4)t.tree=false}
 for(let [owner,camp] of CAMPS.entries()){
  addBuilding(camp.x,camp.z,owner,'hearth',true);
  addBuilding(camp.x+(owner?2:-2),camp.z-1,owner,'hut',true);
  addBuilding(camp.x+(owner?-2:2),camp.z,owner,'hut');
  for(let [dx,dz] of [[5,-3],[6,3]]){let t=at(camp.x+(owner?-dx:dx),camp.z+dz);t.h=2;t.tree=true;t.wood=TREE_TIMBER_MAX;t.regrowAt=0;t.mineral=0}
  for(let i=0;i<5;i++)addPerson(owner,camp.x+(owner?1:-1)+rand(i,owner),camp.z-1+rand(i,owner+2)*2,'brave')
 }
 let wildClusters=[[13,22],[18,21],[18,29],[30,19],[34,29],[W-19,21],[W-19,29],[W-14,22]];
 for(let [group,centre] of wildClusters.entries())for(let i=0;i<3;i++){
  let x=centre[0]+(rand(group,i,seed+5)-.5)*3,z=centre[1]+(rand(group,i,seed+6)-.5)*3;
  if(!validLand(Math.round(x),Math.round(z))){x=centre[0];z=centre[1]}
  addPerson(2,x,z,'wild')
 }
 shaman=addPerson(0,CAMPS[0].x,CAMPS[0].z+1,'shaman');
 addPerson(1,CAMPS[1].x,CAMPS[1].z-1,'shaman');
 renderTerrain();renderObjects();updateUI();
 log('Shape level land for growing homes. Mountain ridges contain visible mineral-bearing rock, while two rivers with lakes surround the five sacred sites.');
 log(aiStyle==='villages'?'Ember focuses on growing settlements.':'Ember pilgrims are seeking sacred sites.');
 cameraTarget(CAMPS[0].x+(stage.clientWidth<760?0:5),CAMPS[0].z)
}
function addBuilding(x,z,owner,type,complete=false){let t=at(x,z);if(!t||t.h<1||t.building)return null;let b={x,z,owner,type,progress:complete?1:0,wood:complete?3:0,provisions:0,stonework:0,discoveries:0,blessed:type==='hut'&&complete,level:1,born:0,completedAt:complete?elapsed:null,lastGrowthAt:complete?elapsed:null,pop:0,spawn:0,footprint:[{x,z}]};buildings.push(b);t.building=b;return b}
function addPerson(owner,x,z,type){let p={owner,x,z,type,goal:null,work:0,carry:0,ambientCarry:null,ambientReturn:null,ambientHome:null,idle:0,role:'worker',worshipSite:null,guardSite:null,workSite:null,tendSite:null,supportSite:null,intent:null,intentUntil:0,tendCooldown:0,route:null,routeGoal:null,job:type==='wild'?'ROAMING':'IDLE'};people.push(p);return p}
function terrainCornerHeight(cx,cz){
 let total=0,count=0;
 for(let dz=-1;dz<=0;dz++)for(let dx=-1;dx<=0;dx++){let t=at(cx+dx,cz+dz);if(t){total+=t.h;count++}}
 return count?total/count:0
}
function surfaceHeight(x,z){
 let tx=clamp(Math.floor(x),0,W-1),tz=clamp(Math.floor(z),0,H-1),t=at(tx,tz);if(!t)return 0;
 let lx=clamp(x-tx,0,1),lz=clamp(z-tz,0,1),centre=t.h;
 let nw=terrainCornerHeight(tx,tz),ne=terrainCornerHeight(tx+1,tz),se=terrainCornerHeight(tx+1,tz+1),sw=terrainCornerHeight(tx,tz+1);
 // Match the four triangles used by buildTerrainSurface exactly.
 if(lz<=lx&&lz<=1-lx)return nw*(1-lx-lz)+ne*(lx-lz)+centre*(2*lz);
 if(lx>=lz&&lx>=1-lz)return ne*(lx-lz)+se*(lx+lz-1)+centre*(2*(1-lx));
 if(lz>=lx&&lz>=1-lx)return se*(lx+lz-1)+sw*(lz-lx)+centre*(2*(1-lz));
 return sw*(lz-lx)+nw*(1-lx-lz)+centre*(2*lx)
}
function buildTerrainSurface(){
 let positions=[],colors=[],indices=[],vertex=0,color=new THREE.Color();
 const push=(x,y,z,c)=>{positions.push(x-W/2,y*.48,z-H/2);color.set(c);colors.push(color.r,color.g,color.b);return vertex++};
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){
  let t=at(x,z);if(!t?.h)continue;
  let c=landMats[t.h].color,nw=terrainCornerHeight(x,z),ne=terrainCornerHeight(x+1,z),se=terrainCornerHeight(x+1,z+1),sw=terrainCornerHeight(x,z+1);
  let a=push(x,nw,z,c),b=push(x+1,ne,z,c),d=push(x+1,se,z+1,c),e=push(x,sw,z+1,c),m=push(x+.5,t.h,z+.5,c);
  indices.push(a,b,m,b,d,m,d,e,m,e,a,m)
 }
 let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo
}
function placePebble(x,z){
 let index=pebbleSlots[z*W+x];if(index<0)return;
 let t=at(x,z),v=rand(x,z,seed+74),px=x+.5+(rand(x,z,seed+75)-.5)*.6,pz=z+.5+(rand(x,z,seed+76)-.5)*.6;
 instanceTransform.position.set(px-W/2,surfaceHeight(px,pz)*.48+.012,pz-H/2);
 instanceTransform.scale.set(t.h?.05:0,t.h?.03:0,t.h?.08:0);instanceTransform.updateMatrix();
 pebbleInstances.setMatrixAt(index,instanceTransform.matrix);
 pebbleInstances.setColorAt(index,(v>.5?stoneMat:landMats[Math.min(5,t.h+1)]).color)
}
function renderTerrainMarks(){
 clear(terrainMarks);
 for(let site of shrines)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
  if(!dx&&!dz)continue;
  let x=site.x+dx,z=site.z+dz,t=at(x,z);if(!t?.h)continue;
  let p=pos(x,z),marker=mesh(ringGeo,t.h===height(site.x,site.z)?terraceGold:terraceScore(site)>=4?stoneMat:terraceRough,terrainMarks,p.x,p.y+.04,p.z,.31,.31,.31);
  marker.rotation.x=Math.PI/2;marker.castShadow=false
 }
}
function renderTerrain(){
 clear(terrain);terrainLevels=[];terrainSlots=null;terrainHeights=new Int8Array(W*H);pebbleSlots=new Int32Array(W*H).fill(-1);
 for(let z=0;z<H;z++)for(let x=0;x<W;x++)terrainHeights[z*W+x]=at(x,z).h;
 let surfaceMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide}),surface=new THREE.Mesh(buildTerrainSurface(),surfaceMat);
 surface.castShadow=true;surface.receiveShadow=true;surface.userData.terrainSurface=true;surface.frustumCulled=false;terrain.add(surface);
 let pebbleCount=0;for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(rand(x,z,seed+71)>.65)pebbleSlots[z*W+x]=pebbleCount++;
 pebbleInstances=new THREE.InstancedMesh(sphere,pebbleMat,pebbleCount);pebbleInstances.castShadow=false;pebbleInstances.receiveShadow=true;pebbleInstances.frustumCulled=false;terrain.add(pebbleInstances);
 for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(pebbleSlots[z*W+x]>=0)placePebble(x,z);
 pebbleInstances.instanceMatrix.needsUpdate=true;pebbleInstances.instanceColor.needsUpdate=true;renderTerrainMarks()
}
function refreshTerrainAt(x,z){
 if(typeof terrain==='undefined'||!terrain.children?.length)return;
 terrainHeights[z*W+x]=at(x,z).h;
 let surface=terrain.children.find(o=>o.userData.terrainSurface);if(surface){surface.geometry.dispose();surface.geometry=buildTerrainSurface()}
 // Corner blending means one edit changes the visible slope of neighbouring tiles too.
 for(let nz=Math.max(0,z-1);nz<=Math.min(H-1,z+1);nz++)for(let nx=Math.max(0,x-1);nx<=Math.min(W-1,x+1);nx++)if(pebbleSlots[nz*W+nx]>=0)placePebble(nx,nz);
 if(pebbleInstances){pebbleInstances.instanceMatrix.needsUpdate=true;pebbleInstances.instanceColor.needsUpdate=true}
 renderTerrainMarks()
}
function renderStone(site){
 let mark=pos(site.x,site.z),building=site.projectOwner<2,built=site.owner<2,color=built?gem[site.owner]:building?gem[site.projectOwner]:sacredGround;
 let rune=mesh(ringGeo,color,objects,mark.x,mark.y+.07,mark.z,.78,.78,.78);rune.rotation.x=Math.PI/2;rune.castShadow=false;
 if(!building&&!built){mesh(box,sacredGround,objects,mark.x,mark.y+.035,mark.z,.28,.065,.28);for(let i=0;i<4;i++){let a=i*Math.PI/2;mesh(cyl,stoneMat,objects,mark.x+Math.sin(a)*.65,mark.y+.055,mark.z+Math.cos(a)*.65,.12,.11,.12)}site.bar=null;return}
 let p=pos(site.buildX+.5,site.buildZ+.5),fraction=built?1:site.progress;
 mesh(box,stoneMat,objects,p.x,p.y+.07,p.z,1.9,.13,1.9);
 let halo=mesh(ringGeo,color,objects,p.x,p.y+.15,p.z,.79,.79,.79);halo.rotation.x=Math.PI/2;halo.castShadow=false;
 for(let i=0;i<5;i++){let a=i*Math.PI*2/5,x=p.x+Math.sin(a)*.67,z=p.z+Math.cos(a)*.67,raised=built||fraction>=(i+1)/5;mesh(cyl,stoneMat,objects,x,p.y+(raised?.38:.17),z,.14,raised?.65:.23,.14)}
 if(built){mesh(cyl,stoneMat,objects,p.x,p.y+.25,p.z,.39,.4,.39);mesh(cone,color,objects,p.x,p.y+.72,p.z,.26,.7,.26);if(site.lock>0){let shield=mesh(ringGeo,color,objects,p.x,p.y+.17,p.z,1.03,1.03,1.03);shield.rotation.x=Math.PI/2}}
 else mesh(box,color,objects,p.x,p.y+.16,p.z,.45,.055,.45);
 mesh(box,spiritBack,objects,p.x,p.y+1.46,p.z,1.32,.16,.2);site.bar=mesh(box,color,objects,p.x,p.y+1.47,p.z+.015,.01,.1,.21);site.bar.castShadow=false;site.barX=p.x
}
function renderBuilding(b){
 let p=b.level===3&&b.type==='hut'?pos(b.footprint.reduce((sum,t)=>sum+t.x,0)/4,b.footprint.reduce((sum,t)=>sum+t.z,0)/4):pos(b.x,b.z),roof=roofMats[b.owner];
 const add=(geo,material,x,y,z,sx,sy,sz)=>{let part=mesh(geo,material,objects,p.x+x,p.y+y,p.z+z,sx,sy,sz);part.userData.inspectBuilding=b;return part};
 if(b.progress<1){add(box,roof,0,.025,0,.76,.05,.76);for(let x of [-.31,.31])for(let z of [-.31,.31])add(cyl,woodMat,x,.17,z,.045,.32,.045);if(b.wood)add(box,woodMat,0,.1,0,.4,.13,.4);return}
 if(b.type==='hearth'){add(cyl,stoneMat,0,.16,0,.78,.32,.78);add(cyl,roof,0,.48,0,.45,.45,.45);add(cone,roof,0,.92,0,.6,.55,.6);add(sphere,hearthGlow[b.owner],0,1.2,0,.14,.14,.14);return}
 if(b.level===1){
  add(box,stoneMat,0,.075,0,.85,.13,.84);add(box,plasterMat,0,.38,0,.65,.55,.63);
  for(let x of [-.3,.3])for(let z of [-.29,.29])add(cyl,timberMat,x,.39,z,.055,.65,.055);
  add(cone,thatchMat,0,.82,0,.59,.65,.57);add(box,doorMat,0,.26,.327,.22,.38,.025);
  add(box,roof,.24,.55,.34,.16,.1,.035)
 }else if(b.level===2){
  add(box,stoneMat,0,.085,0,1.02,.15,.96);add(box,plasterMat,0,.48,0,.9,.75,.82);
  for(let x of [-.42,.42])for(let z of [-.38,.38])add(box,timberMat,x,.49,z,.08,.78,.08);
  add(box,timberMat,0,.78,.42,.88,.085,.08);add(box,timberMat,0,.78,-.42,.88,.085,.08);
  add(roofGeo,roof,0,.83,0,1.16,.8,1.12);add(box,masonryMat,-.28,1.09,-.13,.14,.49,.15);
  add(box,doorMat,0,.3,.424,.25,.45,.035);for(let x of [-.3,.3]){add(box,windowMat,x,.56,.429,.16,.18,.025);add(box,timberMat,x,.56,.445,.025,.2,.03)}
 }else if(b.level===3){
  add(box,stoneMat,0,.08,0,1.94,.15,1.94);add(box,plasterMat,0,.47,0,.88,.67,.82);
  add(roofGeo,roof,0,.84,0,1.18,.85,1.18);add(box,doorMat,0,.3,.425,.25,.42,.035);
  for(let side of [-1,1]){add(box,timberMat,side*.82,.51,0,.15,.88,1.76);add(box,timberMat,side*.53,.51,.83,.65,.88,.15)}
  add(box,timberMat,0,.51,-.83,1.72,.88,.15);add(box,doorMat,0,.34,.847,.55,.62,.035);
  for(let x of [-.81,.81])for(let z of [-.81,.81]){add(cyl,timberMat,x,.74,z,.23,1.36,.23);add(cone,roof,x,1.61,z,.32,.45,.32)}
  for(let side of [-1,1]){add(cyl,woodMat,side*.28,1.36,.84,.025,.55,.025);add(box,roof,side*.4,1.52,.84,.25,.13,.025)}
 }else{
  add(box,stoneMat,0,.085,0,2.9,.15,2.9);add(box,masonryLight,0,.17,0,2.75,.13,2.75);
  for(let side of [-1,1]){add(box,masonryMat,side*1.27,.72,0,.25,1.15,2.57);add(box,masonryMat,side*.79,.72,side*1.27,.98,1.15,.25)}
  add(box,masonryMat,0,.72,-1.27,1.56,1.15,.25);
  add(box,masonryMat,0,.72,1.27,.62,1.15,.25);add(box,doorMat,0,.46,1.405,.68,.78,.04);
  for(let x of [-1.25,1.25])for(let z of [-1.25,1.25]){add(cyl,masonryLight,x,1.04,z,.29,1.85,.29);add(cone,roof,x,2.17,z,.39,.53,.39);add(box,doorMat,x,1.38,z+(z>0?.28:-.28),.1,.2,.035)}
  for(let side of [-1,1])for(let v of [-.92,-.46,0,.46,.92]){add(box,masonryLight,side*1.27,1.38,v,.25,.22,.24);add(box,masonryLight,v,1.38,side*1.27,.24,.22,.25)}
  add(box,masonryLight,0,1.03,0,1.28,1.7,1.22);for(let x of [-.59,.59])for(let z of [-.56,.56])add(box,masonryMat,x,1.02,z,.09,1.72,.09);
  add(roofGeo,roof,0,1.91,0,1.56,1.04,1.5);add(box,doorMat,0,.41,.63,.3,.48,.04);
  for(let x of [-.34,.34]){add(box,windowMat,x,1.28,.62,.15,.28,.035);add(box,masonryMat,x,1.28,.646,.035,.3,.04)}
  add(cyl,timberMat,0,2.47,0,.035,.83,.035);add(box,roof,.25,2.72,0,.48,.24,.045)
 }
 if(b.blessed){let y=[0,1.34,1.45,2.03,2.67][b.level];add(sphere,gem[b.owner],0,y,0,.12,.12,.12);let halo=add(ringGeo,gem[b.owner],0,.14,0,b.level>2?.72:.48,b.level>2?.72:.48,b.level>2?.72:.48);halo.rotation.x=Math.PI/2;halo.castShadow=false}
}
function renderObjects(){
 clear(objects);
 let counts=[0,0,0];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(at(x,z).tree&&at(x,z).h)counts[Math.floor(rand(x,z,seed+2)*3)]++;
 let trunks=new THREE.InstancedMesh(cyl,trunkMat,counts.reduce((a,b)=>a+b,0));
 let foliage=counts.map((count,i)=>new THREE.InstancedMesh(cone,leafMats[i],count*2));
 objects.add(trunks,...foliage);
 let trunkSlot=0,leafSlots=[0,0,0];
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){
  let t=at(x,z);if(!t.tree||!t.h)continue;
  let p=pos(x,z),color=Math.floor(rand(x,z,seed+2)*3),leaves=foliage[color],maturity=.7+.15*clamp(t.wood||1,1,TREE_TIMBER_MAX);
  instanceTransform.position.set(p.x,p.y+.24*maturity,p.z);instanceTransform.scale.set(.09*maturity,.5*maturity,.09*maturity);instanceTransform.updateMatrix();trunks.setMatrixAt(trunkSlot++,instanceTransform.matrix);
  for(let [y,sx,sy] of [[.66,.37,.8],[.93,.26,.62]]){instanceTransform.position.set(p.x,p.y+y*maturity,p.z);instanceTransform.scale.set(sx*maturity,sy*maturity,sx*maturity);instanceTransform.updateMatrix();leaves.setMatrixAt(leafSlots[color]++,instanceTransform.matrix)}
 }
 trunks.instanceMatrix.needsUpdate=true;trunks.castShadow=true;trunks.receiveShadow=true;
 for(let leaves of foliage){leaves.instanceMatrix.needsUpdate=true;leaves.castShadow=true;leaves.receiveShadow=true}
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){let t=at(x,z);if(!t.h)continue;let p=pos(x,z);
  if(t.mineral){let n=Math.min(3,t.mineral);for(let i=0;i<n;i++){let a=i*2.1+rand(x,z,seed+94)*2,s=.11+i*.018;mesh(sphere,mineralMat,objects,p.x+Math.cos(a)*.18,p.y+.07+s*.4,p.z+Math.sin(a)*.18,s,.08+s*.45,s)}}
  else if(t.h>=4&&t.geology){let n=t.geology>=4?2:1;for(let i=0;i<n;i++){let a=i*2.7+rand(x,z,seed+194)*2.2,s=.045+(t.geology>=4?.012:0);mesh(sphere,oreTraceMat,objects,p.x+Math.cos(a)*.22,p.y+.035,p.z+Math.sin(a)*.22,s,.018,s*.72)}}
 }
 for(let shrine of shrines)renderStone(shrine);
 for(let b of buildings)renderBuilding(b)
}
function updateShrineVisuals(){for(let site of shrines){if(!site.bar)continue;let level=site.owner===2?site.progress:site.spirit/100,width=Math.max(.01,1.23*clamp(level,0,1));site.bar.material=gem[site.owner===2?site.projectOwner:site.owner];site.bar.scale.x=width;site.bar.position.x=site.barX-(1.23-width)/2;site.bar.visible=level>.001}}
// Each follower owns a small character rig. Geometry and materials are shared across rigs.
const hearthGlow=[mat(0xafffeb,{emissive:0x2f9d81,emissiveIntensity:1.5}),mat(0xffa28b,{emissive:0x9d2d23,emissiveIntensity:1.5})];
const skin=[mat(0xc89f79),mat(0xa97756),mat(0xb3a080)],cloth=[mat(0x397b76),mat(0xa04f43),mat(0x776c59)],trim=[mat(0x95d5ba),mat(0xebaa7c),mat(0xd7c29b)],hair=[mat(0x392d2b),mat(0x4b3026),mat(0x555047)],eyes=mat(0x252523),staffMat=mat(0x665038),gem=[mat(0x8fffe1,{emissive:0x39bbaa,emissiveIntensity:2}),mat(0xffac83,{emissive:0xd94c32,emissiveIntensity:2})],shadowMat=mat(0x12252a,{transparent:true,opacity:.3,depthWrite:false});
function followerRig(p){let owner=p.owner,kind=p.type,sh=kind==='shaman',wild=owner===2,group=new THREE.Group(),body=new THREE.Group();group.add(body);group.userData={body,legs:[],arms:[],kind:owner+':'+kind};unitsGroup.add(group);
 let base=owner===2?2:owner,scale=sh?1.28:1;body.scale.setScalar(scale);
 let shadow=mesh(sphere,shadowMat,group,0,.035,0,.27,.015,.22);shadow.castShadow=false;
 if(sh){let halo=mesh(ringGeo,gem[owner],group,0,.065,0,.42,.42,.42);halo.rotation.x=Math.PI/2;halo.castShadow=false;group.userData.halo=halo}
 for(let side of [-1,1]){let leg=new THREE.Group();leg.position.set(side*.105,.35,0);body.add(leg);mesh(cyl,wild?skin[2]:cloth[base],leg,0,-.15,0,.068,.31,.068);mesh(box,wild?skin[2]:staffMat,leg,0,-.3,.06,.1,.08,.19);group.userData.legs.push(leg)}
 if(sh){mesh(cone,cloth[base],body,0,.44,0,.31,.66,.28);mesh(cone,trim[base],body,0,.31,0,.28,.15,.27);mesh(sphere,cloth[base],body,0,.75,-.06,.26,.19,.21);mesh(sphere,trim[base],body,0,.82,.1,.18,.065,.12)}
 else{mesh(box,wild?skin[2]:cloth[base],body,0,.59,0,.38,.42,.23);mesh(box,wild?cloth[2]:trim[base],body,0,.39,.01,.39,.09,.26);if(!wild){mesh(box,staffMat,body,0,.67,-.15,.3,.28,.1);mesh(box,trim[base],body,0,.66,-.21,.31,.08,.055)}}
 for(let side of [-1,1]){let arm=new THREE.Group();arm.position.set(side*.245,sh?.79:.73,0);body.add(arm);mesh(cyl,sh?cloth[base]:skin[base],arm,side*.04,-.13,0,.07,.28,.07);mesh(sphere,skin[base],arm,side*.04,-.29,.01,.065,.065,.065);group.userData.arms.push(arm)}
 mesh(sphere,skin[base],body,0,sh?1.05:.96,.02,.17,.19,.15);mesh(sphere,hair[base],body,0,sh?1.18:1.075,-.045,.175,.09,.15);
 for(let side of [-1,1])mesh(sphere,eyes,body,side*.072,sh?1.065:.975,.16,.018,.021,.011);
 if(sh){let hood=mesh(cone,cloth[base],body,0,1.23,-.065,.225,.35,.23);hood.rotation.x=-.15;mesh(cyl,staffMat,body,.35,.7,.08,.028,1.1,.028);mesh(sphere,gem[owner],body,.35,1.28,.08,.115,.12,.115);mesh(ringGeo,gem[owner],body,.35,1.28,.08,.18,.18,.18);}
 else if(wild){mesh(cone,hair[2],body,0,1.11,-.04,.2,.23,.2);mesh(sphere,hair[2],body,0,.87,-.025,.16,.06,.16)}
 else{let cap=mesh(cone,cloth[base],body,0,1.12,-.02,.19,.15,.18);cap.rotation.z=-.17;mesh(box,trim[base],body,0,1.055,.02,.35,.045,.32);}
 if(!sh&&!wild){let bundle=mesh(cyl,woodMat,body,0,.55,.25,.065,.38,.065);bundle.rotation.z=Math.PI/2;bundle.visible=false;group.userData.bundle=bundle;let halo=mesh(ringGeo,gem[owner],group,0,.07,0,.29,.29,.29);halo.rotation.x=Math.PI/2;halo.visible=false;halo.castShadow=false;group.userData.worshipHalo=halo}return group}
function renderUnits(time){for(let child of [...unitsGroup.children])if(!people.some(p=>p.visual===child))unitsGroup.remove(child);
 for(let p of people){let kind=p.owner+':'+p.type;if(!p.visual||p.visual.userData.kind!==kind){if(p.visual)unitsGroup.remove(p.visual);p.visual=followerRig(p);p.lastX=p.x;p.lastZ=p.z;p.walkPhase=0}
 let rig=p.visual,v=pos(p.x,p.z),dx=p.x-p.lastX,dz=p.z-p.lastZ,moving=Math.hypot(dx,dz)>.0005;rig.position.set(v.x,v.y,v.z);if(moving){rig.rotation.y=Math.atan2(dx,dz);p.walkPhase+=Math.hypot(dx,dz)*18}p.lastX=p.x;p.lastZ=p.z;
 let swing=moving?Math.sin(p.walkPhase)*.5:Math.sin(time*.0015+p.x)*.035;rig.userData.legs[0].rotation.x=swing;rig.userData.legs[1].rotation.x=-swing;rig.userData.arms[0].rotation.x=-swing*.7;rig.userData.arms[1].rotation.x=swing*.7;rig.userData.body.position.y=(moving?Math.abs(Math.sin(p.walkPhase))*.025:Math.sin(time*.002+p.x)*.018);if(rig.userData.halo)rig.userData.halo.rotation.z=time*.00045;
 if(rig.userData.bundle)rig.userData.bundle.visible=!!(p.carry||p.ambientCarry);if(rig.userData.worshipHalo)rig.userData.worshipHalo.visible=p.role==='worshipper'||!!p.tendSite;}}

function validLand(x,z){let t=at(x,z);return !!t&&t.h>0}
function nearest(list,p){let best=null,d=Infinity;for(let item of list){let n=dist(item,p);if(n<d){best=item;d=n}}return best}
function landRoute(from,to){let sx=Math.round(from.x),sz=Math.round(from.z),gx=Math.round(to.x),gz=Math.round(to.z),start=sz*W+sx,end=gz*W+gx;if(!validLand(gx,gz))return null;let queue=[start],seen=new Int32Array(W*H).fill(-1);seen[start]=start;for(let head=0;head<queue.length;head++){let index=queue[head];if(index===end)break;let x=index%W,z=Math.floor(index/W);for(let [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,nz=z+dz,ni=nz*W+nx;if(validLand(nx,nz)&&seen[ni]===-1){seen[ni]=index;queue.push(ni)}}}if(seen[end]===-1)return null;let path=[];for(let i=end;i!==start;i=seen[i])path.push({x:i%W,z:Math.floor(i/W)});return path.reverse()}
function move(p,goal,dt,rate=1){if(!goal)return;if(p.routeGoal!==goal){p.route=null;p.routeGoal=goal}let destination=p.route?.length?p.route[0]:goal,dx=destination.x-p.x,dz=destination.z-p.z,d=Math.hypot(dx,dz);if(d<.14){if(p.route?.length){p.route.shift();return}p.goal=null;p.route=null;return}let step=Math.min(d,dt*rate),x=p.x+dx/d*step,z=p.z+dz/d*step;if(validLand(Math.round(x),Math.round(z))){p.x=x;p.z=z}else{p.route=landRoute(p,goal);if(!p.route)p.goal=null}}
function validWorshipSite(target,owner){return shrines.includes(target)?target.owner===owner:buildings.includes(target)&&target.owner===owner&&target.blessed&&target.progress===1}
function villageStaffing(owner){
 let homes=buildings.filter(b=>b.owner===owner&&b.type==='hut'&&b.progress===1).length,workers=people.filter(p=>p.owner===owner&&p.type==='brave'&&p.role==='worker').length;
 return homes?workers/homes:workers
}
function siteNeeds(site,owner){
 let stone=shrines.includes(site),huts=buildings.filter(b=>b.owner===owner&&b.type==='hut'&&b.progress===1&&dist(b,site)<5).length;
 if(!stone){let workers=villageStaffing(owner);return {huts,workers,healthy:huts>=1&&workers>=1}}
 let radius=4,workers=people.filter(p=>p.owner===owner&&p.type==='brave'&&['worker','keeper'].includes(p.role)&&dist(p,site)<radius).length,worship=siteWorshippers(site,owner);
 return {huts,workers,healthy:huts>=1&&workers>=2||worship>=2&&terraceScore(site)>=4}
}
function siteBelief(site){return site.belief??35}
function terraceScore(site){let level=height(site.x,site.z),matched=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if((dx||dz)&&height(site.x+dx,site.z+dz)===level)matched++;return matched}
function plotAt(x,z,owner){
 let tile=at(x,z),point={x,z};if(!tile||tile.h<1||tile.building||tile.tree)return false;
 if(shrines.some(s=>dist(point,s)<2.25)||buildings.some(b=>dist(point,b)<2.25))return false;
 if(![...buildings,...shrines].some(s=>s.owner===owner&&(shrines.includes(s)||s.progress===1)&&dist(point,s)<5.5))return false;
 for(let dz=0;dz<=1;dz++)for(let dx=0;dx<=1;dx++){let part=at(x+dx,z+dz);if(!part||part.h!==tile.h||part.tree||part.building||shrines.some(s=>s.x===x+dx&&s.z===z+dz))return false}
 return true
}
function stoneSiteForPlot(x,z){return shrines.find(site=>x>=site.x-1&&x<=site.x&&z>=site.z-1&&z<=site.z)||null}
function stoneFootprint(site,x,z){return site.buildX!==null&&x>=site.buildX&&x<=site.buildX+1&&z>=site.buildZ&&z<=site.buildZ+1}
function canBuildStone(site,x,z){
 if(!site||site.owner!==2||site.projectOwner!==2||stoneSiteForPlot(x,z)!==site)return false;
 let level=height(site.x,site.z);if(!level)return false;
 for(let dz=0;dz<=1;dz++)for(let dx=0;dx<=1;dx++){let tile=at(x+dx,z+dz);if(!tile||tile.h!==level||tile.tree||tile.building)return false}
 return true
}
function stoneCandidate(site){for(let z=site.z-1;z<=site.z;z++)for(let x=site.x-1;x<=site.x;x++)if(canBuildStone(site,x,z))return {x,z};return null}
function stonePreparation(site){
 if(!site||site.owner!==2||site.projectOwner!==2)return null;
 let best=null,level=height(site.x,site.z);
 for(let z=site.z-1;z<=site.z;z++)for(let x=site.x-1;x<=site.x;x++){
  let edits=[];for(let dz=0;dz<=1;dz++)for(let dx=0;dx<=1;dx++){let px=x+dx,pz=z+dz,t=at(px,pz);if(t.h!==level)edits.push({x:px,z:pz,dir:Math.sign(level-t.h)});if(t.tree||t.building)edits.push({blocked:true})}
  if(edits.length&&edits.every(e=>!e.blocked)&&(!best||edits.length<best.edits))best={...edits[0],edits:edits.length}
 }
 return best
}
function newStonePadFromTile(x,z,next){let site=shrines.find(s=>s.owner===2&&s.projectOwner===2&&Math.max(Math.abs(s.x-x),Math.abs(s.z-z))===1);if(!site)return null;let before=stoneCandidate(site),t=at(x,z),old=t.h;t.h=next;let after=stoneCandidate(site);t.h=old;return !before&&after?{site,...after}:null}
function levelLand(hut,x,z){let tile=at(x,z);return !!tile&&tile.h===height(hut.x,hut.z)&&!tile.tree&&(!tile.building||tile.building===hut)&&!shrines.some(site=>site.x===x&&site.z===z||stoneFootprint(site,x,z))}
function flatAround(hut){let count=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if((dx||dz)&&levelLand(hut,hut.x+dx,hut.z+dz))count++;return count}
function buildingFootprint(hut,tier){
 if(tier<3)return [{x:hut.x,z:hut.z}];
 let squares=tier===3?[[0,0],[-1,0],[0,-1],[-1,-1]]:[[-1,-1]];
 for(let [left,top] of squares){let tiles=[];for(let dz=0;dz<(tier===3?2:3);dz++)for(let dx=0;dx<(tier===3?2:3);dx++)tiles.push({x:hut.x+left+dx,z:hut.z+top+dz});
  if(tiles.every(tile=>levelLand(hut,tile.x,tile.z)))return tiles}
 return null
}
function hutLevel(hut){if(hut.type!=='hut'||hut.progress<1)return 1;let next=hut.level+1,rule=BUILDING_TIERS[next];if(!rule)return hut.level;let stone=next>=3?(hut.stonework||0):0,age=elapsed-(hut.completedAt??elapsed)+stone*3,sinceGrowth=elapsed-(hut.lastGrowthAt??elapsed)+stone*6;return flatAround(hut)>=rule.flat&&hut.born>=rule.born&&age>=rule.age&&sinceGrowth>=rule.wait&&buildingFootprint(hut,next)?next:hut.level}
function growthDetails(hut){let next=BUILDING_TIERS[hut.level+1];if(!next)return 'fully grown';let stone=hut.level+1>=3?(hut.stonework||0):0,age=Math.max(0,Math.floor(elapsed-(hut.completedAt??elapsed)+stone*3)),sinceGrowth=Math.max(0,Math.floor(elapsed-(hut.lastGrowthAt??elapsed)+stone*6));return `next ${next.name}: ${flatAround(hut)}/${next.flat} level neighbours, ${hut.born}/${next.born} growth, ${Math.min(age,next.age)}/${next.age}s old${next.wait?`, ${Math.min(sinceGrowth,next.wait)}/${next.wait}s since last growth`:''}${stone?`, ${stone} mined stone helping`:''}${hut.level>=2?`, clear ${hut.level===2?'2×2':'3×3'} footprint`:''}`}
function growBuilding(hut,tier){let footprint=buildingFootprint(hut,tier);if(!footprint)return false;for(let tile of footprint)at(tile.x,tile.z).building=hut;hut.footprint=footprint;hut.level=tier;hut.lastGrowthAt=elapsed;if(tier>=3)hut.stonework=Math.max(0,(hut.stonework||0)-2);return true}
function upgradedHutFromTile(x,z,next,owner=0){let tile=at(x,z),old=tile.h,before=buildings.filter(b=>b.owner===owner&&b.type==='hut'&&b.progress===1&&dist(b,{x,z})<1.5).map(b=>({b,level:hutLevel(b)}));tile.h=next;let upgrade=before.find(({b,level})=>hutLevel(b)>Math.max(level,b.level));let tier=upgrade&&hutLevel(upgrade.b),footprint=upgrade&&buildingFootprint(upgrade.b,tier);tile.h=old;return upgrade?{hut:upgrade.b,level:tier,footprint}:null}
function newPlotFromTile(x,z,next,owner=0){let tile=at(x,z),old=tile.h,was=[];for(let dz=-1;dz<=0;dz++)for(let dx=-1;dx<=0;dx++)was.push(plotAt(x+dx,z+dz,owner));tile.h=next;let plot=null,i=0;for(let dz=-1;dz<=0;dz++)for(let dx=-1;dx<=0;dx++,i++)if(!was[i]&&plotAt(x+dx,z+dz,owner))plot={x:x+dx,z:z+dz};tile.h=old;return plot}
function terrainBrush(x,z,dir,apply=false,owner=0){let t=at(x,z),terrace=shrines.find(site=>site.owner===owner&&Math.max(Math.abs(site.x-x),Math.abs(site.z-z))===1)||null;if(!t||t.building||shrines.some(site=>site.x===x&&site.z===z||stoneFootprint(site,x,z)))return {changed:0,terrace};if(terrace){let target=height(terrace.x,terrace.z);if(dir>0&&t.h>=target||dir<0&&t.h<=target)return {changed:0,terrace}}let next=clamp(t.h+dir,0,5);if(next===t.h)return {changed:0,terrace};let newPlot=newPlotFromTile(x,z,next,owner),newStonePad=newStonePadFromTile(x,z,next),upgrade=upgradedHutFromTile(x,z,next,owner);if(apply){t.h=next;t.feature=null;t.sculptedBy=owner;if(next>3){t.tree=false;t.wood=0;t.regrowAt=0}if(next<4)t.mineral=0;if(!next){t.tree=false;t.wood=0;t.regrowAt=0;t.mineral=0}refreshTerrainAt(x,z);if(upgrade)growBuilding(upgrade.hut,upgrade.level);if(newPlot)settlementClock=4}return {changed:1,terrace,newPlot,newStonePad,upgrade}}
function bridgeTiles(x,z){let choices=[[1,0],[0,1]].map(([dx,dz])=>{let line=Array.from({length:5},(_,i)=>({x:x+(i-2)*dx,z:z+(i-2)*dz})),ends=line.map(p=>at(p.x,p.z));return {tiles:line.filter(p=>at(p.x,p.z)?.h===0),crossing:ends[0]?.h>0&&ends[4]?.h>0}}).filter(choice=>choice.tiles.length);choices.sort((a,b)=>Number(b.crossing)-Number(a.crossing)||a.tiles.length-b.tiles.length);return choices[0]?.tiles||[]}
function bestTerraceBrush(site){let best=null,target=height(site.x,site.z);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;let x=site.x+dx,z=site.z+dz,t=at(x,z);if(!t||t.h===target)continue;let dir=Math.sign(target-t.h),plan=terrainBrush(x,z,dir,false,site.owner);if(plan.changed&&(!best||Math.abs(target-t.h)<best.steps))best={x,z,dir,changed:1,steps:Math.abs(target-t.h)}}return best}
function approachSite(p,site){let spots=[{x:site.x+.8,z:site.z},{x:site.x-.8,z:site.z},{x:site.x,z:site.z+.8},{x:site.x,z:site.z-.8}].filter(q=>validLand(Math.round(q.x),Math.round(q.z)));return nearest(spots,p)||{x:site.x,z:site.z}}
function assignWorshippers(owner,target,count=2){let capacity=shrines.includes(target)?4:2,current=people.filter(p=>p.owner===owner&&p.worshipSite===target).length,workers=people.filter(p=>p.owner===owner&&p.type==='brave'&&p.role==='worker'&&!p.carry).sort((a,b)=>dist(a,target)-dist(b,target));let chosen=workers.slice(0,Math.max(0,Math.min(count,capacity-current,workers.length-3)));for(let p of chosen){p.role='worshipper';p.worshipSite=target;p.workSite=null;p.tendSite=null;p.supportSite=null;p.intent=null;p.goal=approachSite(p,target);p.job='GOING TO WORSHIP'}return chosen.length}
function releaseWorshippers(site,count=Infinity){let assigned=people.filter(p=>p.owner===site.owner&&p.worshipSite===site);for(let p of assigned.slice(0,count)){p.role='worker';p.worshipSite=null;p.goal=null;p.route=null;p.workSite=null;p.intent=null;p.intentUntil=0;p.job='RETURNING TO WORK'}return Math.min(count,assigned.length)}
function syncSitePolicies(owner){
 let rival=people.find(p=>p.owner===1-owner&&p.type==='shaman');
 for(let site of [...shrines,...buildings].filter(s=>validWorshipSite(s,owner))){
  let stone=shrines.includes(site),region=faithRegion(site),needLevel=region==='Crossing'?3:2,festivalLandscape=region&&!regionalVows[owner].has(region)&&(stone?terraceScore(site)>=STONE_RITE_TERRACE:site.level>=needLevel),target=festivalLandscape?2:stone&&terraceScore(site)>=4?1:0,assigned=people.filter(p=>p.owner===owner&&p.worshipSite===site).length;
  if(assigned>target)releaseWorshippers(site,assigned-target);
  assigned=people.filter(p=>p.owner===owner&&p.worshipSite===site).length;if(assigned<target)assignWorshippers(owner,site,target-assigned);
  let threatened=stone&&rival&&dist(rival,site)<6&&site.spirit<90,guards=people.filter(p=>p.owner===owner&&p.guardSite===site);
  if(!threatened)for(let p of guards){p.guardSite=null;p.role='worker';p.goal=null;p.job='RETURNING TO WORK'}
  if(threatened&&!guards.length){let workers=people.filter(p=>p.owner===owner&&p.type==='brave'&&p.role==='worker'&&!p.carry).sort((a,b)=>dist(a,site)-dist(b,site));if(workers.length>3){let p=workers[0];p.role='keeper';p.guardSite=site;p.workSite=null;p.tendSite=null;p.supportSite=null;p.intent=null;p.goal=approachSite(p,site);p.job='GUARDING STONE'}}
 }
}
// Each number below is a fuzzy membership in [0,1]. Jobs compete using their
// graded urgency rather than a fixed build/tend/wander priority list.
function groveAllowed(tile){return !!tile&&tile.h>=1&&tile.h<=3&&!tile.building&&!tile.tree&&!tile.mineral}
function mineralAllowed(tile){return !!tile&&tile.h>=4&&tile.geology>0&&!tile.building&&!tile.tree&&!tile.mineral}
function sacredResourceBlocked(x,z){return shrines.some(s=>s.x===x&&s.z===z||stoneFootprint(s,x,z))}
function groveFootprint(x,z){return GROVE_OFFSETS.map(([dx,dz])=>({x:x+dx,z:z+dz})).filter(p=>groveAllowed(at(p.x,p.z))&&!sacredResourceBlocked(p.x,p.z))}
function environmentFeatureAllowed(kind,x,z){let tile=at(x,z);return kind==='grove'?groveAllowed(tile)&&!sacredResourceBlocked(x,z)&&groveFootprint(x,z).length>=3:kind==='mineral'?!sacredResourceBlocked(x,z)&&mineralAllowed(tile):false}
function environmentFeatureCost(kind){return kind==='grove'?GROVE_COST:kind==='mineral'?MINERAL_COST:Infinity}
function plantGrove(x,z){let planted=groveFootprint(x,z);for(let p of planted){let tile=at(p.x,p.z);tile.tree=true;tile.wood=TREE_TIMBER_MAX;tile.regrowAt=0}return planted}
function woodlandNeighbours(x,z,radius=2){let n=0;for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){if(!dx&&!dz)continue;if(at(x+dx,z+dz)?.tree)n++}return n}
function updateWoodland(){
 let changed=false,phase=Math.floor(elapsed/15);
 for(let z=1;z<H-1;z++)for(let x=1;x<W-1;x++){let tile=at(x,z),neighbours=woodlandNeighbours(x,z);
  if(tile.tree){if(tile.h>=1&&tile.h<=3&&(tile.wood||0)<TREE_TIMBER_MAX&&neighbours>=2&&rand(x,z,seed+401+phase)>.68){tile.wood=Math.min(TREE_TIMBER_MAX,(tile.wood||0)+1);changed=true}}
  else if(tile.regrowAt&&elapsed>=tile.regrowAt){if(groveAllowed(tile)&&!sacredResourceBlocked(x,z)&&neighbours>=2){tile.tree=true;tile.wood=1;tile.regrowAt=0;changed=true}else tile.regrowAt=elapsed+25}
 }
 if(changed)renderObjects()
}
function placeEnvironmentFeature(kind,x,z,owner){
 let sh=people.find(p=>p.owner===owner&&p.type==='shaman'),cost=environmentFeatureCost(kind);if(!sh||faith[owner]<cost||dist(sh,{x,z})>5.5||!environmentFeatureAllowed(kind,x,z))return false;
 let tile=at(x,z),planted=null;if(kind==='grove')planted=plantGrove(x,z);else tile.mineral=tile.geology;faith[owner]-=cost;renderObjects();
 log(owner===0?(kind==='grove'?'A grove of '+planted.length+' trees takes root. It supplies finite timber and hunting cover.':'A mineral seam is exposed. Miners will begin working it when free.'):(kind==='grove'?'Ember planted a grove of '+planted.length+' trees.':'Ember exposed a mineral seam to draw miners.'));
 return true
}
function environmentCandidate(kind,home){
 let best=null;
 for(let z=Math.max(1,home.z-10);z<=Math.min(H-2,home.z+10);z++)for(let x=Math.max(1,home.x-10);x<=Math.min(W-2,home.x+10);x++){
  if(!environmentFeatureAllowed(kind,x,z))continue;let d=dist(home,{x,z});if(d<2.5||d>10)continue;
  let cluster=resourceCluster(kind==='grove'?'hunt':'mine',x,z),ideal=kind==='grove'?5.5:7,richness=kind==='mineral'?(at(x,z).geology||0):0,score=Math.abs(d-ideal)-(kind==='grove'?cluster*.24:cluster*.12)-richness*.28+rand(x,z,seed+211)*1.2;
  if(!best||score<best.score)best={kind,x,z,home,score}
 }
 return best
}
function aiEnvironmentChoice(owner){
 let homes=buildings.filter(b=>b.owner===owner&&b.type==='hut'&&b.progress===1),sh=people.find(p=>p.owner===owner&&p.type==='shaman');if(!homes.length||!sh)return null;
 let options=[];
 for(let home of homes){let env=localEnvironment(home),unfinished=buildings.some(b=>b.owner===owner&&b.progress<1&&dist(b,home)<9),advanced=home.level>=2||homes.length>=3;
  let groveNeed=Math.max(0,(aiStyle==='villages'?7:5)-env.trees)+(unfinished?2:0),mineralNeed=advanced?Math.max(0,(aiStyle==='villages'?6:4)-env.minerals):0;
  if(groveNeed>1&&faith[owner]>=GROVE_COST+24){let site=environmentCandidate('grove',home);if(site&&landRoute(sh,site))options.push({...site,need:groveNeed,score:groveNeed*1.1-site.score*.08})}
  if(mineralNeed>1&&faith[owner]>=MINERAL_COST+24){let site=environmentCandidate('mineral',home);if(site&&landRoute(sh,site))options.push({...site,need:mineralNeed,score:mineralNeed*(aiStyle==='villages'?1:1.15)-site.score*.08})}
 }
 return options.sort((a,b)=>b.score-a.score)[0]||null
}
function localEnvironment(anchor,radius=11){
 let trees=0,timber=0,minerals=0,open=0;
 for(let z=Math.max(1,Math.floor(anchor.z-radius));z<=Math.min(H-2,Math.ceil(anchor.z+radius));z++)for(let x=Math.max(1,Math.floor(anchor.x-radius));x<=Math.min(W-2,Math.ceil(anchor.x+radius));x++){
  let tile=at(x,z),d=dist(anchor,{x,z});if(!tile?.h||d>radius)continue;
  let weight=1-d/(radius+2)*.45;
  if(tile.tree){trees+=weight;timber+=(tile.wood||1)*weight}
  if(tile.mineral)minerals+=tile.mineral*weight;
  if(d>=6&&!tile.tree&&!tile.mineral&&!tile.building&&!shrines.some(s=>s.x===x&&s.z===z))open+=weight
 }
 return {trees,timber,minerals,open,hunt:clamp(trees/7,0,1.5),mine:clamp(minerals/9,0,1.5),explore:clamp(open/34,0,1.3)}
}
function resourceCluster(kind,x,z){
 let amount=0;
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){let t=at(x+dx,z+dz);if(!t?.h)continue;if(kind==='hunt'&&t.tree)amount+=1;if(kind==='mine'&&t.mineral)amount+=t.mineral;if(kind==='explore'&&!t.tree&&!t.mineral&&!t.building)amount+=1}
 return amount
}
function fuzzyHigh(value,low,high){return clamp((value-low)/(high-low),0,1)}
function fuzzyNear(distance,close=1,far=11){return 1-fuzzyHigh(distance,close,far)}
function activeProject(site,owner){return buildings.includes(site)?site.owner===owner&&site.progress<1:shrines.includes(site)&&site.projectOwner===owner&&site.progress<1}
function validWorkerIntent(intent,owner){
 if(!intent)return false;let s=intent.site;
 if(intent.kind==='build')return activeProject(s,owner);
 if(intent.kind==='tend')return validWorshipSite(s,owner)&&siteBelief(s)<90;
 if(intent.kind==='support')return buildings.includes(s)?s.owner===owner&&s.progress===1:shrines.includes(s)&&s.owner===owner;
 if(!s||!['hunt','mine','explore'].includes(intent.kind)||!validLand(Math.round(s.x),Math.round(s.z)))return false;
 let t=at(Math.round(s.x),Math.round(s.z));return intent.kind==='hunt'?!!t.tree:intent.kind==='mine'?t.mineral>0:!t.building
}
function ambientTarget(p,kind){
 let homes=buildings.filter(b=>b.owner===p.owner&&b.type==='hut'&&b.progress===1),anchor=nearest(homes,p)||nearest(buildings.filter(b=>b.owner===p.owner&&b.progress===1),p);if(!anchor)return null;
 let desired=kind==='hunt'?6:kind==='mine'?8:12,best=null,index=Math.max(0,people.indexOf(p)),phase=Math.floor(elapsed/8);
 for(let z=1;z<H-1;z++)for(let x=1;x<W-1;x++){let t=at(x,z),point={x,z};if(!t?.h||t.building)continue;let d=dist(point,anchor);if(d<3||d>15)continue;
  if(kind==='hunt'&&!t.tree||kind==='mine'&&!t.mineral||kind==='explore'&&(d<7||t.tree||t.mineral))continue;
  let crowded=people.some(q=>q!==p&&q.owner===p.owner&&q.intent?.kind===kind&&q.intent.site&&dist(q.intent.site,point)<1.7);if(crowded)continue;
  let cluster=resourceCluster(kind,x,z),bonus=kind==='hunt'?cluster*.22:kind==='mine'?cluster*.16:cluster*.035,
      score=Math.abs(d-desired)-bonus+rand(x+index*5,z+phase,seed+103)*1.6;
  if(!best||score<best.score)best={x,z,score}
 }
 return best&&{x:best.x,z:best.z}
}
function finishAmbientTrip(p){
 let kind=p.ambientReturn,home=p.ambientHome&&buildings.includes(p.ambientHome)?p.ambientHome:nearest(buildings.filter(b=>b.owner===p.owner&&b.type==='hut'&&b.progress===1),p);
 if(!kind)return;
 if(kind==='hunt'&&home){home.provisions=Math.min(5,(home.provisions||0)+1);if(p.owner===0&&home.provisions===1)log('Hunters returned with provisions. This home will grow its population faster.')}
 else if(kind==='mine'&&home){home.stonework=Math.min(5,(home.stonework||0)+1);if(p.owner===0&&home.stonework===1)log('Miners returned with building stone. It will help larger homes mature sooner.')}
 else if(kind==='explore'){faith[p.owner]=clamp(faith[p.owner]+4,0,160);if(home)home.discoveries=(home.discoveries||0)+1;if(p.owner===0&&home?.discoveries===1)log('Scouts returned with discoveries. +4 faith.')}
 p.ambientReturn=null;p.ambientHome=null;p.ambientCarry=null;renderObjects()
}
function chooseWorkerIntent(p){
 let owner=p.owner,capacity=housingCapacity(owner),population=people.filter(q=>q.owner===owner).length,housingPressure=fuzzyHigh(population/Math.max(1,capacity),.55,.95),vacancy=fuzzyHigh(capacity-population,1,7),best=null;
 const offer=(kind,site,score)=>{if(!best||score>best.score)best={kind,site,score}};
 let projects=[...buildings.filter(b=>activeProject(b,owner)),...shrines.filter(s=>activeProject(s,owner))];
 if(p.carry){let hut=buildings.includes(p.workSite)&&activeProject(p.workSite,owner)?p.workSite:nearest(projects.filter(b=>buildings.includes(b)),p);if(hut)return {kind:'build',site:hut,score:1}}
 for(let site of projects){let assigned=people.filter(q=>q!==p&&q.owner===owner&&q.role==='worker'&&q.workSite===site).length;if(assigned>=3)continue;
  let near=fuzzyNear(dist(p,site)),free=1-fuzzyHigh(assigned,1,3),stone=shrines.includes(site),rival=people.find(q=>q.owner===1-owner&&q.type==='shaman'),pressure=stone?Math.max(.7,rival?fuzzyNear(dist(rival,site),1,6):0):housingPressure,timber=stone?0:Math.min(1,localEnvironment(site,9).timber/8);
  offer('build',site,.6+.12*near+.15*pressure+.12*free+.04*(1-site.progress)+timber*.06+(p.workSite===site?.1:0))
 }
 for(let site of [...shrines,...buildings].filter(s=>validWorshipSite(s,owner))){
  let lowBelief=1-fuzzyHigh(siteBelief(site),35,85),near=fuzzyNear(dist(p,site)),needs=siteNeeds(site,owner),shortage=1-fuzzyHigh(needs.workers,0,2);
  if(siteBelief(site)<90&&elapsed>=p.tendCooldown&&!people.some(q=>q!==p&&q.tendSite===site))offer('tend',site,.25+.38*lowBelief+.15*near+.1*shortage+(p.tendSite===site?.08:0));
 }
 for(let site of shrines.filter(s=>s.owner===owner)){
  let radius=shrines.includes(site)?4:2.6,near=fuzzyNear(dist(p,site)),workers=people.filter(q=>q.owner===owner&&q.type==='brave'&&q.role==='worker'&&dist(q,site)<radius).length,inbound=people.filter(q=>q!==p&&q.owner===owner&&q.role==='worker'&&q.supportSite===site&&dist(q,site)>=radius).length,needed=Math.max(0,2-workers-inbound),belief=validWorshipSite(site,owner)?1-fuzzyHigh(siteBelief(site),35,85):0;
  if(!needed&&belief<.7)continue;if(inbound>=2&&p.supportSite!==site)continue;
  offer('support',site,.2+.2*near+.2*Math.min(1,needed)+.1*vacancy*(site.type==='hut'?1:.4)+.13*belief+(p.supportSite===site?.08:0)-.05*inbound)
 }
 let workers=people.filter(q=>q.owner===owner&&q.type==='brave'&&q.role==='worker').length,
     home=nearest(buildings.filter(b=>b.owner===owner&&b.type==='hut'&&b.progress===1),p)||nearest(buildings.filter(b=>b.owner===owner&&b.progress===1),p),
     localWorkers=home?people.filter(q=>q.owner===owner&&q.type==='brave'&&q.role==='worker'&&dist(q,home)<10).length:workers,
     localAmbient=home?people.filter(q=>q.owner===owner&&(['hunt','mine','explore'].includes(q.intent?.kind)&&q.intent.site&&dist(q.intent.site,home)<15||q.ambientReturn&&q.ambientHome===home)).length:0,
     maxAmbient=Math.max(1,Math.floor(localWorkers*.5));
 if(localWorkers>=4&&localAmbient<maxAmbient){
  let env=localEnvironment(home||p),pulls={hunt:env.hunt,mine:env.mine,explore:env.explore},total=Object.values(pulls).reduce((a,b)=>a+b,0)||1;
  for(let kind of ['hunt','mine','explore']){let pull=pulls[kind];if(pull<.08)continue;let active=home?people.filter(q=>q.owner===owner&&(q.intent?.kind===kind&&q.intent.site&&dist(q.intent.site,home)<15||q.ambientReturn===kind&&q.ambientHome===home)).length:0,targetCount=Math.max(1,Math.round(maxAmbient*pull/total));if(active>=targetCount)continue;let target=ambientTarget(p,kind);if(target){let saturation=active/targetCount;offer(kind,target,.24+Math.min(1.5,pull)*.18+fuzzyNear(dist(p,target),3,15)*.06-saturation*.05)}}
 }
 return best
}
function shrineFlow(site){if(site.owner>1)return 0;let worship=people.filter(p=>p.owner===site.owner&&p.role==='worshipper'&&p.worshipSite===site&&dist(p,site)<1.5).length;return .45+Math.min(4,terraceScore(site))*.2+worship*.9*(.65+siteBelief(site)*.009)}
function income(owner){let followers=people.filter(p=>p.owner===owner).length,blessed=buildings.filter(b=>b.owner===owner&&b.blessed&&b.progress===1),hutWorship=people.filter(p=>p.owner===owner&&p.role==='worshipper'&&buildings.includes(p.worshipSite)&&validWorshipSite(p.worshipSite,owner)&&dist(p,p.worshipSite)<1.5).reduce((sum,p)=>sum+.65*(.65+siteBelief(p.worshipSite)*.009),0);return .2+followers*.045+blessed.reduce((sum,b)=>sum+.3+(b.level-1)*.1,0)+hutWorship+shrines.filter(s=>s.owner===owner).reduce((sum,s)=>sum+shrineFlow(s),0)}
function siteDevotion(site){if(site.owner>1||!validWorshipSite(site,site.owner))return 0;let worship=people.filter(p=>p.owner===site.owner&&p.role==='worshipper'&&p.worshipSite===site&&dist(p,site)<1.5).length,belief=.55+siteBelief(site)*.008;if(shrines.includes(site))return (.3+Math.min(4,terraceScore(site))*.15+worship*.95)*belief;return (.8+worship*.58)*belief*(siteNeeds(site,site.owner).healthy?1:.65)*(1+(site.level-1)*.32)}
function devotionRate(owner){return [...shrines,...buildings].filter(s=>s.owner===owner).reduce((total,s)=>total+siteDevotion(s),0)}
function housingCapacity(owner){return Math.min(72,7+buildings.filter(b=>b.owner===owner&&b.type==='hut'&&b.progress===1).reduce((rooms,b)=>rooms+BUILDING_TIERS[b.level].rooms,0))}
function availablePlots(owner){let plots=[];for(let z=2;z<H-2;z++)for(let x=2;x<W-2;x++)if(plotAt(x,z,owner)){let sculpted=!![at(x,z),at(x+1,z),at(x,z+1),at(x+1,z+1)].some(t=>t.sculptedBy===owner),nearWorkers=people.filter(p=>p.owner===owner&&p.type==='brave'&&p.role==='worker'&&dist(p,{x,z})<6).length;plots.push({x,z,sculpted,nearWorkers})}return plots.sort((a,b)=>Number(b.sculpted)-Number(a.sculpted)||b.nearWorkers-a.nearWorkers||a.z-b.z||a.x-b.x)}
function planSettlement(owner){let huts=buildings.filter(b=>b.owner===owner&&b.type==='hut'),projects=huts.filter(b=>b.progress<1).length;if(projects>=2||huts.length>=12)return;let population=people.filter(q=>q.owner===owner).length,hearth=buildings.find(b=>b.owner===owner&&b.type==='hearth'),plot=availablePlots(owner).find(p=>p.sculpted||population>=housingCapacity(owner)-3&&elapsed-lastSettlementAt[owner]>=12&&(huts.length<3&&dist(p,hearth)<5.5||[...shrines,...buildings].some(s=>validWorshipSite(s,owner)&&dist(p,s)<4.5)));if(!plot)return;addBuilding(plot.x,plot.z,owner,'hut');lastSettlementAt[owner]=elapsed;for(let dz=0;dz<=1;dz++)for(let dx=0;dx<=1;dx++)at(plot.x+dx,plot.z+dz).sculptedBy=null;renderObjects();if(owner===0){ping(plot.x,plot.z,gem[0]);log(plot.sculpted?'The new flat ground attracted settlers. Braves are building a hut.':'Your growing tribe has started a hut on flat ground.')}else log('Ember settlers found flat ground and began a hut.')}
function startStoneProject(site,x,z,owner){if(!canBuildStone(site,x,z)||faith[owner]<STONE_COST)return false;faith[owner]-=STONE_COST;site.projectOwner=owner;site.buildX=x;site.buildZ=z;site.progress=0;renderObjects();ping(site.x,site.z,gem[owner]);log(owner===0?'Stone circle planned. Nearby followers are building it.':'Ember started a stone circle.');return true}
function consecrateStone(site,owner,startingSpirit=55){if(site.progress<1)return false;for(let p of people.filter(p=>p.worshipSite===site||p.guardSite===site)){p.role='worker';p.worshipSite=null;p.guardSite=null;p.goal=null}site.owner=owner;site.projectOwner=2;site.spirit=startingSpirit;site.belief=35;site.lock=0;site.warned=false;site.festivalUntil=0;renderObjects();log(owner===0?'Your stone circle is consecrated. Followers will respond to its terrace and any approaching threat.':'Ember consecrated a stone circle.');if(owner===1){enemyPilgrimAt=elapsed+(aiStyle==='villages'?48:60);syncSitePolicies(1)}return true}
function updateStoneSpirit(site,dt){if(site.owner===2)return;let shieldExpired=site.lock>0&&site.lock<=dt;site.lock=Math.max(0,site.lock-dt);if(shieldExpired)renderObjects();let visiting=people.filter(p=>p.type==='shaman'&&dist(p,site)<1.55),present=[visiting.some(p=>p.owner===0),visiting.some(p=>p.owner===1)],owner=site.owner,rival=1-owner,flow=shrineFlow(site),keeper=people.some(p=>p.owner===owner&&p.guardSite===site&&dist(p,site)<1.5),recovery=.7+flow*1.25+(present[owner]?7:0)+(keeper?5:0),pressure=site.lock>0||!present[rival]?0:7+Math.min(income(rival),8)*.7;site.spirit=clamp(site.spirit+(recovery-pressure)*dt,0,100);if(site.spirit<=0&&present[rival]&&site.lock<=0)consecrateStone(site,rival)}
function siteWorshippers(site,owner=0){return people.filter(p=>p.owner===owner&&p.role==='worshipper'&&p.worshipSite===site&&dist(p,site)<1.5).length}
function faithRegion(site){if(shrines.includes(site))return site.z<H/2?'North':site.z>H/2?'South':'Crossing';if(site.type!=='hut')return null;let anchor=nearest(SHRINE_SPOTS.filter(s=>dist(s,site)<=5.5),site);return anchor?anchor.z<H/2?'North':anchor.z>H/2?'South':'Crossing':null}
function victoryReady(owner){return devotion[owner]>=DEVOTION_GOAL&&regionalVows[owner].size===REGIONS.length}
function festivalReady(site,owner=0){if(!validWorshipSite(site,owner)||siteBelief(site)<55||siteWorshippers(site,owner)<2||!siteNeeds(site,owner).healthy||(site.festivalUntil||0)>elapsed||elapsed<nextFestivalAt[owner])return false;let region=faithRegion(site);if(!region||regionalVows[owner].has(region))return true;return shrines.includes(site)?terraceScore(site)>=STONE_RITE_TERRACE:site.level>=(region==='Crossing'?3:2)}
function festival(site,owner=0){if(!festivalReady(site,owner)){if(owner===0)toast('A festival needs 55 belief, two worshippers present and a healthy site. For an unfinished region, level seven stone terrace tiles or grow a nearby blessed home into a house (fort at the Crossing).');return false}if(faith[owner]<FESTIVAL_COST){if(owner===0)toast(`Save ${FESTIVAL_COST} faith for a festival.`);return false}faith[owner]-=FESTIVAL_COST;let region=faithRegion(site),newVow=region&&!regionalVows[owner].has(region),reward=Math.round(55+siteBelief(site)*.3+(shrines.includes(site)?Math.min(4,terraceScore(site))*4:0)+(newVow?REGIONAL_FESTIVAL_REWARD:0));if(newVow)regionalVows[owner].add(region);devotion[owner]+=reward;site.belief=clamp(siteBelief(site)-18,10,100);nextFestivalAt[owner]=elapsed+60;site.festivalUntil=nextFestivalAt[owner];if(shrines.includes(site))site.spirit=clamp(site.spirit+12,0,100);ping(site.x,site.z,gem[owner]);log(`${owner?'Ember':'Your tribe'} held ${newVow?`the first ${region} festival`:'a festival'}. +${reward} devotion.${owner?'':' The festival cooldown ends in 60 seconds.'}`);if(victoryReady(owner))finish(owner===0);updateUI();return true}
function canPlaceHut(x,z){return plotAt(x,z,0)}

function updateSitePanel(){
 let panel=$('#sitePanel'),site=selectedSite,stone=shrines.includes(site),home=buildings.includes(site)&&site?.owner===0&&site?.type==='hut',owned=validWorshipSite(site,0);
 if(!site||!home&&!stone||stone&&site.owner===1||stone&&site.projectOwner===1){panel.hidden=true;selectedSite=null;return}
 let needs=owned?siteNeeds(site,0):null,assigned=owned?people.filter(p=>p.owner===0&&p.worshipSite===site).length:0,cooldown=Math.max(0,Math.ceil(nextFestivalAt[0]-elapsed)),region=owned?faithRegion(site):null,pending=owned&&region&&!regionalVows[0].has(region),keepers=owned?people.filter(p=>p.guardSite===site).length:0;panel.hidden=false;
 if(panel.__site!==site){panel.__site=site;panel.innerHTML=`<b data-site-title></b><div class="spirit-meter" data-spirit-meter><i data-spirit-fill></i></div><p data-site-details></p><p data-site-note></p><div class="site-actions">${stone?'<button data-site-action="build">BUILD STONE · 20</button>':''}<button data-site-action="close">CLOSE</button></div>`}
 let tier=home?BUILDING_TIERS[site.level]:null;
 panel.querySelector('[data-site-title]').textContent=stone?owned?`STONE CIRCLE · ${Math.round(site.spirit)} / 100 SPIRIT`:site.projectOwner===0?`STONE CIRCLE · ${Math.floor(site.progress*100)}% BUILT`:'SACRED GROUND · EMPTY':site.progress<1?`${tier.name.toUpperCase()} · ${Math.floor(site.progress*100)}% BUILT`:`${tier.name.toUpperCase()} · ${Math.round(siteBelief(site))}% BELIEF`;
 let meter=panel.querySelector('[data-spirit-meter]');meter.hidden=!stone||!owned&&site.projectOwner!==0;meter.querySelector('i').style.width=`${stone?Math.round((owned?site.spirit/100:site.progress)*100):0}%`;
 if(home){
  let env=localEnvironment(site);panel.querySelector('[data-site-details]').textContent=site.progress<1?`Construction ${Math.round(site.progress*100)}% · timber delivered ${site.wood||0}/3 · followers gather nearby trees and complete it automatically.`:`${tier.rooms} housing · ${growthDetails(site)}${site.provisions?` · provisions ${site.provisions}/5 speed population growth`:''}${site.stonework?` · mined stone ${site.stonework}/5 aids development`:''}${site.discoveries?` · ${site.discoveries} scout discoveries`:''} · nearby ecology: ${Math.round(env.trees)} woodland, ${Math.round(env.minerals)} mineral, ${Math.round(env.open)} open · +${siteDevotion(site).toFixed(1)} devotion/s · ${Math.round(siteBelief(site))}% belief ${needs.healthy?'stable workforce':'workforce stretched'}`;
  panel.querySelector('[data-site-note]').textContent=pending?`${region} remains incomplete. When this home reaches ${region==='Crossing'?'fort':'house'} stage, followers will gather here automatically for a festival.`:'Homes respond automatically to surrounding level land, trees, minerals and the available workforce.';
 }else{
  panel.querySelector('[data-site-details]').textContent=!owned?site.projectOwner===0?'Followers are building the circle. A visiting rival shaman slows their work. Devotion begins when it is finished.':stoneCandidate(site)?'The 2×2 foundation is ready. Bring your shaman within three tiles and build for 20 faith.':'Raise or lower tiles around this rune to make a clear, level 2×2 foundation.':`+${siteDevotion(site).toFixed(1)} devotion/s · +${shrineFlow(site).toFixed(1)} faith/s · ${Math.round(siteBelief(site))}% belief · ${siteWorshippers(site,0)} worshippers present · ${keepers} keeper · ${terraceScore(site)}/8 terrace tiles level${cooldown?` · next festival in ${cooldown}s`:''}`;
  panel.querySelector('[data-site-note]').textContent=owned?(terraceScore(site)>=STONE_RITE_TERRACE&&pending?`The prepared ${region} terrace attracts two worshippers; the festival will happen automatically when belief and Faith are ready.`:terraceScore(site)>=4?'The developed terrace attracts worshippers automatically. A rival shaman approaching the circle will attract a keeper.':'Level four terrace tiles to strengthen the site; level seven to prepare its regional festival.'):'Shape the sacred ground to control what happens here.';
 }
 let buildButton=panel.querySelector('[data-site-action="build"]');if(buildButton)buildButton.hidden=owned||site.projectOwner!==2
}

function ai(dt){
 elapsed+=dt;aiClock+=dt;settlementClock+=dt;riteClock+=dt;forestClock+=dt;
 for(let site of [...shrines,...buildings.filter(b=>b.blessed&&b.progress===1)]){if(site.owner>1)continue;let needs=siteNeeds(site,site.owner),old=siteBelief(site);site.belief=clamp(old+(needs.healthy?.45+(shrines.includes(site)?Math.min(4,terraceScore(site))*.06:0):-.7)*dt,10,100);if(site.owner===0&&old<70&&site.belief>=70)log('A thriving settlement strengthens belief at a nearby worship site.')}
 for(let owner=0;owner<2;owner++){let rate=income(owner),previous=devotion[owner];faith[owner]=clamp(faith[owner]+rate*dt,0,160);devotion[owner]+=devotionRate(owner)*dt;if(owner===0&&Math.floor(previous/100)<Math.floor(devotion[owner]/100))log(`${Math.floor(devotion[owner])} devotion. Your villages and sacred sites are flourishing.`)}
 for(let site of shrines){updateStoneSpirit(site,dt);let nearby=site.owner===0&&people.some(p=>p.type==='shaman'&&p.owner===1&&dist(p,site)<7);if(nearby&&!site.warned){site.warned=true;log('Ember shaman approaching your stone. Guard it or bring your shaman.')}if(!nearby)site.warned=false}
 for(let p of [...people]){
  if(p.type==='wild'){let home=nearest(buildings.filter(b=>b.type==='hut'&&b.progress===1),p);if(home&&dist(p,home)<1.8&&people.filter(q=>q.owner===home.owner).length<housingCapacity(home.owner)){p.owner=home.owner;p.type='brave';p.goal=null;p.intent=null;p.job='JOINING SETTLEMENT';if(home.owner===0)log('A wildman settled among your people after reaching the village.');continue}p.job='ROAMING';p.idle-=dt;if(p.idle<=0&&!p.goal){let x=clamp(Math.round(p.x+(rand(Math.floor(elapsed),people.indexOf(p))-.5)*4),1,W-2),z=clamp(Math.round(p.z+(rand(people.indexOf(p),Math.floor(elapsed))-.5)*4),1,H-2);if(validLand(x,z))p.goal={x,z};p.idle=3+rand(x,z)*3}if(p.goal)move(p,p.goal,dt,.45);continue}
  let own=p.owner;if(p.role==='worshipper'){if(!validWorshipSite(p.worshipSite,own)){p.role='worker';p.worshipSite=null;p.goal=null;p.job='RETURNING TO WORK'}else{if(p.goal)move(p,p.goal,dt,1.15);p.job=p.goal?'GOING TO WORSHIP':'WORSHIPPING';continue}}
  if(p.role==='keeper'){if(!p.guardSite||p.guardSite.owner!==own){p.role='worker';p.guardSite=null;p.goal=null;p.intent=null;p.intentUntil=0}else{if(dist(p,p.guardSite)>1.35){if(!p.goal)p.goal=approachSite(p,p.guardSite);move(p,p.goal,dt,1.15)}else p.goal=null;p.job='GUARDING STONE';continue}}
  if(p.type==='brave'&&p.role==='worker'&&p.job.startsWith('SUPPORTING')&&p.goal&&elapsed>=p.intentUntil)p.goal=null;
  if(p.type==='brave'&&p.tendSite){if(p.tendSite.owner!==own||siteBelief(p.tendSite)>=90){p.tendSite=null;p.intent=null;p.goal=null;p.work=0}else{p.job='TENDING SHRINE';if(dist(p,p.tendSite)>1.35){if(!p.goal)p.goal={x:p.tendSite.x+(p.x>p.tendSite.x?.8:-.8),z:p.tendSite.z};move(p,p.goal,dt,1.15)}else{p.goal=null;p.work+=dt;if(p.work>=3){p.tendSite.belief=clamp(siteBelief(p.tendSite)+4,10,100);p.tendSite=null;p.intent=null;p.tendCooldown=elapsed+22;p.work=0}}continue}}
  if(p.goal){move(p,p.goal,dt,p.type==='shaman'?1.5:1.3);continue}
  if(p.ambientReturn&&!p.goal)finishAmbientTrip(p);
  if(p.type==='shaman'){if(own===1){if(p.environmentGoal){let g=p.environmentGoal,cost=environmentFeatureCost(g.kind);if(faith[1]<cost||!environmentFeatureAllowed(g.kind,g.x,g.z)){p.environmentGoal=null}else if(dist(p,g)>5.5){p.job=g.kind==='grove'?'SEEKING GROVE SITE':'SEEKING MINERAL SITE';p.goal={x:g.x,z:g.z};continue}else{placeEnvironmentFeature(g.kind,g.x,g.z,1);p.environmentGoal=null;p.goal=null;continue}}
    let sacred=shrines.filter(s=>s.owner===1),rough=nearest(sacred.filter(s=>!regionalVows[1].has(faithRegion(s))&&terraceScore(s)<STONE_RITE_TERRACE),p),aggressive=aiStyle==='stones'||regionalVows[1].size<REGIONS.length||devotion[0]>devotion[1]+180,target=aggressive&&elapsed>=enemyPilgrimAt?nearest(shrines.filter(s=>s.owner===0&&s.lock<=0||s.owner===2&&s.projectOwner!==1),p):null;if(rough&&faith[1]>=4){p.job='SHAPING SACRED TERRACE';if(dist(p,rough)>4.5)p.goal={x:rough.x,z:rough.z};else if(elapsed>=(p.nextStoneEdit||0)){let edit=bestTerraceBrush(rough);if(edit&&terrainBrush(edit.x,edit.z,edit.dir,true,1).changed){faith[1]-=4;p.nextStoneEdit=elapsed+2;renderObjects();log('Ember levelled a sacred terrace.')}}}else if(target){p.job='PILGRIMAGE';if(dist(p,target)>(target.owner===2&&target.projectOwner===2?2.4:1.2))p.goal={x:target.x,z:target.z};else if(target.owner===2&&target.projectOwner===2){let plot=stoneCandidate(target);if(plot&&faith[1]>=STONE_COST)startStoneProject(target,plot.x,plot.z,1);else if(!plot&&faith[1]>=4&&elapsed>=(p.nextStoneEdit||0)){let edit=stonePreparation(target);if(edit&&terrainBrush(edit.x,edit.z,edit.dir,true,1).changed){faith[1]-=4;p.nextStoneEdit=elapsed+2;renderObjects();log('Ember shaped sacred ground for a stone circle.')}}}}else if(aiStyle==='villages'&&sacred.length){let home=nearest(sacred,p);p.job='GUARDING SACRED GROUND';if(dist(p,home)>1.25)p.goal={x:home.x,z:home.z}}else p.job='WATCHING THE LAND'}continue}
  if(p.carry&&!buildings.some(b=>activeProject(b,own))){p.carry=0;renderObjects()}
  let keep=p.intent&&elapsed<p.intentUntil&&validWorkerIntent(p.intent,own),intent=keep?p.intent:chooseWorkerIntent(p);
  p.intent=intent;if(!keep)p.intentUntil=elapsed+3;p.workSite=intent?.kind==='build'?intent.site:null;p.supportSite=intent?.kind==='support'?intent.site:null;
  if(intent?.kind==='tend'){p.tendSite=intent.site;p.work=0;p.job='TENDING SHRINE';continue}
  if(['hunt','mine','explore'].includes(intent?.kind)){let target=intent.site,label=intent.kind==='hunt'?'HUNTING':intent.kind==='mine'?'MINING':'EXPLORING';p.job=label;
   if(dist(p,target)>.65){p.goal=target;continue}
   p.goal=null;p.work+=dt;let duration=intent.kind==='explore'?2:2.8;if(p.work>=duration){p.work=0;p.intent=null;p.intentUntil=0;let home=nearest(buildings.filter(b=>b.owner===own&&b.type==='hut'&&b.progress===1),p)||nearest(buildings.filter(b=>b.owner===own&&b.progress===1),p);
    p.ambientReturn=intent.kind;p.ambientHome=home;
    if(intent.kind==='hunt'){p.ambientCarry='game';p.job='RETURNING WITH GAME'}else if(intent.kind==='mine'){let ore=at(Math.round(target.x),Math.round(target.z));if(ore?.mineral){ore.mineral--;ore.geology=Math.max(0,(ore.geology||0)-1);if(!ore.mineral)renderObjects()}p.ambientCarry='stone';p.job='HAULING STONE'}else p.job='RETURNING FROM SCOUTING';
    if(home)p.goal=approachSite(p,home);else finishAmbientTrip(p);p.idle=2+rand(Math.floor(elapsed),people.indexOf(p),seed+151)*3
   }continue}
  let site=intent?.kind==='build'?intent.site:null;
  if(site){if(shrines.includes(site)){let centre={x:site.buildX+.5,z:site.buildZ+.5};p.job='BUILDING STONE CIRCLE';if(dist(p,centre)>1.05){p.goal=approachSite(p,centre);continue}let rival=people.some(q=>q.type==='shaman'&&q.owner===1-own&&dist(q,site)<1.55),before=Math.floor(site.progress*5);site.progress=clamp(site.progress+dt*(rival?.03:.06),0,1);if(site.progress>=1)consecrateStone(site,own);else if(Math.floor(site.progress*5)!==before)renderObjects();continue}
   if(p.carry){p.job='HAULING WOOD';if(dist(p,site)>1){p.goal={x:site.x+(p.x>site.x?.7:-.7),z:site.z};continue}site.wood=Math.min(3,site.wood+1);p.carry=0;renderObjects();if(site.wood===3&&own===0)log('Wood delivered. Braves are building the hut.');continue}
   if(site.wood<3){p.job='GATHERING WOOD';let trees=[];for(let z=Math.max(1,site.z-9);z<=Math.min(H-2,site.z+9);z++)for(let x=Math.max(1,site.x-9);x<=Math.min(W-2,site.x+9);x++)if(at(x,z)?.tree&&dist({x,z},site)<=9)trees.push({x,z});let tree=nearest(trees,p);if(tree){if(dist(p,tree)>.6)p.goal=tree;else{p.work+=dt;if(p.work>.75){p.work=0;let timberTile=at(tree.x,tree.z);timberTile.wood=Math.max(0,(timberTile.wood||1)-1);if(!timberTile.wood){timberTile.tree=false;timberTile.regrowAt=elapsed+70+rand(tree.x,tree.z,seed+451)*40}p.carry=1;renderObjects()}}continue}}
   if(site.wood>=3){p.job='BUILDING HUT';if(dist(p,site)>1){p.goal={x:site.x+(p.x>site.x?.7:-.7),z:site.z};continue}site.progress=clamp(site.progress+dt*.16,0,1);if(site.progress===1){site.completedAt=elapsed;site.lastGrowthAt=elapsed;site.blessed=true;site.belief=35;log(`${own?'Ember':'Your'} hut completed and begins contributing to the settlement.`);renderObjects()}continue}}
  if(intent?.kind==='support'){let home=intent.site;p.job=shrines.includes(home)?'SUPPORTING STONE':'SUPPORTING VILLAGE';if(dist(p,home)>1.5){p.goal=approachSite(p,home);continue}p.idle-=dt;if(p.idle<=0){let a=people.indexOf(p)*2.4+Math.floor(elapsed/5)*1.3,x=home.x+Math.cos(a)*.8,z=home.z+Math.sin(a)*.8;if(validLand(Math.round(x),Math.round(z)))p.goal={x,z};p.idle=4+rand(Math.floor(elapsed),people.indexOf(p))*3}continue}
  p.job='WAITING FOR WORK'
 }
 for(let b of buildings){if(b.progress<1)continue;if(b.completedAt===null){b.completedAt=elapsed;b.lastGrowthAt=elapsed}let staffing=villageStaffing(b.owner),provisions=b.type==='hut'?(b.provisions||0):0;b.pop=staffing;if(staffing>=.5)b.spawn=Math.min(1,b.spawn+dt*(b.type==='hut'?.105:.025)*(1+Math.min(staffing,3)*.23)*(1+Math.min(provisions,4)*.16));if(b.spawn>=1){b.spawn=0;b.born++;if(b.type==='hut'&&b.provisions)b.provisions--;if(people.filter(p=>p.owner===b.owner).length<housingCapacity(b.owner)){addPerson(b.owner,b.x+.35,b.z+.35,'brave');if(b.owner===0)log('A new brave joins your village. Hunting provisions and available housing help families grow.')}}let tier=hutLevel(b),previous=b.level;if(tier>previous&&growBuilding(b,tier)){renderObjects();if(b.owner===0)log(`Your ${BUILDING_TIERS[tier].name.toLowerCase()} has grown on level ground! +${BUILDING_TIERS[tier].rooms-BUILDING_TIERS[previous].rooms} housing.`);else log(`Ember grew a ${BUILDING_TIERS[tier].name.toLowerCase()}.`)}}
 if(forestClock>=15){forestClock=0;updateWoodland()}
 if(settlementClock>=4){settlementClock=0;for(let owner=0;owner<2;owner++){planSettlement(owner);syncSitePolicies(owner)}}
 if(riteClock>=4){riteClock=0;let elder=people.find(p=>p.owner===1&&p.type==='shaman'),rough=shrines.find(s=>s.owner===1&&!regionalVows[1].has(faithRegion(s))&&terraceScore(s)<STONE_RITE_TERRACE&&dist(elder,s)<5),edit=rough&&bestTerraceBrush(rough);if(edit&&faith[1]>=4&&dist(elder,edit)<5.5&&terrainBrush(edit.x,edit.z,edit.dir,true,1).changed){faith[1]-=4;renderObjects();log('Ember shaped a sacred terrace for a regional festival.')}for(let owner=0;owner<2;owner++){let ready=[...shrines,...buildings].find(s=>faithRegion(s)&&!regionalVows[owner].has(faithRegion(s))&&festivalReady(s,owner));if(ready&&faith[owner]>=FESTIVAL_COST)festival(ready,owner)}}
 if(aiClock>(aiStyle==='villages'?26:38)){aiClock=0;let elder=people.find(p=>p.owner===1&&p.type==='shaman'),ecology=!elder?.environmentGoal&&aiEnvironmentChoice(1);if(ecology){elder.environmentGoal=ecology;elder.goal={x:ecology.x,z:ecology.z};log(ecology.kind==='grove'?'Ember is seeking low ground for new woodland.':'Ember is seeking high ground for a mineral seam.')}else if(aiStyle==='villages'&&faith[1]>=4&&buildings.filter(b=>b.owner===1&&b.type==='hut').length>=3&&people.filter(p=>p.owner===1).length>=housingCapacity(1)-5){let move=null;for(let z=Math.max(2,Math.floor(elder.z)-5);z<=Math.min(H-3,Math.ceil(elder.z)+5)&&!move;z++)for(let x=Math.max(2,Math.floor(elder.x)-5);x<=Math.min(W-3,Math.ceil(elder.x)+5)&&!move;x++)if(dist(elder,{x,z})<=5.5)for(let dir of [-1,1]){if(terrainBrush(x,z,dir,false,1).newPlot){move={x,z,dir};break}}if(move){terrainBrush(move.x,move.z,move.dir,true,1);faith[1]-=4;renderObjects();log('Ember shaped a building plot and sent settlers to it.')}}syncSitePolicies(1)}
 if(victoryReady(0)||victoryReady(1))finish(victoryReady(0)&&(!victoryReady(1)||devotion[0]>=devotion[1]));updateUI()
}

function ping(x,z,material){let p=pos(x,z),marker=mesh(ringGeo,material,fxGroup,p.x,p.y+.08,p.z,.3,.3,.3);marker.rotation.x=Math.PI/2;marker.castShadow=false;fx.push({marker,born:performance.now()})}
function finish(win){if(ended)return;ended=win?'victory':'defeat';running=false;$('#result').hidden=false;$('#result').innerHTML=`<h2>${win?'YOUR FAITH FLOURISHES':'EMBER REACHES THE PEOPLE FIRST'}</h2><p>${Math.floor(devotion[0])} to ${Math.floor(devotion[1])} devotion · ${regionalVows[0].size} to ${regionalVows[1].size} regional festivals. ${win?'Your villages and stones carried faith across the whole world.':'Establish sites in the north, crossing and south, then hold a festival in each region.'}</p><button id="again">PLAY AGAIN</button>`;$('#again').onclick=()=>{makeWorld();openGuide(true)}}
const commands=[['move','MOVE SHAMAN','Free'],['stone','BUILD STONE','20 faith'],['inspect','INSPECT','Read the world']];const spells=[['grove','PLANT GROVE','12 faith'],['mineral','EXPOSE MINERALS','16 faith'],['raise','RAISE LAND','4 faith'],['lower','LOWER LAND','4 faith'],['bridge','LAND BRIDGE','30 faith']];
function setupButtons(){for(let [el,items] of [['#commands',commands],['#spells',spells]])$(el).innerHTML=items.map(([id,label,cost])=>`<button data-mode="${id}">${label}<small>${cost}</small></button>`).join('');document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;if(mode!=='inspect')selectedSite=null;$('#landPreview').hidden=true;clear(hoverGroup);updateUI()})}
const spellCosts={grove:GROVE_COST,mineral:MINERAL_COST,raise:4,lower:4,bridge:30};const hints={move:'Move your shaman through the world. Followers react to the landscape you create.',stone:'Prepare a flat 2×2 plot containing a sacred rune. Bring your shaman within three tiles, then build the stone circle.',inspect:'Inspect homes, followers, resources and sacred sites to understand how the world is responding.',grove:'Plant a small grove across nearby clear height 1–3 tiles. Trees hold finite timber, attract hunters and slowly recover when woodland survives.',mineral:'Reveal a seam only where height 4–5 ground shows mineral-bearing rock. Rich geology produces larger deposits and attracts more miners.',raise:'Raise one tile for 4 faith. Level land creates room for settlements and sacred terraces.',lower:'Lower one tile for 4 faith. Cut routes, create water, or level useful ground.',bridge:'Turn water into low land to create a route across rivers and lakes.'};
function action(x,z){$('#landPreview').hidden=true;clear(hoverGroup);let t=at(x,z);if(!t||ended)return;let point={x,z},range=dist(shaman,point),site=nearest(shrines,point);
 if(mode==='inspect'){let sacred=shrines.find(s=>Math.max(Math.abs(s.x-x),Math.abs(s.z-z))===1);if(sacred&&sacred.owner===0){selectedSite=sacred;updateSitePanel();toast(`Terrace ${terraceScore(sacred)}/8 level · tile height ${t.h}, circle height ${height(sacred.x,sacred.z)}. Four tiles maximise income; seven prepare a regional festival.`);return}let occupied=t.building,nearHome=nearest(buildings.filter(b=>b.owner===0&&b.type==='hut'),point),focus=site&&dist(site,point)<1.5&&site.owner!==1&&site.projectOwner!==1?site:occupied?.owner===0&&occupied.type==='hut'?occupied:nearHome&&dist(nearHome,point)<.9?nearHome:null;if(focus){selectedSite=focus;updateSitePanel();toast(focus.owner===2?focus.projectOwner===0?`Your stone circle is ${Math.floor(focus.progress*100)}% built.`:'Prepare a level 2×2 plot and build a stone circle here.':focus.progress<1?`${BUILDING_TIERS[focus.level].name} is ${Math.floor(focus.progress*100)}% built.`:`${BUILDING_TIERS[focus.level].name} inspected. Its growth follows the surrounding land, resources and available workforce.`);return}if(site&&dist(site,point)<1.5)toast(`Sacred site · ${site.owner===2?site.projectOwner===1?'Ember building':'empty':site.owner===0?'yours':'Ember'}${site.owner<2?' · spirit '+Math.ceil(site.spirit)+'/100':''}`);else{let person=nearest(people,point),building=occupied||nearest(buildings,point);if(person&&dist(person,point)<.7)toast(`${person.owner===2?'Wildman':person.owner?'Ember':'Verdant'} ${person.type} · ${person.job||'IDLE'}`);else if(building&&(building===occupied||dist(building,point)<.9))toast(`${building.owner?'Ember':'Your'} ${building.type==='hut'?BUILDING_TIERS[building.level].name.toLowerCase():building.type} · ${building.blessed?'belief '+Math.round(siteBelief(building))+'% '+(siteNeeds(building,building.owner).healthy?'↑':'↓ workforce stretched')+' · ':''}${Math.round(building.progress*100)}% built${building.type==='hut'&&building.level<4?` · ${growthDetails(building)}`:''}`);else toast(`${t.feature==='river'?'River':t.feature==='lake'?'Lake':t.h===5?'Mountain':t.h>=3?'Hill':'Land'} · height ${t.h} · ${t.tree?'trees':t.mineral?`exposed mineral seam ${t.mineral} remaining`:t.h>=4&&t.geology?`${t.geology>=4?'rich ':' '}mineral-bearing rock`:t.h>=4?'barren high ground':'clear'}`)}return}
 if(mode==='move'){if(!t.h)return toast('Your shaman cannot cross water.');shaman.goal=point;ping(x,z,gem[0]);toast('Shaman moving toward the marker.');return}
 if(mode==='stone'){let sacred=stoneSiteForPlot(x,z);if(!sacred)return toast('Build a stone circle on a 2×2 plot containing a sacred rune.');if(sacred.owner!==2||sacred.projectOwner!==2)return toast(sacred.owner===2?'Followers are already building a circle here.':'A circle already stands here. Contest its spirit with your shaman.');if(!canBuildStone(sacred,x,z))return toast('Shape these four tiles to one level, clear height. Hover to preview a valid 2×2 foundation.');if(dist(shaman,sacred)>3)return toast('Move your shaman within three tiles of this sacred site first.');if(faith[0]<STONE_COST)return toast(`Need ${STONE_COST} faith to begin the circle.`);startStoneProject(sacred,x,z,0);updateUI();return}

 let cost=spellCosts[mode];if(faith[0]<cost)return toast(`Need ${cost} faith. Followers and sacred stones generate it.`);if(range>5.5)return toast('Out of range. Move the shaman closer first.');
 if(mode==='grove'){if(!environmentFeatureAllowed('grove',x,z))return toast('Groves need clear low or mid land (height 1–3), away from sacred foundations.');if(!placeEnvironmentFeature('grove',x,z,0))return toast('Move your shaman closer or save enough Faith.')}
 else if(mode==='mineral'){if(t.h<4)return toast('Raise this ground to height 4 or 5 before prospecting for a seam.');if(!t.geology)return toast('This high ground is barren: there is no mineral-bearing rock beneath it.');if(!environmentFeatureAllowed('mineral',x,z))return toast(t.mineral?'This mineral seam is already exposed.':'Clear this mineral-bearing high ground before exposing the seam.');if(!placeEnvironmentFeature('mineral',x,z,0))return toast('Move your shaman closer or save enough Faith.')}
 else if(mode==='raise'||mode==='lower'){let result=terrainBrush(x,z,mode==='raise'?1:-1,true);if(!result.changed)return toast('This tile cannot be shaped in that direction.');faith[0]-=cost;renderObjects();log(result.newStonePad?'Sacred ground is level. Choose Build Stone, then click the highlighted 2×2 foundation.':result.upgrade?`Your home grew into a ${BUILDING_TIERS[result.upgrade.level].name.toLowerCase()}! More housing, faith and devotion.`:result.newPlot?'A new level building plot opens. Settlers are on their way.':result.terrace?'Sacred terrace improved. Faith and site devotion rise.':`One tile ${mode==='raise'?'raised':'lowered'}. Level land around a hut or shape a 2×2 plot.`)}
 else if(mode==='bridge'){let changed=0;for(let p of bridgeTiles(x,z)){let tile=at(p.x,p.z);tile.h=1;tile.feature=null;tile.sculptedBy=0;changed++;refreshTerrainAt(p.x,p.z)}if(!changed)return toast('Cast across water to create a crossing.');faith[0]-=cost;settlementClock=4;renderObjects();log('Land bridge opens a path for followers and future settlements.')}
 updateUI()
}
function updateUI(){
 let playerRate=income(0),enemyRate=income(1),playerDevotion=devotionRate(0),enemyDevotion=devotionRate(1),population=people.filter(p=>p.owner===0).length;
 $('#population').textContent=population+'/'+housingCapacity(0);$('#enemy').textContent=people.filter(p=>p.owner===1).length;
 $('#faith').textContent=Math.floor(faith[0])+'/160';$('#devotion').textContent=Math.floor(devotion[0])+'/'+DEVOTION_GOAL;
 $('#tribe').innerHTML=`${buildings.filter(b=>b.owner===0&&b.progress===1).length} buildings · ${buildings.filter(b=>b.owner===0&&b.type==='hut'&&b.level===3).length} forts · ${buildings.filter(b=>b.owner===0&&b.type==='hut'&&b.level===4).length} castles<br>${people.filter(p=>p.owner===0&&p.type==='brave'&&p.role==='worker').length} workers · ${people.filter(p=>p.owner===0&&p.role==='worshipper').length} worshippers · ${people.filter(p=>p.owner===0&&p.intent?.kind==='hunt').length} hunting · ${people.filter(p=>p.owner===0&&p.intent?.kind==='mine').length} mining · ${people.filter(p=>p.owner===0&&p.intent?.kind==='explore').length} scouting · ${shrines.filter(s=>s.owner===0).length}/${shrines.length} stone circles · ${shrines.filter(s=>s.projectOwner===0).length} building<br>Housing ${population}/${housingCapacity(0)} · Level land, household growth and time grow homes. Hunting speeds population growth; mining helps forts and castles mature.`;
 $('#status').textContent=`${running?'World running':'Paused'} · ${speed}× · ${Math.floor(elapsed)}s · Faith +${playerRate.toFixed(1)}/s · Devotion +${playerDevotion.toFixed(1)}/s · regions ${regionalVows[0].size}/3`;
 $('#objective').innerHTML=`<b>DEVOTION ${Math.floor(devotion[0])} / ${DEVOTION_GOAL} · EMBER ${Math.floor(devotion[1])} / ${DEVOTION_GOAL}</b><span>Regional festivals: ${REGIONS.map(r=>`<em class="${regionalVows[0].has(r)?'verdant':''}">${r} ${regionalVows[0].has(r)?'✓':'○'}</em>`).join(' · ')} · Ember ${regionalVows[1].size}/3</span><span>Your sites +${playerDevotion.toFixed(1)}/s · Ember +${enemyDevotion.toFixed(1)}/s · Stones <em class="verdant">${shrines.filter(s=>s.owner===0).length}</em> : <em class="ember">${shrines.filter(s=>s.owner===1).length}</em></span><div class="devotion-race"><div class="track"><i style="width:${Math.min(100,devotion[0]/DEVOTION_GOAL*100)}%"></i></div><div class="track ember"><i style="width:${Math.min(100,devotion[1]/DEVOTION_GOAL*100)}%"></i></div></div>`;
 $('#hint').textContent=hints[mode];updateSitePanel();drawMinimap();document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode))})
}
function drawMinimap(force=false){
 let canvas=$('#minimap');if(typeof canvas?.getContext!=='function'||!tiles.length)return;
 let now=performance.now();if(!force&&now-lastMini<250)return;lastMini=now;
 let ctx=canvas.getContext('2d'),palette=['#31596b','#8b795a','#76965f','#68a16c','#8a9c71','#cbc7bd'];
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){let tile=at(x,z);ctx.fillStyle=palette[tile.h];ctx.fillRect(x*3,z*3,3,3);if(tile.tree){ctx.fillStyle='#284f3e';ctx.fillRect(x*3+1,z*3+1,2,2)}else if(tile.mineral){ctx.fillStyle='#d7e0e4';ctx.fillRect(x*3+1,z*3+1,2,2)}}
 for(let b of buildings){ctx.fillStyle=b.owner===0?'#a5efd3':'#ffad8a';ctx.fillRect(b.x*3-1,b.z*3-1,5,5)}
 for(let site of shrines){ctx.fillStyle=site.owner===0?'#8fffe1':site.owner===1?'#ffac83':site.projectOwner===0?'#6ccbb4':site.projectOwner===1?'#d48168':'#f3d487';ctx.beginPath();ctx.arc(site.x*3+1.5,site.z*3+1.5,4.5,0,Math.PI*2);ctx.fill()}
 for(let p of people.filter(p=>p.type==='shaman')){ctx.strokeStyle=p.owner===0?'#e7fff2':'#ffdbc8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x*3+1.5,p.z*3+1.5,3.5,0,Math.PI*2);ctx.stroke()}
 let x=(target.x+W/2)*3,z=(target.z+H/2)*3;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.strokeRect(x-(camera.right-camera.left)*1.5,z-(camera.top-camera.bottom)*1.5,(camera.right-camera.left)*3,(camera.top-camera.bottom)*3)
}
function cameraTarget(x,z){target.set(x-W/2,0,z-H/2);updateCamera()}
function updateCamera(){target.x=clamp(target.x,-W/2+4,W/2-4);target.z=clamp(target.z,-H/2+4,H/2-4);let size=15/zoom,aspect=Math.max(.5,stage.clientWidth/stage.clientHeight);camera.left=-size*aspect;camera.right=size*aspect;camera.top=size;camera.bottom=-size;camera.position.set(target.x+Math.sin(angle)*size*1.4,size*1.1,target.z+Math.cos(angle)*size*1.4);camera.lookAt(target);camera.updateProjectionMatrix();sun.position.set(target.x-13,23,target.z+8);sun.target.position.set(target.x,0,target.z);sun.target.updateMatrixWorld();drawMinimap()}
function panCamera(dx,dy){let scale=30/zoom/Math.max(stage.clientHeight,1);target.x+=(-dx*Math.cos(angle)-dy*Math.sin(angle))*scale;target.z+=(dx*Math.sin(angle)-dy*Math.cos(angle))*scale;updateCamera()}
function pick(e){let r=renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(m,camera);
 if(mode==='inspect'){let hit=ray.intersectObjects(objects.children.filter(o=>o.userData.inspectBuilding),false)[0],building=hit?.object?.userData.inspectBuilding;if(building)return {x:building.x,z:building.z,building}}
 let hits=ray.intersectObjects([...terrain.children,water]);if(!hits.length)return null;let v=hits[0].point,x=Math.floor(v.x+W/2),z=Math.floor(v.z+H/2);return x>=0&&z>=0&&x<W&&z<H?{x,z}:null}
let previewAt=0;
function hoverTileOutline(x,z,material=hoverLineMat,lift=.08){
 let inset=.045,points=[
  [x+inset,z+inset],[x+.5,z+inset],[x+1-inset,z+inset],[x+1-inset,z+.5],
  [x+1-inset,z+1-inset],[x+.5,z+1-inset],[x+inset,z+1-inset],[x+inset,z+.5]
 ].map(([px,pz])=>new THREE.Vector3(px-W/2,surfaceHeight(px,pz)*.48+lift,pz-H/2));
 let geo=new THREE.BufferGeometry().setFromPoints(points),line=new THREE.LineLoop(geo,material);line.renderOrder=20;hoverGroup.add(line);return line
}
function hoverFootprint(tiles){
 for(let tile of tiles)hoverTileOutline(tile.x,tile.z,hoverResultMat,.095)
}
function landPreview(e){let preview=$('#landPreview');if(drag||selectedSite||!['raise','lower','stone','grove','mineral'].includes(mode)){preview.hidden=true;clear(hoverGroup);return}if(performance.now()-previewAt<80)return;previewAt=performance.now();let point=pick(e);clear(hoverGroup);if(!point){preview.hidden=true;return}
 let {x,z}=point,shape=['raise','lower'].includes(mode),plan=shape?terrainBrush(x,z,mode==='raise'?1:-1):null,sacred=mode==='stone'?stoneSiteForPlot(x,z):null,plot=mode==='stone'&&canBuildStone(sacred,x,z)?{x,z}:plan?.newStonePad||plan?.newPlot;
 hoverTileOutline(x,z);
 let highlighted=plot?[{x:plot.x,z:plot.z},{x:plot.x+1,z:plot.z},{x:plot.x,z:plot.z+1},{x:plot.x+1,z:plot.z+1}]:plan?.upgrade?.footprint||[];
 if(highlighted.length)hoverFootprint(highlighted);
 if(plan?.terrace&&plan.changed){let terraceTiles=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(dx||dz)terraceTiles.push({x:plan.terrace.x+dx,z:plan.terrace.z+dz});hoverFootprint(terraceTiles)}
 preview.hidden=false;if(mode==='stone'){preview.textContent=!sacred?'Click the top-left tile of a 2×2 foundation containing a sacred rune.':sacred.owner!==2||sacred.projectOwner!==2?'A stone circle is already planned or built at this site.':!plot?'Shape these four tiles to the same level before building.':dist(shaman,sacred)>3?'Move your shaman within three tiles of this foundation.':faith[0]<STONE_COST?'Need 20 faith to begin the stone circle.':'Build stone circle · 20 faith · nearby followers finish it.';return}if(mode!=='stone'&&dist(shaman,point)>5.5){preview.textContent='Move your shaman closer to shape this tile.';return}if(['raise','lower'].includes(mode)&&faith[0]<4){preview.textContent='Need 4 faith to shape land.';return}preview.textContent=mode==='grove'?(groveAllowed(at(x,z))?'PLANT GROVE · height 1–3 woodland attracts hunters and supplies timber.':'BLOCKED · groves need clear height 1–3 land.'):mode==='mineral'?(at(x,z).mineral?`EXPOSED SEAM · ${at(x,z).mineral} mineral remaining`:at(x,z).h<4?'BLOCKED · raise this tile to height 4–5 to access geology.':!at(x,z).geology?'BARREN HIGH GROUND · no mineral-bearing rock here.':mineralAllowed(at(x,z))?`${at(x,z).geology>=4?'RICH ':' '}MINERAL-BEARING ROCK · expose ${at(x,z).geology} mineral for 16 faith`:'MINERAL-BEARING ROCK · clear the tile before exposing it.'):!plan.changed?`BLOCKED · height ${at(x,z).h} cannot ${mode==='raise'?'rise':'fall'} here.`:plan.newStonePad?`H${at(x,z).h} → H${at(x,z).h+(mode==='raise'?1:-1)} · COMPLETES STONE FOUNDATION`:plan.upgrade?`H${at(x,z).h} → H${at(x,z).h+(mode==='raise'?1:-1)} · GROWS ${BUILDING_TIERS[plan.upgrade.level].name.toUpperCase()} · +${BUILDING_TIERS[plan.upgrade.level].rooms-BUILDING_TIERS[plan.upgrade.hut.level].rooms} housing`:plan.newPlot?`H${at(x,z).h} → H${at(x,z).h+(mode==='raise'?1:-1)} · OPENS 2×2 HUT PLOT`:plan.terrace?`H${at(x,z).h} → H${at(x,z).h+(mode==='raise'?1:-1)} · TERRACE ${Math.min(8,terraceScore(plan.terrace)+1)}/8`:`H${at(x,z).h} → H${at(x,z).h+(mode==='raise'?1:-1)} · sculpt this tile`
}
stage.addEventListener('pointermove',landPreview);stage.addEventListener('pointerleave',()=>{$('#landPreview').hidden=true;clear(hoverGroup)});
stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:false,button:e.button}});stage.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;if(drag.moved){if(drag.button===2){angle+=dx*.007;updateCamera()}else panCamera(dx,dy)}drag.x=e.clientX;drag.y=e.clientY});stage.addEventListener('pointerup',e=>{if(!drag)return;let moved=drag.moved;drag=null;if(!moved){let p=pick(e);if(p)action(p.x,p.z)}});stage.addEventListener('contextmenu',e=>e.preventDefault());stage.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*(e.deltaY<0?1.12:.89),.55,2.2);updateCamera()},{passive:false});
$('#minimap').addEventListener('pointerdown',e=>{let rect=e.currentTarget.getBoundingClientRect(),x=clamp((e.clientX-rect.left)/rect.width*W,0,W-1),z=clamp((e.clientY-rect.top)/rect.height*H,0,H-1);cameraTarget(x,z);drawMinimap(true)});
$('#minimap').addEventListener('keydown',e=>{let delta={ArrowLeft:[-6,0],ArrowRight:[6,0],ArrowUp:[0,-6],ArrowDown:[0,6]}[e.key];if(!delta)return;e.preventDefault();cameraTarget(target.x+W/2+delta[0],target.z+H/2+delta[1]);drawMinimap(true)});
$('#sitePanel').onclick=e=>{let button=e.target.closest('button'),site=selectedSite;if(!button||button.disabled||!site)return;
 if(button.dataset.siteAction==='close'){selectedSite=null;updateSitePanel();return}
 if(button.dataset.siteAction==='build'){mode='stone';selectedSite=null;cameraTarget(site.x,site.z);toast(stoneCandidate(site)?'Hover the four possible 2×2 foundations. Click a highlighted one to build.':'Shape a level 2×2 foundation around this rune, then choose Build Stone.');updateUI()}
};
function selectGuideTab(id,focus=false){for(let button of document.querySelectorAll('[data-guide-tab]')){let active=button.dataset.guideTab===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;$('#panel-'+button.dataset.guideTab).hidden=!active;if(active&&focus)button.focus()}}
let guideOpening=false,guideWasRunning=true;
function captureWorldArt(){if(!stage.clientWidth||!stage.clientHeight)return;renderer.setSize(stage.clientWidth,stage.clientHeight);let old={x:target.x,z:target.z};cameraTarget(16,21);renderUnits(performance.now());renderer.render(scene,camera);try{$('#introArt').style.setProperty('--world-art',`url("${renderer.domElement.toDataURL('image/jpeg',.83)}")`)}catch(e){/* The colour illustration remains when canvas capture is unavailable. */}cameraTarget(old.x+W/2,old.z+H/2)}
function openGuide(opening=false){let dialog=$('#instructions');if(dialog.open)return;guideOpening=opening;guideWasRunning=running;running=false;$('#closeHelp').innerHTML=opening?'PLAY THE WORLD <span aria-hidden="true">→</span>':'RETURN TO GAME <span aria-hidden="true">→</span>';selectGuideTab('overview');if(opening)captureWorldArt();updateUI();dialog.showModal()}
$('#instructions').addEventListener('cancel',e=>{if(guideOpening)e.preventDefault()});$('#instructions').addEventListener('close',()=>{running=guideWasRunning;$('#pause').textContent=running?'PAUSE':'RESUME';updateUI()});
$('.intro-tabs').addEventListener('click',e=>{let button=e.target.closest('[data-guide-tab]');if(button)selectGuideTab(button.dataset.guideTab)});
$('.intro-tabs').addEventListener('keydown',e=>{let tabs=[...document.querySelectorAll('[data-guide-tab]')],index=tabs.findIndex(button=>button.getAttribute('aria-selected')==='true'),next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;if(next<0)return;e.preventDefault();selectGuideTab(tabs[next].dataset.guideTab,true)});
$('#home').onclick=()=>cameraTarget(shaman.x,shaman.z);$('#rotateL').onclick=()=>{angle-=Math.PI/6;updateCamera()};$('#rotateR').onclick=()=>{angle+=Math.PI/6;updateCamera()};$('#zoomIn').onclick=()=>{zoom=clamp(zoom*1.2,.55,2.2);updateCamera()};$('#zoomOut').onclick=()=>{zoom=clamp(zoom/1.2,.55,2.2);updateCamera()};$('#pause').onclick=()=>{running=!running;$('#pause').textContent=running?'PAUSE':'RESUME';updateUI()};$('#speed').onclick=()=>{speed=speed===1?2:speed===2?3:1;$('#speed').textContent=speed+'× SPEED';updateUI()};$('#restart').onclick=()=>{makeWorld();openGuide(true)};$('#help').onclick=()=>openGuide();$('#closeHelp').onclick=()=>$('#instructions').close();
new ResizeObserver(()=>{let w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h);updateCamera()}).observe(stage);setupButtons();makeWorld();openGuide(true);let last=performance.now(),acc=0;function frame(now){requestAnimationFrame(frame);for(let f of [...fx]){let age=(now-f.born)/1600;if(age>=1){fxGroup.remove(f.marker);fx.splice(fx.indexOf(f),1)}else f.marker.scale.setScalar(.3+age*.85)}let dt=Math.min((now-last)/1000,.1);last=now;if(running&&!ended){acc+=dt*speed;while(acc>=1/30){ai(1/30);acc-=1/30}}renderUnits(now);updateShrineVisuals();gem[0].emissiveIntensity=1.5+Math.sin(now*.003)*.5;gem[1].emissiveIntensity=1.5+Math.sin(now*.003+2)*.5;renderer.render(scene,camera)}requestAnimationFrame(frame);
