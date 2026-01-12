import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import '@google/model-viewer';

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2; // 调整相机距离，宇航员模型比较小

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 全局变量存储加载的模型
let loadedModel = null;

// 加载模型 (Astronaut.glb)
const loader = new GLTFLoader();
loader.load(
  'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  function (gltf) {
    loadedModel = gltf.scene;
    // 调整模型位置和大小
    loadedModel.position.y = -1;
    scene.add(loadedModel);
  },
  undefined,
  function (error) {
    console.error('模型加载失败:', error);
  }
);

// 添加灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  // 如果模型已加载，让它旋转
  if (loadedModel) {
    loadedModel.rotation.y += 0.005;
  }
  
  renderer.render(scene, camera);
}
animate();

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// AR 按钮逻辑
const arButton = document.getElementById('ar-button');
const modelViewer = document.getElementById('model-viewer');

arButton.addEventListener('click', async () => {
  if (!loadedModel) {
    console.warn('模型尚未加载');
    return;
  }

  arButton.textContent = "正在生成 AR 模型...";
  arButton.disabled = true;

  // 1. 保存原始状态
  const originalPosition = loadedModel.position.clone();
  const originalRotation = loadedModel.rotation.clone();

  try {
    // 2. 重置状态以便导出
    // 先重置旋转，确保包围盒计算准确
    loadedModel.rotation.set(0, 0, 0);
    loadedModel.position.set(0, 0, 0);
    
    // 更新矩阵
    loadedModel.updateMatrixWorld(true);
    
    // 计算包围盒，确保模型底部贴合地面
    const box = new THREE.Box3().setFromObject(loadedModel);
    const yOffset = -box.min.y; // 计算底部到 0 的偏移量
    loadedModel.position.y = yOffset;
    
    // 更新矩阵以应用新的位置
    loadedModel.updateMatrixWorld(true);

    // 3. 并行导出 GLB (Android) 和 USDZ (iOS)
    const gltfPromise = new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        loadedModel,
        (result) => resolve(result),
        (err) => reject(err),
        { binary: true }
      );
    });

    const usdzPromise = new USDZExporter().parse(loadedModel);

    const [gltfResult, usdzResult] = await Promise.all([gltfPromise, usdzPromise]);

    // 4. 处理 GLB (Android)
    const glbBlob = new Blob([gltfResult], { type: 'application/octet-stream' });
    const glbUrl = URL.createObjectURL(glbBlob);
    modelViewer.src = glbUrl;

    // 5. 处理 USDZ (iOS)
    const usdzBlob = new Blob([usdzResult], { type: 'application/octet-stream' });
    const usdzUrl = URL.createObjectURL(usdzBlob);
    modelViewer.iosSrc = usdzUrl;

    // 6. 激活 AR
    modelViewer.style.display = 'block';
    
    if (modelViewer.canActivateAR) {
      modelViewer.activateAR();
    } else {
      console.log("当前设备不支持 AR 或 model-viewer 未准备好");
      alert("AR 模式已就绪，但您的设备可能不支持直接唤起。");
    }

  } catch (error) {
    console.error('导出模型失败:', error);
    alert('生成 AR 模型失败，请重试');
  } finally {
    // 7. 恢复原始状态
    loadedModel.position.copy(originalPosition);
    loadedModel.rotation.copy(originalRotation);
    
    arButton.textContent = "开启 AR";
    arButton.disabled = false;
  }
});
