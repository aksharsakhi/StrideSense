import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, RotateCcw, Compass, Sparkles, Layers } from 'lucide-react';

export default function Viewport3D({ sample, showFootModel = true }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const footGroupRef = useRef(null);
  const fsrPadsRef = useRef({});
  const fsrLightsRef = useRef({});
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const ghostFootRef = useRef(null);

  const [cameraView, setCameraView] = useState('perspective'); // 'perspective' | 'top' | 'side'

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.15);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(2.4, 2.5, 3.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below ground
    controls.minDistance = 1.2;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0.4, 0.1);
    controlsRef.current = controls;

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(3, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.8);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Sci-Fi Ground Grid
    const gridHelper = new THREE.GridHelper(10, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ground Plane for Shadow & Subtle Reflection
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060910,
      roughness: 0.85,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Foot & Insole Hierarchy Group
    const footGroup = new THREE.Group();
    footGroupRef.current = footGroup;
    scene.add(footGroup);

    // Build 3D Insole Shape (Anatomical Left Foot)
    const shape = new THREE.Shape();
    // Calcaneus Heel arc
    shape.moveTo(0.0, -0.95);
    shape.bezierCurveTo(0.35, -0.95, 0.38, -0.6, 0.36, -0.3); // Lateral heel
    shape.bezierCurveTo(0.34, -0.1, 0.32, 0.2, 0.48, 0.65);   // Lateral arch outward to 5th MT
    shape.bezierCurveTo(0.52, 0.85, 0.45, 1.1, 0.25, 1.25);   // 5th to lateral toes
    shape.bezierCurveTo(0.05, 1.35, -0.15, 1.35, -0.32, 1.15); // Big toe curvature
    shape.bezierCurveTo(-0.45, 0.95, -0.42, 0.65, -0.35, 0.45); // 1st metatarsal
    shape.bezierCurveTo(-0.24, 0.1, -0.22, -0.3, -0.32, -0.65); // Medial arch taper
    shape.bezierCurveTo(-0.35, -0.85, -0.25, -0.95, 0.0, -0.95); // Medial heel back to base

    const extrudeSettings = {
      steps: 1,
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 4
    };

    const insoleGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    insoleGeo.rotateX(-Math.PI / 2); // Lay flat on X-Z plane
    insoleGeo.translate(0, 0.02, 0);

    const insoleMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
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
    footGroup.add(insoleMesh);

    // Glowing Insole Edge Wire
    const edgeGeo = new THREE.EdgesGeometry(insoleGeo, 24);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    footGroup.add(edgeLines);

    // Pressure Sensors (Dual Square FSR Pads - Matching Physical Kit)
    const fsrConfigs = [
      { id: 'p1', name: 'Square Heel FSR (P1)', x: 0.02, z: -0.65, w: 0.36, h: 0.36 },
      { id: 'p2', name: 'Square Forefoot FSR (P2)', x: 0.02, z: 0.72, w: 0.42, h: 0.42 },
    ];

    const pads = {};
    const lights = {};

    fsrConfigs.forEach(cfg => {
      // Square FSR sensor pad on top of insole
      const padGeo = new THREE.BoxGeometry(cfg.w, 0.015, cfg.h);

      const padMat = new THREE.MeshStandardMaterial({
        color: 0x09101d,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.1,
        roughness: 0.3,
        metalness: 0.8
      });

      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.position.set(cfg.x, 0.055, cfg.z);
      padMesh.castShadow = true;
      footGroup.add(padMesh);
      pads[cfg.id] = padMesh;

      // Contact Point Light
      const pLight = new THREE.PointLight(0x06b6d4, 0.0, 1.4);
      pLight.position.set(cfg.x, 0.14, cfg.z);
      footGroup.add(pLight);
      lights[cfg.id] = pLight;

      // Target border wire outline
      const wireGeo = new THREE.EdgesGeometry(padGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.set(cfg.x, 0.058, cfg.z);
      footGroup.add(wire);
    });

    fsrPadsRef.current = pads;
    fsrLightsRef.current = lights;

    // Ghost Biomechanical Foot Model (Skeleton/Joint Assembly)
    const ghostGroup = new THREE.Group();
    ghostFootRef.current = ghostGroup;
    footGroup.add(ghostGroup);

    // Lower Leg / Tibia segment
    const tibiaGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 16);
    const tibiaMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const tibia = new THREE.Mesh(tibiaGeo, tibiaMat);
    tibia.position.set(-0.02, 0.55, -0.45);
    ghostGroup.add(tibia);

    // Ankle joint sphere
    const ankleGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const ankleMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const ankle = new THREE.Mesh(ankleGeo, ankleMat);
    ankle.position.set(-0.02, 0.18, -0.45);
    ghostGroup.add(ankle);

    // Dorsum Arch bridge to forefoot
    const archCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.02, 0.18, -0.45),
      new THREE.Vector3(0.0, 0.28, 0.2),
      new THREE.Vector3(0.02, 0.1, 0.8)
    );
    const archGeo = new THREE.TubeGeometry(archCurve, 20, 0.045, 8, false);
    const archMesh = new THREE.Mesh(archGeo, tibiaMat);
    ghostGroup.add(archMesh);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
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

  // Update FSR Contact Glow & Foot Attitude dynamically when sample changes
  useEffect(() => {
    if (!sample) return;

    // Attitude articulation (Pitch & Roll & Vertical Clearance)
    if (footGroupRef.current) {
      const pitchRad = ((sample.pitch || 0) * Math.PI) / 180;
      const rollRad = ((sample.roll || 0) * Math.PI) / 180;
      
      footGroupRef.current.rotation.x = pitchRad;
      footGroupRef.current.rotation.z = rollRad;
      footGroupRef.current.position.y = Math.max(0, sample.lift || 0);
    }

    // Toggle Ghost Foot visibility
    if (ghostFootRef.current) {
      ghostFootRef.current.visible = showFootModel;
    }

    // Dynamic FSR Contact Glow Heatmap
    const pads = fsrPadsRef.current;
    const lights = fsrLightsRef.current;

    const sensorValues = {
      p1: sample.p1 || 0,
      p2: sample.p2 || sample.p5 || 0,
    };

    Object.entries(sensorValues).forEach(([id, val]) => {
      const pad = pads[id];
      const light = lights[id];
      if (!pad || !light) return;

      const norm = Math.min(1.0, val / 3800); // 0.0 to 1.0

      if (norm < 0.05) {
        pad.material.emissive.setHex(0x09101d);
        pad.material.emissiveIntensity = 0.1;
        light.intensity = 0;
      } else if (norm < 0.45) {
        // Cyan / Blue contact
        pad.material.emissive.setHex(0x06b6d4);
        pad.material.emissiveIntensity = norm * 2.0;
        light.color.setHex(0x06b6d4);
        light.intensity = norm * 2.5;
      } else if (norm < 0.75) {
        // Vibrant Emerald / Lime high contact
        pad.material.emissive.setHex(0x10b981);
        pad.material.emissiveIntensity = norm * 3.0;
        light.color.setHex(0x10b981);
        light.intensity = norm * 3.5;
      } else {
        // Intense Crimson / Amber peak impact shock
        pad.material.emissive.setHex(0xef4444);
        pad.material.emissiveIntensity = norm * 4.5;
        light.color.setHex(0xef4444);
        light.intensity = norm * 5.0;
      }
    });
  }, [sample, showFootModel]);

  // Camera presets
  const setCameraPreset = (preset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraView(preset);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'top') {
      cam.position.set(0, 4.2, 0.1);
      ctrl.target.set(0, 0, 0.1);
    } else if (preset === 'side') {
      cam.position.set(4.0, 0.6, 0.1);
      ctrl.target.set(0, 0.2, 0.1);
    } else {
      cam.position.set(2.4, 2.5, 3.2);
      ctrl.target.set(0, 0.4, 0.1);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-[#090d16]">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Viewport Floating Controls */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs font-mono">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="text-cyan-400 font-semibold tracking-wider">3D KINEMATICS ACTIVE</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">50 Hz WebGL</span>
      </div>

      {/* Camera View Switcher */}
      <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-lg text-xs">
        <button
          onClick={() => setCameraPreset('perspective')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            cameraView === 'perspective'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
        >
          Perspective
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            cameraView === 'top'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
        >
          Top View
        </button>
        <button
          onClick={() => setCameraPreset('side')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            cameraView === 'side'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
        >
          Side Arch
        </button>
      </div>

      {/* Floating HUD Foot Pitch / Roll Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-cyan-500/20 shadow-xl font-mono text-xs text-slate-300 space-y-1">
        <div className="text-[11px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          ORIENTATION ATTITUDE
        </div>
        <div className="flex gap-4">
          <div>
            <span className="text-slate-500 text-[10px] block">PITCH</span>
            <span className={`font-semibold ${Math.abs(sample?.pitch || 0) > 30 ? 'text-amber-400' : 'text-slate-100'}`}>
              {(sample?.pitch || 0).toFixed(1)}°
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">ROLL (EVERSION)</span>
            <span className={`font-semibold ${Math.abs(sample?.roll || 0) > 12 ? 'text-amber-400' : 'text-slate-100'}`}>
              {(sample?.roll || 0).toFixed(1)}°
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">VERTICAL LIFT</span>
            <span className="font-semibold text-emerald-400">
              {((sample?.lift || 0) * 100).toFixed(1)} cm
            </span>
          </div>
        </div>
      </div>

      {/* 3D Orbit Helper Hint */}
      <div className="absolute bottom-4 right-4 text-[11px] font-mono text-slate-500 bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800 pointer-events-none">
        Left-Click Drag: Rotate • Scroll: Zoom • Right-Click: Pan
      </div>
    </div>
  );
}
