import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';

const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('inspect raycasts the visible building meshes rather than only terrain',()=>{
 assert.match(source,/userData\.inspectBuilding=b/);
 assert.match(source,/intersectObjects\(objects\.children\.filter\(o=>o\.userData\.inspectBuilding\),false\)/);
});

test('inspect opens the site card for ordinary friendly homes, not only blessed ones',()=>{
 assert.match(source,/occupied\?\.owner===0&&occupied\.type==='hut'/);
 assert.match(source,/home=buildings\.includes\(site\)&&site\?\.owner===0&&site\?\.type==='hut'/);
 assert.match(source,/unblessed: use Bless to make this home generate Faith and Devotion/);
});

test('sloped terrain preserves logical tile centres and remains raycastable',()=>{
 const W=8,H=8,tiles=Array.from({length:W*H},()=>({h:2,tree:false})),seed=2026;
 const mat=color=>new THREE.MeshStandardMaterial({color});
 const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,8),cyl=new THREE.CylinderGeometry(1,1,1,8),cone=new THREE.ConeGeometry(1,1,8),ringGeo=new THREE.TorusGeometry(1,.035,5,28),roofGeo=new THREE.BufferGeometry();
 const terrain=new THREE.Group(),terrainMarks=new THREE.Group(),objects=new THREE.Group();
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const at=(x,z)=>x>=0&&x<W&&z>=0&&z<H?tiles[z*W+x]:null;
 const height=(x,z)=>at(Math.round(x),Math.round(z))?.h||0;
 const rand=(x,z,s)=>((Math.imul(x+17,1367)+Math.imul(z+11,769)+s*31)>>>0)%1000/1000;
 const clear=group=>{while(group.children.length){let child=group.children[0];group.remove(child);if(child.geometry)child.geometry.dispose();if(child.material?.dispose)child.material.dispose();if(child.isInstancedMesh)child.dispose()}};
 const mesh=(geo,material,parent,x,y,z,sx,sy,sz)=>{let item=new THREE.Mesh(geo,material);item.position.set(x,y,z);item.scale.set(sx,sy,sz);parent.add(item);return item};
 const context=vm.createContext({THREE,W,H,seed,tiles,at,height,rand,clear,mesh,terrain,terrainMarks,objects,box,sphere,cyl,cone,ringGeo,roofGeo,clamp,
  landMats:[null,...Array.from({length:5},(_,i)=>mat(0x617e59+i*0x050505))],sideMats:[null,...Array.from({length:5},()=>mat(0x4a6250))],
  stoneMat:mat(0xc0ad83),terraceGold:mat(0xd1bd7b),terraceRough:mat(0xb17b68),pebbleMat:mat(0xffffff),trunkMat:mat(0x654c38),leafMats:[mat(0x294e3c),mat(0x38664a),mat(0x54825a)],
  shrines:[],buildings:[],renderStone(){},renderBuilding(){},terraceScore:()=>0,
  terrainLevels:[],terrainSlots:null,terrainHeights:null,pebbleSlots:null,pebbleInstances:null,instanceTransform:new THREE.Object3D()});
 const terrainCode=source.slice(source.indexOf('function terrainCornerHeight('),source.indexOf('function renderStone('));
 vm.runInContext(terrainCode,context);
 context.pos=(x,z)=>new THREE.Vector3(x-W/2+.5,context.surfaceHeight(x+.5,z+.5)*.48,z-H/2+.5);
 vm.runInContext('renderTerrain()',context);
 assert.equal(terrain.children.length,2,'terrain is one continuous surface plus pebble instances');
 assert.equal(context.surfaceHeight(3.5,3.5),2,'a tile centre stays at its exact logical height');

 tiles[3*W+3].h=4;vm.runInContext('refreshTerrainAt(3,3)',context);
 assert.equal(context.surfaceHeight(3.5,3.5),4,'raise/lower refresh keeps the logical centre exact');
 const shared=context.surfaceHeight(4,4);
 assert.ok(shared>2&&shared<4,'shared corners blend neighbouring logical heights into a slope');
 const left=context.surfaceHeight(4-1e-6,4),right=context.surfaceHeight(4+1e-6,4);
 assert.ok(Math.abs(left-right)<1e-4,'adjacent tiles meet without a vertical step');

 let ray=new THREE.Raycaster(new THREE.Vector3(3.5-W/2,10,3.5-H/2),new THREE.Vector3(0,-1,0));
 let surface=terrain.children.find(o=>o.userData.terrainSurface),hit=ray.intersectObject(surface)[0];
 assert.ok(hit&&Math.abs(hit.point.y-4*.48)<.02,'the raised tile centre is raycastable at the new surface height');

 tiles[2*W+2].tree=true;tiles[5*W+5].tree=true;
 const treeCode=source.slice(source.indexOf('function renderObjects(){'),source.indexOf('function updateShrineVisuals()'));
 vm.runInContext(treeCode,context);vm.runInContext('renderObjects()',context);
 assert.equal(objects.children.length,4,'tree batching still works on the sloped surface');
});
