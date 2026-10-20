import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Compass, Footprints, ShieldCheck, Activity } from 'lucide-react';

export default function Viewport3D({ sample, showFootModel = true }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const leftFootGroupRef = useRef(null);
  const rightFootGroupRef = useRef(null);
  const leftPadsRef = useRef({});
  const rightPadsRef = useRef({});
  const leftLightsRef = useRef({});
  const rightLightsRef = useRef({});
  const ghostLeftRef = useRef(null);
  const ghostRightRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  const [cameraView, setCameraView] = useState('perspective'); // 'perspective' | 'top' | 'side'

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.12);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0.0, 3.2, 4.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.4;
    controls.maxDistance = 10.0;
    controls.target.set(0, 0.35, 0.0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight.position.set(4, 9, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.9);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Sci-Fi Ground Grid
    const gridHelper = new THREE.GridHelper(12, 48, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ground Plane for Shadow & Reflection
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060910,
      roughness: 0.85,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ─── BILATERAL INSOLE GENERATOR ───
    function buildInsole(isRight = false) {
      const group = new THREE.Group();
      const mirror = isRight ? -1 : 1;

      const shape = new THREE.Shape();
      shape.moveTo(0.0, -0.95);
      shape.bezierCurveTo(0.35 * mirror, -0.95, 0.38 * mirror, -0.6, 0.36 * mirror, -0.3);
      shape.bezierCurveTo(0.34 * mirror, -0.1, 0.32 * mirror, 0.2, 0.48 * mirror, 0.65);
      shape.bezierCurveTo(0.52 * mirror, 0.85, 0.45 * mirror, 1.1, 0.25 * mirror, 1.25);
      shape.bezierCurveTo(0.05 * mirror, 1.35, -0.15 * mirror, 1.35, -0.32 * mirror, 1.15);
      shape.bezierCurveTo(-0.45 * mirror, 0.95, -0.42 * mirror, 0.65, -0.35 * mirror, 0.45);
      shape.bezierCurveTo(-0.24 * mirror, 0.1, -0.22 * mirror, -0.3, -0.32 * mirror, -0.65);
      shape.bezierCurveTo(-0.35 * mirror, -0.85, -0.25 * mirror, -0.95, 0.0, -0.95);

      const extrudeSettings = {
        steps: 1,
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 4
      };

      const insoleGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      insoleGeo.rotateX(-Math.PI / 2);
      insoleGeo.translate(0, 0.02, 0);

      const insoleMat = new THREE.MeshPhysicalMaterial({
        color: isRight ? 0x0f1f2e : 0x0f172a,
        metalness: 0.3,
        roughness: 0.2,
        transmission: 0.25,
        thickness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2
      });

      const insoleMesh = new THREE.Mesh(insoleGeo, insoleMat);
      insoleMesh.castShadow = true;
      insoleMesh.receiveShadow = true;
      group.add(insoleMesh);

      // Glowing outline
      const edgeGeo = new THREE.EdgesGeometry(insoleGeo, 24);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isRight ? 0x10b981 : 0x06b6d4,
        transparent: true,
        opacity: 0.7
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      group.add(edgeLines);

      // FSR Pads
      const fsrConfigs = [
        { id: 'p1', x: 0.02 * mirror, z: -0.65, w: 0.36, h: 0.36 },
        { id: 'p2', x: 0.02 * mirror, z: 0.72, w: 0.42, h: 0.42 }
      ];

      const pads = {};
      const lights = {};

      fsrConfigs.forEach(cfg => {
        const padGeo = new THREE.BoxGeometry(cfg.w, 0.015, cfg.h);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x09101d,
          emissive: isRight ? 0x10b981 : 0x06b6d4,
          emissiveIntensity: 0.1,
          roughness: 0.3,
          metalness: 0.8
        });

        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.set(cfg.x, 0.055, cfg.z);
        padMesh.castShadow = true;
        group.add(padMesh);
        pads[cfg.id] = padMesh;

        const pLight = new THREE.PointLight(isRight ? 0x10b981 : 0x06b6d4, 0.0, 1.4);
        pLight.position.set(cfg.x, 0.14, cfg.z);
        group.add(pLight);
        lights[cfg.id] = pLight;

        const wireGeo = new THREE.EdgesGeometry(padGeo);
        const wireMat = new THREE.LineBasicMaterial({
          color: isRight ? 0x34d399 : 0x38bdf8,
          transparent: true,
          opacity: 0.85
        });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        wire.position.set(cfg.x, 0.058, cfg.z);
        group.add(wire);
      });

      // Ghost biomechanical leg model
      const ghost = new THREE.Group();
      const tibiaGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 16);
      const tibiaMat = new THREE.MeshPhysicalMaterial({
        color: isRight ? 0x34d399 : 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const tibia = new THREE.Mesh(tibiaGeo, tibiaMat);
      tibia.position.set(-0.02 * mirror, 0.55, -0.45);
      ghost.add(tibia);

      const ankleGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const ankleMat = new THREE.MeshBasicMaterial({
        color: isRight ? 0x10b981 : 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const ankle = new THREE.Mesh(ankleGeo, ankleMat);
      ankle.position.set(-0.02 * mirror, 0.18, -0.45);
      ghost.add(ankle);

      group.add(ghost);

      return { group, pads, lights, ghost };
    }

    // Build Left Foot (Offset to -0.65)
    const leftBuild = buildInsole(false);
    leftBuild.group.position.x = -0.65;
    scene.add(leftBuild.group);
    leftFootGroupRef.current = leftBuild.group;
    leftPadsRef.current = leftBuild.pads;
    leftLightsRef.current = leftBuild.lights;
    ghostLeftRef.current = leftBuild.ghost;

    // Build Right Foot (Offset to +0.65)
    const rightBuild = buildInsole(true);
    rightBuild.group.position.x = 0.65;
    scene.add(rightBuild.group);
    rightFootGroupRef.current = rightBuild.group;
    rightPadsRef.current = rightBuild.pads;
    rightLightsRef.current = rightBuild.lights;
    ghostRightRef.current = rightBuild.ghost;

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update FSR Contact Glow & Foot Attitudefor BOTH feet dynamically
  useEffect(() => {
    if (!sample) return;

    const leftData = sample.left || sample;
    const rightData = sample.right || sample;

    // Animate Left Foot Attitude
    if (leftFootGroupRef.current) {
      const pitchRad = ((leftData.pitch || 0) * Math.PI) / 180;
      const rollRad = ((leftData.roll || 0) * Math.PI) / 180;
      leftFootGroupRef.current.rotation.x = pitchRad;
      leftFootGroupRef.current.rotation.z = rollRad;
      leftFootGroupRef.current.position.y = Math.max(0, leftData.lift || 0);
    }

    // Animate Right Foot Attitude
    if (rightFootGroupRef.current) {
      const pitchRad = ((rightData.pitch || 0) * Math.PI) / 180;
      const rollRad = ((rightData.roll || 0) * Math.PI) / 180;
      rightFootGroupRef.current.rotation.x = pitchRad;
      rightFootGroupRef.current.rotation.z = rollRad;
      rightFootGroupRef.current.position.y = Math.max(0, rightData.lift || 0);
    }

    // Toggle ghost skeleton visibility
    if (ghostLeftRef.current) ghostLeftRef.current.visible = showFootModel;
    if (ghostRightRef.current) ghostRightRef.current.visible = showFootModel;

    // Helper to update pad glow
    const updatePadHeat = (pads, lights, p1Val, p2Val, isRight = false) => {
      const vals = { p1: p1Val, p2: p2Val };
      Object.entries(vals).forEach(([id, val]) => {
        const pad = pads[id];
        const light = lights[id];
        if (!pad || !light) return;

        const norm = Math.min(1.0, val / 3800);
        if (norm < 0.05) {
          pad.material.emissive.setHex(0x09101d);
          pad.material.emissiveIntensity = 0.1;
          light.intensity = 0;
        } else if (norm < 0.45) {
          const colorHex = isRight ? 0x10b981 : 0x06b6d4;
          pad.material.emissive.setHex(colorHex);
          pad.material.emissiveIntensity = norm * 2.2;
          light.color.setHex(colorHex);
          light.intensity = norm * 2.8;
        } else if (norm < 0.75) {
          pad.material.emissive.setHex(0xf59e0b);
          pad.material.emissiveIntensity = norm * 3.2;
          light.color.setHex(0xf59e0b);
          light.intensity = norm * 3.5;
        } else {
          pad.material.emissive.setHex(0xef4444);
          pad.material.emissiveIntensity = norm * 4.5;
          light.color.setHex(0xef4444);
          light.intensity = norm * 5.0;
        }
      });
    };

    updatePadHeat(leftPadsRef.current, leftLightsRef.current, leftData.p1 || 0, leftData.p2 || 0, false);
    updatePadHeat(rightPadsRef.current, rightLightsRef.current, rightData.p1 || 0, rightData.p2 || 0, true);
  }, [sample, showFootModel]);

  const setCameraPreset = (preset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraView(preset);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'top') {
      cam.position.set(0, 4.4, 0.1);
      ctrl.target.set(0, 0, 0.1);
    } else if (preset === 'side') {
      cam.position.set(4.5, 0.8, 0.1);
      ctrl.target.set(0, 0.2, 0.1);
    } else {
      cam.position.set(0.0, 3.2, 4.2);
      ctrl.target.set(0, 0.35, 0.0);
    }
  };

  const leftData = sample?.left || sample || {};
  const rightData = sample?.right || sample || {};
  const bilateral = sample?.bilateral || { symmetryIndex: 98.0, weightDistribution: { leftPct: 50, rightPct: 50 } };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-[#090d16]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Status Badge */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs font-mono">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-400 font-semibold tracking-wider">BILATERAL 3D KINEMATICS</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">Left & Right Antiphase</span>
      </div>

      {/* Camera View Switcher */}
      <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-lg text-xs">
        {['perspective', 'top', 'side'].map((p) => (
          <button
            key={p}
            onClick={() => setCameraPreset(p)}
            className={`px-2.5 py-1 rounded font-medium capitalize transition-all ${
              cameraView === p
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Floating Bilateral Attitude HUD */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-cyan-500/25 shadow-xl font-mono text-xs text-slate-300 space-y-2">
        <div className="text-[11px] font-bold text-cyan-400 tracking-wider flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-cyan-400" />
            DUAL-LEG BIOMECHANICAL GAIT
          </span>
          <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {bilateral.symmetryIndex}% Symmetry
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-800">
          {/* Left Foot */}
          <div className="bg-slate-950/60 p-2 rounded-lg border border-cyan-500/20">
            <div className="text-cyan-400 font-bold text-[10px] flex justify-between">
              <span>LEFT INSOLE</span>
              <span className="text-slate-400">{bilateral.weightDistribution?.leftPct || 50}% Load</span>
            </div>
            <div className="text-slate-400 text-[10px] mt-0.5 truncate">{leftData.phase || 'Stance'}</div>
            <div className="flex gap-2 mt-1 text-[10px]">
              <span>P: <strong className="text-white">{(leftData.pitch || 0).toFixed(0)}°</strong></span>
              <span>R: <strong className="text-white">{(leftData.roll || 0).toFixed(0)}°</strong></span>
              <span>H:<strong className="text-cyan-300">{leftData.p1 || 0}</strong></span>
              <span>F:<strong className="text-cyan-300">{leftData.p2 || 0}</strong></span>
            </div>
          </div>

          {/* Right Foot */}
          <div className="bg-slate-950/60 p-2 rounded-lg border border-emerald-500/20">
            <div className="text-emerald-400 font-bold text-[10px] flex justify-between">
              <span>RIGHT INSOLE</span>
              <span className="text-slate-400">{bilateral.weightDistribution?.rightPct || 50}% Load</span>
            </div>
            <div className="text-slate-400 text-[10px] mt-0.5 truncate">{rightData.phase || 'Swing'}</div>
            <div className="flex gap-2 mt-1 text-[10px]">
              <span>P: <strong className="text-white">{(rightData.pitch || 0).toFixed(0)}°</strong></span>
              <span>R: <strong className="text-white">{(rightData.roll || 0).toFixed(0)}°</strong></span>
              <span>H:<strong className="text-emerald-300">{rightData.p1 || 0}</strong></span>
              <span>F:<strong className="text-emerald-300">{rightData.p2 || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-[11px] font-mono text-slate-500 bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800 pointer-events-none">
        Left-Click Drag: Orbit • Scroll: Zoom • Right-Click: Pan
      </div>
    </div>
  );
}
