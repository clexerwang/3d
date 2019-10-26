import * as THREE from "three";
import TrackballControls from "three-trackballcontrols";
import TWEEN from '@tweenjs/tween.js';
import { goal, mesh, temp, openFirstView } from './index.jsx';

// import { RenderPass, EffectComposer, OutlinePass,ShaderPass } from "three-outlinepass"
// import {EffectComposer,RenderPass,BloomEffect,EffectPass,OutlineEffect} from 'postprocessing';
import addCSS2D from '../node_modules/three/examples/js/renderers/CSS2DRenderer.js';
import addCSS3D from '../node_modules/three/examples/js/renderers/CSS3DRenderer.js';
import addEffectComposer from '../node_modules/three/examples/js/postprocessing/EffectComposer.js';
import addFXAAShader from '../node_modules/three/examples/js/shaders/FXAAShader.js';
import addRenderPass from '../node_modules/three/examples/js/postprocessing/RenderPass.js';
import addOutlinePass from '../node_modules/three/examples/js/postprocessing/OutlinePass.js';
import addShaderPass from '../node_modules/three/examples/js/postprocessing/shaderPass.js'
import addCopyShader from '../node_modules/three/examples/js/shaders/copyShader.js'
import addSSAARenderPass from '../node_modules/three/examples/js/postprocessing/SSAARenderPass.js';
import addSMAAShader from '../node_modules/three/examples/js/shaders/SMAAShader.js';
import addSMAAPass from '../node_modules/three/examples/js/postprocessing/SMAAPass.js';
addCSS2D(THREE);
addCSS3D(THREE);
addSMAAShader(THREE);
addEffectComposer(THREE);
addRenderPass(THREE);
addSSAARenderPass(THREE);
addOutlinePass(THREE);
addShaderPass(THREE);
addCopyShader(THREE);
addFXAAShader(THREE);
addSMAAPass(THREE);

let renderArea = document.querySelector('body');

let canvas = document.querySelector('canvas');
canvas.width= window.innerWidth;
canvas.height=window.innerHeight;

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(75,canvas.width/canvas.height, .1, 10000);
let renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, alpha:true });
//renderer.setPixelRatio( window.devicePixelRatio);
camera.position.x = 0;
camera.position.y = 180;
camera.position.z = 300;
//camera.lookAt(scene.position);    // lookAt函数指向场景的中心
let trackBallControls = new TrackballControls(camera, renderArea);

//设置渲染出来的区域大小的大小
renderer.setSize( canvas.width, canvas.height );
//domElement相当于画布，这里是将画布插入到dom中
// renderArea.appendChild( renderer.domElement );

renderer.setClearColor(0x001100);
renderer.shadowMap.enabled = true;
renderer.shadowMapSoft = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
let label;


export function addLight(){
    //添加球面光，模拟自然光
    let hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x444444);
    //添加环境光
    let ambientLight = new THREE.AmbientLight(0xffffff, .3);
    //添加平行光，产生阴影
    let directionalLight = new THREE.DirectionalLight(0xaaaaaa, .7)

    directionalLight.castShadow = true;

    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 3000;
    directionalLight.position.set(100, 200, 100);

    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    scene.add(directionalLight);

    /*let ch = new THREE.CameraHelper(directionalLight.shadow.camera);
    scene.add(ch);*/
    scene.add(hemisphereLight);
    scene.add(ambientLight);
}

function Label(mesh){
    this.mesh = mesh;
    this.lebal = null;
}

function addLabel(mesh){
    console.log(1)
    let label = document.createElement('div');
    label.id ='label';

    let body = document.createElement('div');
    body.id='body';
    let div = document.createElement('div');
    div.innerText = '信息';
    body.appendChild(div);
    div = document.createElement('div');
    div.innerText = `类型: ${mesh.name}`;
    body.appendChild(div);
    div = document.createElement('div');
    div.innerText = '物资尺寸：';
    body.appendChild(div);
    div = document.createElement('span');
    div.innerText = `长： ${mesh.info.x}`;
    body.appendChild(div);
    div = document.createElement('span');
    div.innerText = `宽：${mesh.info.z}`;
    body.appendChild(div);
    div = document.createElement('span');
    div.innerText = `高：${mesh.info.y}`;
    body.appendChild(div);

    let arrow_outer=document.createElement('div');
    arrow_outer.id='arrow_outer';
    div = document.createElement('div');
    div.id = 'arrow';
    arrow_outer.appendChild(div);

    label.appendChild(body);
    label.appendChild(arrow_outer);

    let divLabel = new THREE.CSS2DObject(label);
    divLabel.position.set( 0, mesh.geometry.boundingSphere.radius*3, 0 );
    mesh.add(divLabel);
    return divLabel;
}


window.addEventListener('click',function(event){
    let rayCaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    rayCaster.setFromCamera( mouse, camera );
    let intersects = rayCaster.intersectObjects(scene.children,true);
    if(intersects.length){
        if(intersects[0].object.name !== 'canNotSelected'){
            let pre = selectedObjects.pop();
            pre?pre.remove(label):null;
            if(pre !== intersects[0].object){
                label = addLabel(intersects[0].object);
                selectedObjects.push(intersects[0].object);
            }
        }
    }
});


//使用threejs中的后期处理对象：EffectComposer

//1、创建composer,传入renderer
let composer = new THREE.EffectComposer(renderer);

let selectedObjects = [];
//2、配置通道
let renderPass = new THREE.RenderPass(scene,camera);
let outlinePass = new THREE.OutlinePass( new THREE.Vector2( 4096, 4096 ), scene, camera,selectedObjects );
let fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
let smaaPass = new THREE.SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );

var pixelRatio = renderer.getPixelRatio();
fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );

outlinePass.renderToScreen = true;
outlinePass.selectedObjects = selectedObjects;

//3、将通道加入composer
//要注意通道是按顺序执行的，加入时要注意顺序
composer.addPass(renderPass);
composer.addPass(smaaPass);
composer.addPass(fxaaPass);
composer.addPass(outlinePass);


let labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = 0;
document.body.appendChild( labelRenderer.domElement );


export function render(){
    requestAnimationFrame(render);
    trackBallControls.update();
    TWEEN.update();
    labelRenderer.render( scene, camera );
    if(mesh && openFirstView) {
        temp.setFromMatrixPosition(goal.matrixWorld);
        camera.position.lerp(temp, 0.2);
        camera.lookAt( mesh.position );
    }
    //4、之后就可以使用composer来进行渲染
    //renderer.render(scene,camera);
    composer.render();
}


export default scene;