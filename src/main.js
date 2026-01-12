import './style.css'
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import '@google/model-viewer';

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建正方体
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 添加灯光（为了 MeshStandardMaterial 显示颜色）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
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
  // 导出 GLB
  const exporter = new GLTFExporter();
  exporter.parse(
    scene,
    function (result) {
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
    },
    { binary: true } // 导出为 GLB 二进制格式
  );
});
