import './public/main.css';
import TrackballControls from 'three-trackballcontrols';
import OBJLoader from 'three-react-obj-loader';
import * as THREE from 'three';
import {ObjectLoader} from "three";
import {JSONLoader} from "three";
/*import {
    Scene,
    PerspectiveCamera,
    OrthographicCamera,
    CubeCamera,
    WebGLRenderer,
    CubeGeometry,
    MeshBasicMaterial,
    Mesh,
    Vector2,
    Vector3,
    Geometry,
    LineBasicMaterial,
    Color,
    Line,
    LineSegments,
    Shape,
    Group,
    BoxHelper,
    ShapeGeometry, DoubleSide,
    CubeTextureLoader,
    TextureLoader,
    MeshPhongMaterial,
    MeshLambertMaterial,
    PCFSoftShadowMap,
    AxesHelper,
    PlaneGeometry,
    Face3,
    RepeatWrapping,
    AmbientLight,
    DirectionalLight,
    MeshStandardMaterial,
    PointLight,
    ObjectLoader
} from 'three';*/
// 渲染的流程：
// 1、生成场景(scene)，生成相机(camera)(同时设置相机参数)，生成渲染器(renderer);
// 2、设置渲染器的参数;
// 3、将画布(渲染器的domElement属性)插入dom中;
// 4、生成物体，并将物体放入场景(scene)中;
// 5、渲染器将场景和相机渲染到画布上(执行渲染器的render并传入场景和相机);

// 相机，场景，渲染器的关系：
// 可以想象成场景是一个不能直接用肉眼看到的东西，但是可以通过相机去获取场景当前的信息，
// 然后通过渲染器将相机获得的信息渲染出来
let canvas = document.querySelector('canvas');
canvas.width= window.innerWidth;
canvas.height=window.innerHeight;
let scene = new THREE.Scene();

//let camera = new PerspectiveCamera(45, window.innerWidth/window.innerHeight, 20, 8000);     // (YZ平面视野角度， 宽高比， 近平面， 远平面)
//camera.position.set(-900, 300, 1980);                                       // 设置相机位置， 默认（0, 0, 0）
//camera.lookAt(new Vector3(0, 50, 0));
let camera = new THREE.PerspectiveCamera(45,canvas.width/canvas.height, 10, 10000);
let renderer = new THREE.WebGLRenderer({antialias : true,canvas:canvas});
camera.position.x=0;
camera.position.y=800;
camera.position.z=800;
camera.lookAt(0,0,0);


let trackBallControls = new TrackballControls(camera);
//设置渲染出来的区域大小的大小
renderer.setSize( canvas.width,canvas.height );
//domElement相当于画布，这里是将画布插入到dom中
// document.body.appendChild( renderer.domElement );

renderer.setClearColor(0xffffff);
renderer.shadowMap.enabled = true;
//绘制立方体
function cube(){
    let light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(1000, 500, 5);
    light.shadow  = true;
    scene.add(light);
    let geometry = new THREE.CubeGeometry(1000,10,500);//长，高，宽,x,y,z
    var material = new THREE.MeshLambertMaterial({
        color: '#CCCCCC',
        emissive: '#8FBC8F'
    });
    let mesh = new THREE.Mesh(geometry,material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    //let boxHelper = new BoxHelper(cube,0x000000);
    //scene.add(boxHelper);

   /* let loader = new TextureLoader();

    let texture = loader.load('./floor2.jpg');
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set( 4, 4 );
    let mat = new MeshBasicMaterial({map:texture});
    let mesh = new Mesh(geometry,mat);

    scene.add(mesh);*/



}

function wall(){

    let light = new THREE.DirectionalLight('#C7C7C7',0.2);
    light.position.set(2,2,1);
    scene.add(light);
    let geometry = new THREE.CubeGeometry(1000,80,10);//长，高，宽,x,y,z

    var material = new THREE.MeshLambertMaterial({
        color: '#E0E0E0',
        emissive: '#BABABA'
    });
    let mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(0,45,-245);
    scene.add(mesh);

    geometry = new THREE.CubeGeometry(10,80,490);//长，高，宽,x,y,z
    material = new THREE.MeshLambertMaterial({
        color: '#E0E0E0',
        emissive: '#BABABA'
    });
    mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(-495,45,5);
    scene.add(mesh);

    geometry = new THREE.CubeGeometry(10,80,490);//长，高，宽,x,y,z
    material = new THREE.MeshLambertMaterial({
        color: '#E0E0E0',
        emissive: '#BABABA'
    });
    mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(495,45,5);
    scene.add(mesh);



    let loader = new ObjectLoader();

    loader.load(
        'ex42.json',
        function ( object ) {

            object.position.set(50,20,0);
            object.castShadow = true;
            scene.add( object );
        }
    );

}


function initModel() {
    //辅助工具
    let helper = new AxesHelper(10);
    scene.add(helper);
    // 创建一个立方体
    //立方体
    let cubeGeometry = new Geometry();
    //创建立方体的顶点
    let vertices = [
        new Vector3(100, 100, 100),
        new Vector3(-100, 100, 100),
        new Vector3(-100, -100, 100),
        new Vector3(100, -100, 100),
        new Vector3(100, -100, -100),
        new Vector3(100, 100, -100),
        new Vector3(-100, 100, -100),
        new Vector3(-100, -100, -100)
        ];
    cubeGeometry.vertices = vertices;
    //创建立方的面
    let faces=[
        new Face3(0,1,2),
        new Face3(0,2,3),
        new Face3(0,3,4),
        new Face3(0,4,5),
        new Face3(1,6,7),
        new Face3(1,7,2),
        new Face3(6,5,4),
        new Face3(6,4,7),
        new Face3(5,6,1),
        new Face3(5,1,0),
        new Face3(3,2,7),
        new Face3(3,7,4)
    ];
    cubeGeometry.faces = faces;
    //生成法向量
    cubeGeometry.computeFaceNormals();

    let cubeMaterial = new MeshLambertMaterial({color: 'blue'});
    let cube = new Mesh(cubeGeometry, cubeMaterial);
    cube.position.x = 25;
    cube.position.y = 5;
    cube.position.z = -5;
    //告诉立方体需要投射阴影
    //cube.castShadow = true;
    scene.add(cube);
    //底部平面
    let planeGeometry = new PlaneGeometry(100, 100);
    let planeMaterial = new MeshLambertMaterial({color: 0xaaaaaa});
    let plane = new Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.y = -0;
    //告诉底部平面需要接收阴影
    plane.receiveShadow = true;
    scene.add(plane);
}

//绘制一条线
function line(){
    let geometry = new Geometry();
    //设置线条参数:{color,lineWidth,lineCap,lineJoin,vertexColors,fog}
    let material = new LineBasicMaterial({ vertexColors: true });

    let color1 = new Color('red');
    let color2 = new Color('yellow');

    //生成一个点
    let point1 = new Vector3();
    point1.set(0, 0, 0);

    let point2 = new Vector3();
    point2.set(10, 10, 0);

    //geometry.vertices用来存放将要渲染的点
    geometry.vertices.push(point1);
    geometry.vertices.push(point2);

    geometry.colors.push(color1,color2);
    let line = new Line(geometry,material,LineSegments);
    scene.add(line);
}

//绘制网格
function grid(){
    let geometry = new Geometry();

    let point1 = new Vector3(-1000,1000,0);
    let point2 = new Vector3(-1000,-1000,0);
    geometry.vertices.push(point1);
    geometry.vertices.push(point2);
    let material = new LineBasicMaterial({color:'black'});


    for(let i =0;i<1000;i++){
        let line = new Line(geometry,material);
        line.position.x = (i * 50) - 1000;
        scene.add(line);
        line = new Line(geometry,material);
        line.rotation.z = 90 * Math.PI / 180;
        line.position.y = (i * 45) - 1000;
        scene.add(line);
    }

}


//绘制三角形
function triangle(){
    let shape = new Shape();
    shape.moveTo(0,100);

    shape.lineTo(0,0);
    shape.lineTo(100,0);
    shape.lineTo(0,100);

    let geometry = new ShapeGeometry(shape);
    let material = new MeshBasicMaterial({color:'red',side:DoubleSide});

    let mesh = new Mesh(geometry,material);



    scene.add(mesh)
}




function render(){
    requestAnimationFrame(render);
    trackBallControls.update();
    //render方法用来将场景和相机渲染到画布上
    renderer.render(scene, camera);
}

//initModel();
cube();
wall();
render();



/*
function init() {
    var renderer = new WebGLRenderer({
        canvas: document.querySelector('canvas'),
        antialias : true
    });
    renderer.setClearColor(0x000000);
    var scene = new Scene();


    // camera
    var camera = new PerspectiveCamera(45, window.innerWidth/window.innerHeight, 20, 8000);
    camera.position.set(25, 25, 25);
    camera.lookAt(new Vector3(0, 0, 0));
    scene.add(camera);


    // light
    var light = new PointLight(0xffffff, 1, 100);
    light.position.set(10, 15, 5);
    scene.add(light);


    var material = new MeshLambertMaterial({
        color: 0xffff00,
        emissive: 0xff0000
    });

    var cube = new Mesh(new CubeGeometry(5, 5, 5), material);
    scene.add(cube);

//            var sphere = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 8), material);
//            scene.add(sphere);

    renderer.render(scene, camera);
}
init()*/
