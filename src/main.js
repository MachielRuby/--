import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
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

arButton.addEventListener('click', () => {
  if (!loadedModel) {
    console.warn('模型尚未加载');
    return;
  }

  // 1. 保存原始状态
  const originalPosition = loadedModel.position.clone();
  const originalRotation = loadedModel.rotation.clone();

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

  // 导出 GLB
  const exporter = new GLTFExporter();
  exporter.parse(
    loadedModel, // 只导出模型本身，不导出整个场景（包含灯光等）
    function (result) {
      // 3. 恢复原始状态（无论成功失败都要恢复，但在回调里恢复更安全，或者用 finally）
      loadedModel.position.copy(originalPosition);
      loadedModel.rotation.copy(originalRotation);

      if (result instanceof ArrayBuffer) {
        const blob = new Blob([result], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        // 设置 model-viewer src
        modelViewer.src = url;
        modelViewer.style.display = 'block'; // 显示 model-viewer
        
        // 尝试激活 AR
        if (modelViewer.canActivateAR) {
             modelViewer.activateAR();
        } else {
            console.log("当前设备不支持 AR 或 model-viewer 未准备好");
            // 如果是在 PC 上调试，直接显示 model-viewer 查看模型
        }
      } else {
        console.error('GLTF 导出失败');
      }
    },
    function (error) {
      console.error('An error happened during parsing', error);
      // 出错也要恢复状态
      loadedModel.position.copy(originalPosition);
      loadedModel.rotation.copy(originalRotation);
    },
    { binary: true } // 导出为 GLB 二进制格式
  );
});
