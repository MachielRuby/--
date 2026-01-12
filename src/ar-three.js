import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. 暴露 THREE 到全局，供 AR.js 使用
window.THREE = THREE;

// 2. 动态加载 AR.js 库
const script = document.createElement('script');
// 使用专门为 Three.js 构建的 AR.js 版本
script.src = 'https://raw.githack.com/AR-js-org/AR.js/master/three.js/build/ar-threex.js';
script.onload = init;
document.body.appendChild(script);

function init() {
    document.getElementById('loading').style.display = 'none';

    // --- 初始化 Three.js 场景 ---
    const scene = new THREE.Scene();
    
    const camera = new THREE.Camera();
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true // 关键：允许背景透明以显示摄像头视频
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    document.body.appendChild(renderer.domElement);

    // --- 初始化 AR.js ---
    // 1. ArToolkitSource: 处理摄像头
    const arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });

    arToolkitSource.init(function onReady() {
        onResize();
    });

    // 处理窗口大小调整
    window.addEventListener('resize', function() {
        onResize();
    });

    function onResize() {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) {
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
        }
    }

    // 2. ArToolkitContext: 处理 AR 计算
    const arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://raw.githack.com/AR-js-org/AR.js/master/data/data/camera_para.dat',
        detectionMode: 'mono',
    });

    arToolkitContext.init(function onCompleted() {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // 3. ArMarkerControls: 处理标记 (Hiro)
    const markerRoot = new THREE.Group();
    scene.add(markerRoot);

    new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: 'https://raw.githack.com/AR-js-org/AR.js/master/data/data/patt.hiro',
    });

    // --- 在标记上添加内容 ---
    
    // 添加灯光 (不然模型是黑的)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 1, 0); // 垂直向下照射
    scene.add(directionalLight);

    // 加载宇航员模型
    const loader = new GLTFLoader();
    loader.load(
        'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        function (gltf) {
            const model = gltf.scene;
            // 调整模型大小和位置以适应 AR 标记
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(0, 0, 0); // 在标记中心
            markerRoot.add(model);
            
            // 简单的自转动画
            function animateModel() {
                requestAnimationFrame(animateModel);
                model.rotation.y += 0.01;
            }
            animateModel();
        },
        undefined,
        function (error) {
            console.error('模型加载失败:', error);
        }
    );

    // --- 渲染循环 ---
    function animate() {
        requestAnimationFrame(animate);

        // 更新 AR 上下文（关键步骤）
        if (arToolkitSource.ready !== false) {
            arToolkitContext.update(arToolkitSource.domElement);
        }

        // 只有当标记可见时才渲染（可选，但通常可以一直渲染）
        // if (markerRoot.visible) {
            renderer.render(scene, camera);
        // }
    }
    animate();
}