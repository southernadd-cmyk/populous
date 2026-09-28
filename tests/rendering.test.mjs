import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';

const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const terrainCode=source.slice(source.indexOf('function placeTerrainInstance('),source.indexOf('function renderStone('));
const treeCode=source.slice(source.indexOf('function renderObjects(){'),source.indexOf('function updateShrineVisuals()'));

test('the large instanced map updates individual tiles and remains raycastable',()=>{
 const W=64,H=48,tiles=Array.from({length:W*H},()=>({h:2,tree:false})),seed=2026;
 const mat=color=>new THREE.MeshStandardMaterial({color});
 const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,8),cyl=new THREE.CylinderGeometry(1,1,1,8),cone=new THREE.ConeGeometry(1,1,8),ringGeo=new THREE.TorusGeometry(1,.035,5,28),roofGeo=new THREE.BufferGeometry();
 const terrain=new THREE.Group(),terrainMarks=new THREE.Group(),objects=new THREE.Group();
 const at=(x,z)=>x>=0&&x<W&&z>=0&&z<H?tiles[z*W+x]:null;
 const height=(x,z)=>at(Math.round(x),Math.round(z))?.h||0;
 const pos=(x,z)=>new THREE.Vector3(x-W/2+.5,height(x,z)*.48,z-H/2+.5);
 const rand=(x,z,s)=>((Math.imul(x+17,1367)+Math.imul(z+11,769)+s*31)>>>0)%1000/1000;
 const clear=group=>{while(group.children.length){let child=group.children[0];group.remove(child);if(child.isInstancedMesh)child.dispose()}};
 const mesh=(geo,material,parent,x,y,z,sx,sy,sz)=>{let item=new THREE.Mesh(geo,material);item.position.set(x,y,z);item.scale.set(sx,sy,sz);parent.add(item);return item};
 const context=vm.createContext({THREE,W,H,seed,tiles,at,height,pos,rand,clear,mesh,terrain,terrainMarks,objects,box,sphere,cyl,cone,ringGeo,roofGeo,
  landMats:[null,...Array.from({length:5},()=>mat(0x718e69))],sideMats:[null,...Array.from({length:5},()=>mat(0x4a6250))],
  stoneMat:mat(0xc0ad83),terraceGold:mat(0xd1bd7b),terraceRough:mat(0xb17b68),pebbleMat:mat(0xffffff),trunkMat:mat(0x654c38),leafMats:[mat(0x294e3c),mat(0x38664a),mat(0x54825a)],
  shrines:[{x:18,z:18}],buildings:[],renderStone(){},renderBuilding(){},terraceScore:()=>0,
  terrainLevels:[],terrainSlots:null,terrainHeights:null,pebbleSlots:null,pebbleInstances:null,instanceTransform:new THREE.Object3D()});
 vm.runInContext(terrainCode+treeCode,context);
 vm.runInContext('renderTerrain()',context);
 assert.equal(terrain.children.length,11,'terrain uses a bounded number of drawables');
 assert.equal(context.terrainLevels[2].top.count,W*H);

 tiles[10*W+10].h=3;vm.runInContext('refreshTerrainAt(10,10)',context);
 assert.equal(context.terrainLevels[2].top.count,W*H-1);
 assert.equal(context.terrainLevels[3].top.count,1);
 let ray=new THREE.Raycaster(new THREE.Vector3(10-W/2+.5,10,10-H/2+.5),new THREE.Vector3(0,-1,0));
 let hit=ray.intersectObject(context.terrainLevels[3].top)[0];
 assert.ok(hit&&Math.abs(hit.point.y-3*.48)<.02,'the new tile top is pickable at its raised height');

 tiles[(H-1)*W+W-1].h=4;vm.runInContext('refreshTerrainAt(W-1,H-1)',context);
 assert.equal(context.terrainLevels[2].top.count,W*H-2,'removing a swapped instance keeps the group packed');
 assert.equal(context.terrainLevels[4].top.count,1);
 tiles[10*W+10].h=0;vm.runInContext('refreshTerrainAt(10,10)',context);
 assert.equal(context.terrainLevels[3].top.count,0);
 tiles[10*W+10].h=2;vm.runInContext('refreshTerrainAt(10,10)',context);
 assert.equal(context.terrainLevels[2].top.count,W*H-1);

 tiles[4*W+4].tree=true;tiles[5*W+5].tree=true;
 vm.runInContext('renderObjects()',context);
 assert.equal(objects.children.length,4,'trees use one trunk batch and three foliage batches');
 assert.equal(objects.children[0].count,2);
 assert.equal(objects.children.slice(1).reduce((sum,item)=>sum+item.count,0),4);
});
