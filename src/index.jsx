import ReactDOM from 'react-dom';
import React from 'react';
import Controller from './components/Controller.jsx';
import './public/main.css';
import * as THREE from 'three';
//import Tween from '@tweenjs/tween.js';
//import {ObjectLoader} from "three";
import { OBJLoader,MTLLoader } from 'three-obj-mtl-loader';
import  TWEEN from '@tweenjs/tween.js';
import { readXMLFile,xmlToJSON,xmlParse } from './utils/xmlParse';
import scene,{render,addLight} from './init_Scene';
import { address } from './config';

const Colors = {
    gray:0xcccccc,
    orange:0xF4A460,
    blue:0x6495ED,
    silver:0xB0B0B0,
    yellow:0xEEAD0E,
    white:0xF8F8FF,
    black:0x404040
};
let categorySize = [];
let shelf = [];//货架节点
let freight_lot = [];//货位节点
let entrys=[{x:-20,z:49}];//入口节点
let exits=[{x:20,z:49}];//出口节点
let ports = []; //缓冲区节点
let points = []; //传送带节点
let transport = []; //传送带路径
let allGoods = [];// 除了绘图之外还需要存储当前已经放入的物资模型对象，因为当进行物资取出时，需要知道物资的位置与大小信息。

let categoryXmlDom;
let renderXmlDom;

let startX = 10,startZ = 20;
//地板厚度
let floorThick =  4;

//堆垛机队列
let transporterList = null;
let goodsHeight = 15;


export let goal;
let time = 0;
let newPosition = new THREE.Vector3();
let matrix = new THREE.Matrix4();
export let mesh;
let stop = 1;
let DEGTORAD = 0.01745327;
export let openFirstView = false;
export let temp = new THREE.Vector3();

/*
let socket = new WebSocket(address);
socket.onopen = function(event){
    socket.send('<?xml version="1.0" encoding="utf-8"?>\n' +
        '<message category="RClientVerify"/>\n');
    console.log('connect success');
};
socket.onmessage = function(event){
    console.log('消息');
    let type = parseMessage(event.data);

    if(type === 'init'){
        createWithMessage();
        addLight();
        createCategory(500,350);
        render();
    }
};
socket.onerror = function(event){
    console.log('error')
};*/

/*transGoods.addEventListener('click',function(){
    if(workingGoods){
        //这里根据路径选择终点以及对应的堆垛机
        i===5?i=0:i++;
        initTween(workingGoods,transCars[i]);
        oldTween.start();
    }
});*/

//生成仓库
function createCategory(long, width){
    createFloor(long+80,width+80);
    createWall(long,width);
}

//生成地板
function createFloor(width, height){
    let floorGeom = new THREE.BoxGeometry(width,floorThick,height);
    let floorMesh = new THREE.MeshLambertMaterial({
        color: 0x444444,
        flatShading: true,
        aoMapIntensity:1,
        lightMapIntensity:0.5
    });
    let floor = new THREE.Mesh(floorGeom,floorMesh);
    floor.name ='canNotSelected';
    floor.receiveShadow = true;
    floor.position.set(0,0,0);
    scene.add(floor);
}

//生成墙壁
/*
*  @param {number} startX 仓库的起始x坐标
*  @param {number} startZ 仓库的起始Z坐标
*  @param {number} long   仓库的x轴长度
*  @param {number} width  仓库的z轴长度
* */
function createWall(long,width){
    let walls = new THREE.Object3D();

    //墙高
    const wallHeight = 20;
    //墙的厚度
    const wallThick = 2;

    //底部墙壁
    let wallBottomGeom = new THREE.CubeGeometry(long, wallHeight, wallThick);    // Geometry: 翻译 立方体几何，x,y,z
    let wallBottomMesh = new THREE.MeshPhongMaterial({color: Colors.gray, flatShading: true,specular:0x111111,skinning:true,shininess:100 });    // 立方体是0xff0000颜色
    let wallBottom = new THREE.Mesh(wallBottomGeom, wallBottomMesh);    // 把立方体和他的外观合并一下
    wallBottom.name ='canNotSelected';
    wallBottom.position.set(0+startX,wallHeight/2+floorThick/2,width/2-.5+startZ);
    wallBottom.castShadow = true;    // 立方体的阴影
    walls.add(wallBottom);

    //顶部墙壁
    let wallTopGeom = new THREE.CubeGeometry(long, wallHeight, wallThick);
    let wallTopMesh = new THREE.MeshPhongMaterial({color: Colors.gray, flatShading: true,specular:0xffffff });
    let wallTop = new THREE.Mesh(wallTopGeom, wallTopMesh);
    wallTop.name ='canNotSelected';
    wallTop.position.set(0 + startX,wallHeight/2+floorThick/2,-width/2+.5+startZ);
    wallTop.castShadow = true;    // 立方体的阴影
    walls.add(wallTop);

    //右侧墙壁
    let wallRightGeom = new THREE.CubeGeometry(width, wallHeight, wallThick);
    let wallRightMesh = new THREE.MeshPhongMaterial({color: Colors.gray, flatShading: true,specular:0xffffff });
    let wallRight = new THREE.Mesh(wallRightGeom, wallRightMesh);
    wallRight.name ='canNotSelected';
    wallRight.castShadow = true;
    wallRight.position.set(long/2-.5+startX,wallHeight/2+floorThick/2,0+startZ);
    wallRightGeom.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI/2));
    walls.add(wallRight);

    //左侧墙壁
    let wallLeftGeom = new THREE.CubeGeometry(width, wallHeight, wallThick);
    let wallLeftMesh = new THREE.MeshLambertMaterial({color: Colors.gray, flatShading: true });
    let wallLeft = new THREE.Mesh(wallLeftGeom, wallLeftMesh);
    wallLeft.name ='canNotSelected';
    wallLeft.position.set(-long/2+.5+startX,wallHeight/2+floorThick/2,0+startZ);
    wallLeft.castShadow = true;
    wallLeftGeom.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI/2));
    walls.add(wallLeft);

    //使用ThreeBSP的差值函数，在墙壁上抠窗户和出入口

    scene.add(walls);    // 将立方体添加进去场景中去
}

//生成传送带
/*
* @param {number} x 传送带x轴位置
* @param {number} y 传送带y轴位置
* @param {number} z 传送带z轴位置
* */
function createBelt(x,y,z){
    //let belt = new THREE.Group();
    //传送带的长宽高
    const long = 19;
    const width = 19;
    const height = 10;

    //传送带板子的厚度
    const thick = 0.02*height;
    //传送带上下板子之间的距离
    const dis = 0.25*height;
    //腿的半径
    const legRadius = 0.04*width;

    //上表面
    let surfaceTopGeom = new THREE.BoxGeometry(long,thick,width);
    let surfaceMesh = new THREE.MeshPhongMaterial({color:Colors.silver,specular:Colors.silver,shininess:50,flatShading:true});
    let surfaceTop = new THREE.Mesh(surfaceTopGeom,surfaceMesh);
    surfaceTop.castShadow = true;
    surfaceTop.receiveShadow =true;
    surfaceTop.position.set(0,height/2-thick/2,0);
    surfaceTop.updateMatrix();

    //下表面
    let surfaceBottomGeom = new THREE.BoxGeometry(long,thick,width);
    let surfaceBottom = new THREE.Mesh(surfaceBottomGeom,surfaceMesh);
    surfaceBottom.castShadow = true;
    surfaceBottom.receiveShadow =true;
    surfaceBottom.position.set(0,height/2-dis-thick/2,0);
    surfaceBottom.updateMatrix();

    //腿
    let legGeom = new THREE.CylinderGeometry(legRadius,legRadius,height-thick,32);
    let legMesh = new THREE.MeshPhongMaterial({color:Colors.orange});
    let leg_1 = new THREE.Mesh(legGeom,legMesh);
    leg_1.castShadow = true;
    leg_1.position.set(long/2-legRadius,thick/2,width/2-legRadius);
    leg_1.updateMatrix();

    let leg_2 = leg_1.clone();
    leg_2.position.set(-(long/2-legRadius),thick/2,width/2-legRadius);
    leg_2.updateMatrix();
    let leg_3 = leg_1.clone();
    leg_3.position.set(-(long/2-legRadius),thick/2,-(width/2-legRadius));
    leg_3.updateMatrix();
    let leg_4 = leg_1.clone();
    leg_4.position.set(long/2-legRadius,thick/2,-(width/2-legRadius));
    leg_4.updateMatrix();


    //使用merge方法来合并模型,也可以使用group，区别就是merge是将模型组合成一个整体不能操作单个模型，而group是将模型分成一组可以操作单个模型
    let geom = new THREE.Geometry();
    geom.merge(surfaceTop.geometry,surfaceTop.matrix);
    geom.merge(surfaceBottom.geometry,surfaceBottom.matrix);
    geom.merge(leg_1.geometry,leg_1.matrix);
    geom.merge(leg_2.geometry,leg_2.matrix);
    geom.merge(leg_3.geometry,leg_3.matrix);
    geom.merge(leg_4.geometry,leg_4.matrix);


    let belt = new THREE.Mesh(geom,surfaceMesh);
    belt.name = '传送带';
    belt.position.set(startX+x,floorThick/2+height/2-.2,startZ+z);
    belt.receiveShadow = true;
    belt.castShadow = true;

    belt.info={
        x:x,
        y:y,
        z:z,
        v:'运输速度'
    };
    scene.add(belt);
}

//生成货柜
/*
* @param {number} x 传送带x轴位置
* @param {number} y 传送带y轴位置
* @param {number} z 传送带z轴位置
* @param {boolean} idNeedSign 该货柜是否需要显示标示牌
* */
function createGrid(x,y,z,ifNeedSign){

    //货柜层数
    const floor = 4;

    //货柜的长宽
    const long = 40;
    const width = 17;
    //每层高度
    const height = 20;
    //隔板厚度
    const thick = 0.2;
    //竖直架子的宽度
    const zhiJiaWidth = 0.8;
    //标志牌厚度
    const signThick = 0.8;
    //标志牌高度
    const signHeight = height;
    //标志牌离地距离
    const signDis = height*2;
    //文本大小
    const textSize = 4;

    //材质数组
    let meshArray = [
        //隔板材质
        new THREE.MeshPhongMaterial(
        {
            color:Colors.yellow,
            shininess:50,
            specular:Colors.yellow
        }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.yellow,
                shininess:50,
                specular:Colors.yellow
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.yellow,
                shininess:50,
                specular:Colors.yellow
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.yellow,
                shininess:50,
                specular:Colors.yellow
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.yellow,
                shininess:50,
                specular:Colors.yellow
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.yellow,
                shininess:50,
                specular:Colors.yellow
            }),

        //支架材质
        new THREE.MeshPhongMaterial(
        {
            color:Colors.blue,
            shininess:50,
            specular:Colors.blue
        }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.blue,
                shininess:50,
                specular:Colors.blue
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.blue,
                shininess:50,
                specular:Colors.blue
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.blue,
                shininess:50,
                specular:Colors.blue
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.blue,
                shininess:50,
                specular:Colors.blue
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.blue,
                shininess:50,
                specular:Colors.blue
            }),

        //指示牌材质
        new THREE.MeshPhongMaterial(
            {
                color:Colors.white,
                //shininess:50,
                specular:Colors.black,
                flatShading:true
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.white,
                //shininess:50,
                specular:Colors.black,
                flatShading:true
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.white,
                //shininess:50,
                specular:Colors.black,
                flatShading:true
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.white,
                //shininess:50,
                specular:Colors.black,
                flatShading:true
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.white,
                //shininess:50,
                specular:Colors.black,
                flatShading:true
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.white,
                //shininess:50,
                specular:Colors.black,
                flatShading:true
            }),

        //字体材质
        new THREE.MeshPhongMaterial(
            {
                color:Colors.black,
                shininess:50,
                specular:Colors.black
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.black,
                shininess:50,
                specular:Colors.black
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.black,
                shininess:50,
                specular:Colors.black
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.black,
                shininess:50,
                specular:Colors.black
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.black,
                shininess:50,
                specular:Colors.black
            }),
        new THREE.MeshPhongMaterial(
            {
                color:Colors.black,
                shininess:50,
                specular:Colors.black
            }),
    ];

    let geom = new THREE.Geometry();
    let geomMesh = new THREE.MeshPhongMaterial();
    if(ifNeedSign){
        //生成标志牌
        let signGeom = new THREE.BoxGeometry(width,signHeight,signThick);
        let sign = new THREE.Mesh(signGeom,geomMesh);
        sign.receiveShadow = true;
        sign.castShadow = true;
        signGeom.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI/2));
        sign.position.set(long/2,signDis,0);
        sign.updateMatrix();
        geom.merge(sign.geometry,sign.matrix,11);




        let fontLoader = new THREE.FontLoader();

        fontLoader.load( 'font.json', function ( font ) {
            //生成标志牌文字
            let textGeom = new THREE.TextGeometry(ifNeedSign,{
                font:font,
                size: 4,
                height:.5,
            });
            let text = new THREE.Mesh(textGeom,geomMesh);
            textGeom.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI/2));
            text.receiveShadow = true;
            text.castShadow = true;
            text.position.set(long/2,signDis-textSize/2,textSize/2+1);
            text.updateMatrix();
            geom.merge(text.geometry,text.matrix,18);

            //因为字体加载是异步，所以要把最终的模型加载放在回调中
            scene.add(grid);
        } );
    }

    //生成隔层
    let geCengGeomEx = new THREE.BoxGeometry(long,thick+4.5,width);
    //let geCengMesh = new THREE.MeshPhongMaterial()
    let geCeng_ex = new THREE.Mesh(geCengGeomEx,geomMesh);
    geCeng_ex.castShadow = true;
    geCeng_ex.receiveShadow = true;
    geCeng_ex.position.set(0,2.5,0);
    geCeng_ex.updateMatrix();
    geom.merge(geCeng_ex.geometry,geCeng_ex.matrix,0);

    //生成隔层
    let geCengGeom = new THREE.BoxGeometry(long,thick,width);
    //let geCengMesh = new THREE.MeshPhongMaterial()
    let geCeng_1 = new THREE.Mesh(geCengGeom,geomMesh);
    geCeng_1.castShadow = true;
    geCeng_1.receiveShadow = true;
    //geCeng_1.position.set(0,0,0);
    geCeng_1.updateMatrix();
    //这里的第三个参数表示读取材质的偏移量，这里为0就是从数组第0位开始读取6个面的材质
    //geom.merge(geCeng_1.geometry,geCeng_1.matrix,0);



    for(let i=0;i<floor;i++){
        let geCeng = geCeng_1.clone();
        geCeng.position.set(0,(i+1)*height+5,0);
        geCeng.updateMatrix();
        geom.merge(geCeng.geometry,geCeng.matrix,0);
    }

    //生成竖直架子
    let zhiJiaGeom = new THREE.BoxGeometry(zhiJiaWidth,floor*height,zhiJiaWidth);
    let zhiJia_1 = new THREE.Mesh(zhiJiaGeom,geomMesh);
    zhiJia_1.castShadow = true;
    zhiJia_1.receiveShadow = true;
    zhiJia_1.position.set(long/2-zhiJiaWidth/2,floor*height/2+5,width/2-zhiJiaWidth/2);
    zhiJia_1.updateMatrix();
    geom.merge(zhiJia_1.geometry,zhiJia_1.matrix,6);

    let zhiJia = zhiJia_1.clone();
    zhiJia.position.set(long/2-zhiJiaWidth/2,floor*height/2+5,-(width/2-zhiJiaWidth/2));
    zhiJia.updateMatrix();
    geom.merge(zhiJia.geometry,zhiJia.matrix,6);

    zhiJia = zhiJia_1.clone();
    zhiJia.position.set(-(long/2-zhiJiaWidth/2),floor*height/2+5,-(width/2-zhiJiaWidth/2));
    zhiJia.updateMatrix();
    geom.merge(zhiJia.geometry,zhiJia.matrix,6);

    zhiJia = zhiJia_1.clone();
    zhiJia.position.set(-(long/2-zhiJiaWidth/2),floor*height/2+5,width/2-zhiJiaWidth/2);
    zhiJia.updateMatrix();
    geom.merge(zhiJia.geometry,zhiJia.matrix,6);

    let grid = new THREE.Mesh(geom,meshArray);
    grid.name = '货架';
    grid.position.set(x+startX,floorThick/2+thick/2,z+startZ);
    grid.rotateY(-Math.PI/2);
    grid.receiveShadow = true;
    grid.castShadow = true;


    grid.info={
        x:x,
        y:height*floor,
        z:z,
        id:'编号'
    };

    if(!ifNeedSign){
        scene.add(grid);
    }
    return grid;
}


// 生成堆垛机模型对象数组，接受堆垛机的位置信息数组
function createTransporter(transporters){
    let allPromise = [];
    let mtlLoader = new MTLLoader();
    let objLoader = new OBJLoader();
    mtlLoader.setCrossOrigin(true);

    if(transporters.length>0){
        for(let i=0;i<transporters.length;i++){
            let p = new Promise(function(resolve){
                mtlLoader.load('./堆垛机.mtl', (materials) => {
                    //materials.preload();
                    objLoader.setMaterials(materials);
                    objLoader.load('./堆垛机.obj', (object) => {
                        object.children[0].geometry.center();
                        object.children[0].geometry.applyMatrix(new THREE.Matrix4().makeScale(10,10,10))
                        object.children[0].geometry.computeBoundingBox();

                        object.position.set(
                            0,
                            (object.children[0].geometry.boundingBox.max.y+2),
                            0
                        );
                        let diZuo = object;


                        //导入堆垛机的升降机
                        mtlLoader.load('./堆垛机_2.mtl', (materials) => {
                            //materials.preload();
                            objLoader.setMaterials(materials);
                            objLoader.load('./堆垛机_2.obj', (object) => {
                                object.children[0].geometry.center();
                                object.children[0].geometry.applyMatrix(new THREE.Matrix4().makeScale(5,5,8));
                                object.children[0].geometry.computeBoundingBox();
                                object.position.set(0,
                                    (object.children[0].geometry.boundingBox.max.y+floorThick/2+8),
                                    -5);
                                let shengJiangJi = object;


                                //导入堆垛机的搬运台
                                mtlLoader.load('./堆垛机_3.mtl', (materials) => {
                                    //materials.preload();
                                    objLoader.setMaterials(materials);
                                    objLoader.load('./堆垛机_3.obj', (object) => {
                                        object.children[0].geometry.center();
                                        object.children[0].geometry.applyMatrix(new THREE.Matrix4().makeScale(3,3,3));
                                        object.children[0].geometry.computeBoundingBox();
                                        object.position.set(0,
                                            (object.children[0].geometry.boundingBox.max.y+floorThick/2+12),
                                            2);
                                        let pingTai = object;

                                        //先生成叉子
                                        let forkGroup = new THREE.Group();

                                        let forkGeom = new THREE.BoxGeometry(3,.6,20);
                                        let forkMesh = new THREE.MeshPhongMaterial({color:Colors.black});
                                        let forkL = new THREE.Mesh(forkGeom,forkMesh);
                                        forkL.position.set(4,
                                            floorThick/2+.3+12,
                                            3);
                                        let forkR = forkL.clone();
                                        forkR.position.set(-4,floorThick/2+.3+12,3);
                                        forkGroup.add(forkL);
                                        forkGroup.add(forkR);


                                        //叉子+支架 生成 平台
                                        let plat = new THREE.Group();
                                        plat.add(forkGroup);
                                        plat.add(pingTai);


                                        //升降机+平台 生成 升降平台
                                        let shengJiangPingTai = new THREE.Group();
                                        shengJiangPingTai.add(shengJiangJi);
                                        shengJiangPingTai.add(plat);
                                        shengJiangPingTai.position.y = -8;

                                        //升降平台 + 底座 生成堆垛机
                                        let duiDuoJi = new THREE.Group();

                                        //plat和底座 => 整体
                                        duiDuoJi.add(diZuo);
                                        duiDuoJi.add(shengJiangPingTai);
                                        duiDuoJi.position.set(parseInt(transporters[i].x)+startX,0,parseInt(transporters[i].z)-25+startZ);

                                        // 生成堆垛机对象
                                        resolve(new Transporter({
                                            duiDuoJi:duiDuoJi,
                                            diZuo:diZuo,
                                            shengJiangPingTai:shengJiangPingTai,
                                            plat:plat,
                                            forkGroup:forkGroup,
                                            pingTai:pingTai,
                                            port:transporters[i]  //堆垛机对应的缓冲区节点
                                        }));
                                    })
                                })
                            })
                        });
                    })
                });
            });
            allPromise.push(p);
        }
    }
    return allPromise;
}

// 执行堆垛机的模型导入，当模型全部导入完成后将模型添加进场景中
// 传入的是堆垛机的位置信息数组
function importTransporter(transporters){
    //按照缓冲区节点数组中的节点来生成堆垛机，并保存它们之间的对应关系
    Promise.all(createTransporter(transporters)).then(function(list){
        //transporterList中就保存了所有堆垛机的模型对象，以及对应的缓存节点
        transporterList = list;
        //现在transporterList中就是所有已经导入的堆垛机模型以及对应的节点
        for(let i=0;i<transporterList.length;i++){
            //加入到场景中
            scene.add(transporterList[i].transporter.duiDuoJi);
        }
    });
}


function Transporter(mesh){
    this.transporter = mesh;
    this.status = 'waiting';
    this.inWorks = [];
    this.outWorks = [];
    this.verticalSpeed = 10;
}

Transporter.prototype = {
    constructor:Transporter,
    in:function(goods,node){
        if(this.status === 'waiting'){
            this.status = 'busy';
            this.trans('in',goods,node);
        }else{
            //如果当前堆垛机正忙，则将任务加入堆垛机队列中
            this.inWorks.push({goods:goods,node:node,date:Date.now()});
        }
    },
    out:function(goods,nodeArray){
        if(this.status === 'waiting'){
            this.status = 'busy';
            let tweens = [];
            for(let i=2;i<nodeArray.length;i++) {
                let tween = new TWEEN.Tween(goods.position);
                tween.to({x:startX+nodeArray[i].x , z:startZ+nodeArray[i].z},500).delay(100);
                tweens.push(tween);
            }

            this.trans('out',goods,nodeArray[1],tweens);
        }else{
            //如果当前堆垛机正忙，则将任务加入堆垛机队列中
            this.outWorks.push({goods:goods,nodeArray:nodeArray,date:Date.now()});
        }
    },
    trans:function(type,goods,node,tweens){
        //goods 货物，node 缓冲区节点
        //在取货时，就是从goods到node，存货时从node到goods
        let disZ = node.z - goods.position.z;
        let disY = node.y - goods.position.y;
        let deep = 20;
        let startPosition = Object.assign({},goods.position);
        let dir;

        console.log(this.transaction_id,'trans');
        if(type === 'in'){
            //判断叉子的旋转方向
            if(this.transporter.duiDuoJi.position.x > node.x){
                dir = 'left';
            }else{
                dir = 'right';
            }
            // 设置堆垛机动画
            let t_tween = new TWEEN.Tween(this.transporter.shengJiangPingTai.position);
            t_tween.to({y:'+5.5'}).delay(200);
            let t_tween_1 = new TWEEN.Tween(this.transporter.forkGroup.position);
            //伸出叉子
            t_tween_1.to({z:`${deep}`},500).delay(200);
            t_tween_1.onComplete(()=>{
                // 这里用来设置货物的动画
                // 缩回叉子
                let t_tween_1 = new TWEEN.Tween(goods.position);
                t_tween_1.to({z:`-${deep}`},500).delay(200);

                //移动堆垛机到货位处
                let t_tween_2 = new TWEEN.Tween(goods.position);
                t_tween_2.to({z:toStr(disZ)},500).delay(200);

                //移动升降平台
                let t_tween_3 = new TWEEN.Tween(goods.position);
                t_tween_3.to({y:node.y+5},500).delay(200);

                //旋转平台
                let t_tween_4 = new TWEEN.Tween(goods.rotation);
                //判断目标节点的x轴的大小，如果大于堆垛机就逆时针旋转90度，否则顺时针旋转90度
                dir === 'right'?t_tween_4.to({y:Math.PI/2},500).delay(200):t_tween_4.to({y:-Math.PI/2},500).delay(200);

                //伸出叉子
                let t_tween_5 = new TWEEN.Tween(goods.position);
                //判断目标节点的x轴的大小，如果大于堆垛机叉子就要向x轴正方向伸
                //判断目标节点的x轴的大小，如果小于堆垛机叉子就要向x轴负方向伸
                t_tween_5.to({x:dir==='right'?'+20':'-20'},500).delay(200);

                t_tween_1.chain(t_tween_2);
                t_tween_2.chain(t_tween_3);
                t_tween_3.chain(t_tween_4);
                t_tween_4.chain(t_tween_5);
                t_tween_1.start();
            });


            //缩回叉子
            let t_tween_2 = new TWEEN.Tween(this.transporter.forkGroup.position);
            t_tween_2.to({z:`-${deep}`},500).delay(200);

            //移动堆垛机到目标节点处
            let t_tween_3 = new TWEEN.Tween(this.transporter.duiDuoJi.position);
            t_tween_3.to({z:toStr(disZ)},500).delay(200);

            //移动升降平台
            let t_tween_4 = new TWEEN.Tween(this.transporter.shengJiangPingTai.position);
            t_tween_4.to({y:toStr(disY+5)},500).delay(200);

            //旋转平台
            let t_tween_5 = new TWEEN.Tween(this.transporter.plat.rotation);
            //判断目标节点的x轴的大小，如果大于堆垛机就逆时针旋转90度，否则顺时针旋转90度
            if(this.transporter.duiDuoJi.position.x > this.transporter.port.x){
                t_tween_5.to({y:-Math.PI/2},500).delay(200);
            }else{
                t_tween_5.to({y:Math.PI/2},500).delay(200);
            }

            //伸出叉子
            let t_tween_6 = new TWEEN.Tween(this.transporter.forkGroup.position);
            //判断目标节点的x轴的大小，如果大于堆垛机叉子就要向x轴正方向伸
            t_tween_6.to({z:`${deep}`},500).delay(200);

            //缩回叉子
            let t_tween_7 = new TWEEN.Tween(this.transporter.forkGroup.position);
            t_tween_7.to({z:`${-deep}`},500).delay(200)

            //旋转平台
            let t_tween_8 = new TWEEN.Tween(this.transporter.plat.rotation);
            t_tween_8.to({y:0},500).delay(200);

            //移动升降平台
            let t_tween_9 = new TWEEN.Tween(this.transporter.shengJiangPingTai.position);
            t_tween_9.to({y:-8},500).delay(200);


            //回到起点
            let t_tween_10 = new TWEEN.Tween(this.transporter.duiDuoJi.position);
            t_tween_10.to({z:toStr(disZ,true)},500).delay(200);

            t_tween_10.onComplete(()=>{
                this.status = 'waiting';

               console.log('动画完成');
                console.log(`<?xml version="1.0" encoding="utf-8"?>
                    <message category="ProcessingResult" transaction_id="${this.transaction_id}">
                <result complete="true"/> 
                </message>
                 `);

                /*socket.send(`<?xml version="1.0" encoding="utf-8"?>
                    <message category="ProcessingResult" transaction_id="${this.transaction_id}">
                <result complete="true"/> 
                </message>
                 `);*/

                openFirstView = false;
                if(this.inWorks.length || this.outWorks.length){
                    let inW = this.inWorks.shift()||{date:Date.now()};
                    let outW = this.outWorks.shift()||{date:Date.now()};

                    if(inW.date <= outW.date){
                        this.in(inW.goods,inW.node);
                    }else {
                        this.out(outW.goods, outW.node);
                    }
                }
            });
            t_tween.chain(t_tween_1);
            t_tween_1.chain(t_tween_2);
            t_tween_2.chain(t_tween_3);
            t_tween_3.chain(t_tween_4);
            t_tween_4.chain(t_tween_5);
            t_tween_5.chain(t_tween_6);
            t_tween_6.chain(t_tween_7);
            t_tween_7.chain(t_tween_8);
            t_tween_8.chain(t_tween_9);
            t_tween_9.chain(t_tween_10);

            t_tween.start();
        }
        else{
            //判断叉子的旋转方向
            //判断目标节点的x轴的大小，如果大于堆垛机就逆时针旋转90度，否则顺时针旋转90度
            if(this.transporter.duiDuoJi.position.x > goods.position.x){
                dir = 'left';
            }else{
                dir = 'right';
            }
            //移动堆垛机到货位节点处
            let t_tween_1 = new TWEEN.Tween(this.transporter.duiDuoJi.position);
            t_tween_1.to({z:startPosition.z},500).delay(200);

            //移动升降平台 ,升降平台有14的高度差
            let t_tween_2 = new TWEEN.Tween(this.transporter.shengJiangPingTai.position);
            t_tween_2.to({y:startPosition.y-14-goodsHeight/2},500).delay(200);

            //旋转平台
            let t_tween_3 = new TWEEN.Tween(this.transporter.plat.rotation);
            //判断目标节点的x轴的大小，如果大于堆垛机就逆时针旋转90度，否则顺时针旋转90度
            if(this.transporter.duiDuoJi.position.x > this.transporter.port.x){
                t_tween_3.to({y:Math.PI/2},500).delay(200);
            }else{
                t_tween_3.to({y:-Math.PI/2},500).delay(200);
            }

            //伸出叉子
            let t_tween_4 = new TWEEN.Tween(this.transporter.forkGroup.position);
            //判断目标节点的x轴的大小，如果大于堆垛机叉子就要向x轴正方向伸
            t_tween_4.to({z:`${deep}`},500).delay(200)
            t_tween_4.onComplete(()=>{
                // 这里用来设置货物的动画
                // 缩回叉子
                let t_tween_1 = new TWEEN.Tween(goods.position);
                t_tween_1.to({x:dir === "right"?`-${deep}`:`+${deep}`},500).delay(200);

                //旋转平台
                let t_tween_2 = new TWEEN.Tween(goods.rotation);
                //判断目标节点的x轴的大小，如果大于堆垛机就逆时针旋转90度，否则顺时针旋转90度
                t_tween_2.to({y:-Math.PI/2},500).delay(200);



                let t_tween_4 = new TWEEN.Tween(goods.position);
                t_tween_4.to({z:toStr(disZ,true)},500).delay(200);

                //移动升降平台
                let t_tween_3 = new TWEEN.Tween(goods.position);
                t_tween_3.to({y:11+goodsHeight/2},500).delay(200);

                //伸出叉子
                let t_tween_5 = new TWEEN.Tween(goods.position);
                t_tween_5.to({z:`+${deep}`,},500).delay(200);

                t_tween_1.chain(t_tween_2);
                t_tween_2.chain(t_tween_4);
                t_tween_4.chain(t_tween_3);
                t_tween_3.chain(t_tween_5);

                t_tween_1.start();
            });


            //缩回叉子
            let t_tween_5 = new TWEEN.Tween(this.transporter.forkGroup.position);
            t_tween_5.to({z:`-${deep}`},500).delay(200)

            //旋转平台
            let t_tween_6 = new TWEEN.Tween(this.transporter.plat.rotation);
            t_tween_6.to({y:0},500).delay(200);

            //回到起点
            let t_tween_7 = new TWEEN.Tween(this.transporter.duiDuoJi.position);
            t_tween_7.to({z:toStr(disZ,true)},500).delay(200);

            //移动升降平台
            let t_tween_8 = new TWEEN.Tween(this.transporter.shengJiangPingTai.position);
            t_tween_8.to({y:-3},500).delay(200);

            //伸出叉子
            let t_tween_9 = new TWEEN.Tween(this.transporter.forkGroup.position);
            t_tween_9.to({z:`${deep}`},500).delay(200);

            //缩回叉子
            let t_tween_10 = new TWEEN.Tween(this.transporter.forkGroup.position);
            t_tween_10.to({z:`-${deep}`},500).delay(200);

            let t_tween_11 = new TWEEN.Tween(this.transporter.shengJiangPingTai.position);
            t_tween_11.to({y:-8});
            // 在取出阶段的最后，将当前被取出的物资从allGoods数组中删除掉
            // 然后需要判断是否有待执行的任务，同时也需要向服务器发送消息，表示执行完成
            // 检查是否有任务
            t_tween_11.onComplete(()=>{
                for(let i=0;i<tweens.length-1;i++){
                    tweens[i].chain(tweens[i+1]);
                }
                tweens[tweens.length-1].onComplete(()=>{
                    allGoods.every(function(eve,index){
                        if(eve.goods === goods){
                            allGoods.splice(index,1);
                            return false;
                        }
                        return true;
                    });
                    scene.remove(goods);

                    console.log('完成一次动画');

                    /*socket.send(`
                <?xml version="1.0" encoding="utf-8"?>
                    <message category="ProcessingResult" transaction_id="${this.transaction_id}">
                <result complete="true"/> 
                </message>
                 `);*/


                    this.status = 'waiting';
                    if(this.inWorks.length || this.outWorks.length){
                        let inW = this.inWorks.shift()||{date:Date.now()};
                        let outW = this.outWorks.shift()||{date:Date.now()};

                        if(inW.date <= outW.date){
                            this.in(inW.goods,inW.node);
                        }else {
                            this.out(outW.goods, outW.nodeArray);
                        }
                    }
                });
                tweens[0].start();
            });
            t_tween_1.chain(t_tween_2);
            t_tween_2.chain(t_tween_3);
            t_tween_3.chain(t_tween_4);
            t_tween_4.chain(t_tween_5);
            t_tween_5.chain(t_tween_6);
            t_tween_6.chain(t_tween_7);
            t_tween_7.chain(t_tween_8);
            t_tween_8.chain(t_tween_9);
            t_tween_9.chain(t_tween_10);
            t_tween_10.chain(t_tween_11);
            t_tween_1.start();
        }
    }
};

// 动画相关
// 开始时会获得一些节点，这里主要分为取货和存货两种状态：
// 当第一个节点不是入口节点时，表示当前是取货，否则是存货
// 这里需要一些判断，就是在进行货物搬运时需要判断该货物应该由哪台堆垛机进行搬运，
// 解决办法为：当货物存放过程中，在货物到达堆垛机搬运点时，每个搬运点按照序号与对应的堆垛机相关联，
// 当确认好堆垛机之后，将货物存放到堆垛机的内部数组中，数组中所存放的就是当前堆垛机负责存取的货物。


// 对传入的物资按照节点顺序进行动画处理
function animation(goods,nodeArray,transaction_id){
    let tweens = [];
    // 判断是执行存入还是取出动画
    if(nodeArray[0].id === 'e_1'){

        //存入动画，末尾节点为货位
        for(let i=0;i<nodeArray.length-1;i++) {
            let tween = new TWEEN.Tween(goods.position);
            tween.to({x:startX+nodeArray[i].x,z:startZ+nodeArray[i].z},500).delay(100);
            tweens.push(tween);

            if(i === nodeArray.length-2){
                tween.onComplete(function(){
                    // 遍历transporterList，寻找当前缓冲区节点对应的堆垛机
                    let transporter = transporterList.filter(function(eve){
                        if(nodeArray[i].id === eve.transporter.port.id){
                            return true;
                        }
                    })[0];
                    transporter.transaction_id = transaction_id
                    // 执行存货动画，此时货物的位置就在缓冲区节点上
                    transporter.in(goods,nodeArray[i+1]);
                });
            }
        }
        for(let i=0;i<tweens.length-1;i++){
            tweens[i].chain(tweens[i+1]);
        }
        tweens[0].start();
    }
    else{
        let transporter = transporterList.filter(function(eve){
            if(nodeArray[1].id === eve.transporter.port.id){
                return true;
            }
        })[0];
        transporter.transaction_id = transaction_id
        transporter.out(goods,nodeArray);
    }
}

function createGoods(x,y,z,freight_lot_id){
    let textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('true');
    return new Promise(function(resolve){
        textureLoader.load('货箱贴图.jpg',function(texture){
            let goodsGeom = new THREE.BoxGeometry(15,15,15);
            let goodsMesh = new THREE.MeshPhongMaterial({map:texture});
            let goods = new THREE.Mesh(goodsGeom,goodsMesh);
            mesh = goods;
            goods.castShadow = true;
            goods.receiveShadow = true;
            goods.name = '货箱';
            goods.info = {
              x:x,
              y:y,
              z:z,
              id:freight_lot_id,
              type:'货物类型'
            };
            goods.position.set(startX+x,floorThick/2+goodsHeight/2+.2+y+5,startZ+z);
            // 把当前已经生成的物资加入到队列中
            allGoods.push({goods,freight_lot_id});

            goal = new THREE.Object3D();
            goods.add(goal);
            scene.add(goods);

            goal.position.set(10, 20, -20);

            resolve(goods);
        });
    });
}
function toStr(x,boolean){
    if(arguments.length >1){
        if(boolean){
            return x>=0? "+"+x:"+"+-x;
        }else{
            return x>=0?"-"+x:"-"+-x;
        }
    }else{
        return x>=0? "+"+x:"-"+-x;
    }

}
function renderKeyBelt(){
    for(let i=0;i<transport.length;i++){
        let start = transport[i].start;
        let end = transport[i].end;
        createBelt(parseInt(start[0]),parseInt(start[1]),parseInt(start[2]));
        createBelt(parseInt(end[0]),parseInt(end[1]),parseInt(end[2]));
    }
}

function renderTransportBelt(){
    let number;
    for(let i=0;i<transport.length;i++){
        let start = transport[i].start;
        let end = transport[i].end;
        end.every(function(eve,index){
            if(eve !== start[index]){
                switch(index){
                    case 0:
                        number = Math.abs((parseInt(start[index])-parseInt(eve)))/20;
                        if(parseInt(eve)<parseInt(start[index])){
                            for(let i=0;i<number;i++){
                                createBelt(parseInt(start[0])-20*(i+1),0,parseInt(start[2]));
                            }
                        }else{
                            for(let i=0;i<number;i++){
                                createBelt(parseInt(start[0])+20*(i+1),0,parseInt(start[2]));
                            }
                        }
                        break;
                    case 2:
                        number = Math.abs((parseInt(start[index])-parseInt(eve)))/20;

                        if(parseInt(eve)<parseInt(start[index])){
                            for(let i=0;i<number;i++){
                                createBelt(parseInt(start[0]),0,parseInt(start[2])-20*(i+1));
                            }
                        }else{
                            for(let i=0;i<number;i++){
                                createBelt(parseInt(start[0]),0,parseInt(start[2])+20*(i+1));
                            }
                        }
                        break;
                    default:
                        break;
                }
                return false;
            }else{
                return true;
            }

        })
    }
}

//解析消息
function parseMessage(message){
    // categoryXmlDom = xmlParse(message);
    categoryXmlDom = readXMLFile('demo1.xml');

    if(categoryXmlDom.firstChild.getAttribute('category') === 'ProcessingRequest'){
        parseRenderMessage(categoryXmlDom);
        return 'ProcessingRequest';
    }

    let category= categoryXmlDom.getElementsByTagName('warehouse')[0];
    // 节点列表
    let nodeList = categoryXmlDom.getElementsByTagName('nodeList')[0];
    // 线路列表
    let linkList = categoryXmlDom.getElementsByTagName('linkList')[0];

    // 仓库大小
    categorySize.splice(0,0,parseInt(category.getAttribute('width')),parseInt(category.getAttribute('height')));

    // 遍历所有节点，按照类型进行区分
    for(let i=0;i<nodeList.children.length;i++){
        let position;
        switch(nodeList.children[i].getAttribute('type')){
            //货架节点
            case 'shelf':
                position = nodeList.children[i].getAttribute('position').split(',');
                shelf.push({
                    x:parseFloat(position[0]),
                    y:parseFloat(position[1]),
                    z:parseFloat(position[2]),
                    id:nodeList.children[i].getAttribute('id')
                });
                break;
                //货位节点
            case 'freight_lot':
                position = nodeList.children[i].getAttribute('position').split(',');
                freight_lot.push({
                    x:parseFloat(position[0]),
                    y:parseFloat(position[1]),
                    z:parseFloat(position[2]),
                    id:nodeList.children[i].getAttribute('id'),
                    has:nodeList.children[i].children.length //表示当前货位上是否有物资
                });
                break;
                //入口节点
            case 'entry':
                position = nodeList.children[i].getAttribute('position').split(',');
                entrys.push({
                    x:parseFloat(position[0]),
                    y:parseFloat(position[1]),
                    z:parseFloat(position[2]),
                    id:nodeList.children[i].getAttribute('id')
                });
                break;
                //出口节点
            case 'exit':
                position = nodeList.children[i].getAttribute('position').split(',');
                exits.push({
                    x:parseFloat(position[0]),
                    y:parseFloat(position[1]),
                    z:parseFloat(position[2]),
                    id:nodeList.children[i].getAttribute('id')
                });
                break;
                //缓冲区节点
            case 'port':
                position = nodeList.children[i].getAttribute('position').split(',');
                ports.push({
                    x:parseFloat(position[0]),
                    y:parseFloat(position[1]),
                    z:parseFloat(position[2]),
                    id:nodeList.children[i].getAttribute('id')
                });
                break;
                // 传送带节点
            case 'node':
                position = nodeList.children[i].getAttribute('position').split(',');
                points.push({
                    x:parseFloat(position[0]),
                    y:parseFloat(position[1]),
                    z:parseFloat(position[2]),
                    id:nodeList.children[i].getAttribute('id')
                });
                break;
            default:
                break;
        }
    }

    for(let i=0;i<linkList.children.length;i++){
        switch(linkList.children[i].getAttribute('type')){
            // 传送带路径
            case 'conveyor':
                transport.push({
                    start:categoryXmlDom.getElementById(linkList.children[i].getAttribute('startNode')).getAttribute('position').split(','),
                    end:categoryXmlDom.getElementById(linkList.children[i].getAttribute('endNode')).getAttribute('position').split(',')
                });
                break;
            default:
                break;
        }
    }
    return 'init';
}

// 按照解析的信息生成仓库环境
function createWithMessage(){
    let sign = 1;
    for(let i=0;i<shelf.length;i++){
        if(i%5===0){
            createGrid(parseInt(shelf[i]['x']),parseInt(shelf[i]['y']),parseInt(shelf[i]['z']),sign>=10?`${sign++}`:`0${sign++}`);
        }else{
            createGrid(parseInt(shelf[i]['x']),parseInt(shelf[i]['y']),parseInt(shelf[i]['z']));
        }

    }
    renderKeyBelt();
    renderTransportBelt();
    importTransporter(ports);

    //按照货位信息渲染物资
    for(let i=0;i<freight_lot.length;i++){
        if(freight_lot[i].has){
            createGoods(parseInt(freight_lot[i]['x']),parseInt(freight_lot[i]['y']),parseInt(freight_lot[i]['z']),freight_lot[i].id);
        }
    }
}


addLight();
createCategory(500,350);
render();
parseMessage();
createWithMessage();
window.addEventListener('keydown',function(e){
    if(e.key === 's'){
        parseRenderMessage();
        openFirstView = true;
    }
});


function parseLocalFile() {
    renderXmlDom = readXMLFile('./demo.xml');
    let transaction_id = renderXmlDom.firstChild.getAttribute('transaction_id');
    // 保存路径上的节点信息
    let paths = [...renderXmlDom.querySelector('route').children];
    // 通过最后一个节点的类型来判断是存货还是取货
    let type = paths[paths.length-1].getAttribute('type');
    // 生成位置信息数组
    let nodeList = paths.map(function(eve){
        let positionArray = eve.getAttribute('position').split(',');
        return {
            x:parseFloat(positionArray[0]),
            y:parseFloat(positionArray[1])+10,
            z:parseFloat(positionArray[2]),
            id:eve.id
        }
    });
    // 取货
    if(type === 'entry'){
        if(!allGoods.length){
            throw new Error('no goods in category!')
        }
        // 取货时，第一个节点是货位节点,所以要在allGoods数组中寻找该货位中存储的物资对象
        let goods = allGoods.filter(function(eve){
            if(eve.freight_lot_id === nodeList[0].id){
                return true;
            }
        })[0];

        // 获取到物资对象后，开始进行动画
        animation(goods.goods,nodeList,transaction_id);

    }else{
        // 存货
        // 存货时，需要先生成一个物资模型，将模型放入allGoods数组中，然后执行模型的运送动画
        createGoods(nodeList[0]['x'],nodeList[0]['y']-5,nodeList[0]['z'],nodeList[0]['id'])
            .then(function(goods){
                console.log(transaction_id);
                //加入完成之后，开始执行运送动画
                animation(goods,nodeList,transaction_id);
            });

    }
}


//解析绘图信息，获取目的位置与路径
function parseRenderMessage(message){
    // renderXmlDom = message;
    renderXmlDom = readXMLFile('./demo3.xml');
    let transaction_id = renderXmlDom.firstChild.getAttribute('transaction_id');
    // 保存路径上的节点信息
    let paths = [...renderXmlDom.querySelector('route').children];
    // 通过最后一个节点的类型来判断是存货还是取货
    let type = paths[paths.length-1].getAttribute('type');
    // 生成位置信息数组
    let nodeList = paths.map(function(eve){
        let positionArray = eve.getAttribute('position').split(',');
        return {
            x:parseFloat(positionArray[0]),
            y:parseFloat(positionArray[1])+10,
            z:parseFloat(positionArray[2]),
            id:eve.id
        }
    });
    // 取货
    if(type === 'entry'){
        if(!allGoods.length){
            throw new Error('no goods in category!')
        }
        // 取货时，第一个节点是货位节点,所以要在allGoods数组中寻找该货位中存储的物资对象
        let goods = allGoods.filter(function(eve){
            if(eve.freight_lot_id === nodeList[0].id){
                return true;
            }
        })[0];

        // 获取到物资对象后，开始进行动画
        animation(goods.goods,nodeList,transaction_id);

    }else{
        // 存货
        // 存货时，需要先生成一个物资模型，将模型放入allGoods数组中，然后执行模型的运送动画
        createGoods(nodeList[0]['x'],nodeList[0]['y']-5,nodeList[0]['z'],nodeList[0]['id'])
            .then(function(goods){
                console.log(transaction_id);
                //加入完成之后，开始执行运送动画
                animation(goods,nodeList,transaction_id);
            });

    }
}

// ReactDOM.render(<Controller />, document.querySelector('#controller'));

/*
function model(){

    let mtlLoader = new MTLLoader();

    let objLoader = new OBJLoader();

    mtlLoader.load('./grid.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('./grid.obj', (object) => {
            object.scale.set(3,3,3)
            object.receiveShadow = true;
            object.castShadow = true;
            scene.add(object)
        })
    })
}*/














