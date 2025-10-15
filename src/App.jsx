import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import { clamp } from './utils/math.js';

const placeholderCopy = {
  heroHeadline: 'Robotics Showcase Placeholder',
  heroSub: 'Dynamic visuals, interactive models, and story-driven scroll — ready for your content.',
  heroCtas: ['View Sim Pad', 'Book a Demo'],
  sections: {
    model: {
      title: 'Interactive Model Sandbox',
      body: 'Swap in your CAD/GLB to show off hotspots, toggles, and motion presets. Everything here is a placeholder.'
    },
    ik: {
      title: 'Inverse Kinematics Playground',
      body: 'Drag the target to pose a simple 3-joint arm. Tune segment lengths and solver iterations to feel the interactions.'
    },
    story: {
      title: 'Scroll Storytelling',
      body: 'As viewers move through the narrative, visuals evolve and data panels update. Replace copy, colors, and models with your own assets.'
    }
  }
};

function addBasicLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(6, 8, 6);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.25);
  fill.position.set(-6, -4, -8);
  scene.add(fill);
}

function HeroCanvas({ motionDisabled }) {
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.6, 2.6, 3.6);

    addBasicLights(scene);

    const heroMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshStandardMaterial({ color: '#73f3ff', metalness: 0.4, roughness: 0.35 })
    );
    heroMesh.castShadow = true;
    heroMesh.receiveShadow = true;
    scene.add(heroMesh);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: '#0e1a25' }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.autoRotate = !motionDisabled;
    controls.autoRotateSpeed = 0.6;

    controlsRef.current = controls;

    const clock = new THREE.Clock();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      if (!motionDisabled) {
        heroMesh.rotation.x += delta * 0.3;
        heroMesh.rotation.y += delta * 0.24;
        heroMesh.position.y = Math.sin(elapsed * 1.2) * 0.2;
        controls.autoRotate = true;
      } else {
        heroMesh.rotation.x = 0;
        heroMesh.rotation.y = 0;
        heroMesh.position.y = 0;
        controls.autoRotate = false;
      }
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      heroMesh.geometry.dispose();
      heroMesh.material.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
    };
  }, [motionDisabled]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !motionDisabled;
    }
  }, [motionDisabled]);

  return <canvas ref={canvasRef} className="three-surface" aria-hidden />;
}

const hotspots = [
  {
    id: 'vision',
    label: 'Vision Stack',
    description: 'Placeholder copy for cameras, depth sensors, and perception modules.',
    position: new THREE.Vector3(0.4, 1.1, 0.6)
  },
  {
    id: 'compute',
    label: 'Compute Bay',
    description: 'Swap with thermal renders, BOM details, or spec sheets.',
    position: new THREE.Vector3(-0.6, 0.6, 0.2)
  },
  {
    id: 'battery',
    label: 'Power System',
    description: 'Show pack layout, quick-swap animations, or safety callouts.',
    position: new THREE.Vector3(0.2, 0.35, -0.8)
  }
];

function buildRobot() {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#0f3c5c', metalness: 0.45, roughness: 0.35 });
  const topMaterial = new THREE.MeshStandardMaterial({ color: '#73f3ff', metalness: 0.3, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.2), bodyMaterial);
  body.position.set(0, 0.6, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.4, 32), bodyMaterial.clone());
  mast.position.set(0, 1.8, 0);
  mast.castShadow = true;
  group.add(mast);

  const sensor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.4), topMaterial);
  sensor.position.set(0, 2.4, 0.4);
  group.add(sensor);

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 48), new THREE.MeshStandardMaterial({ color: '#0b1621' }));
  deck.position.set(0, 0.05, 0);
  deck.receiveShadow = true;
  group.add(deck);

  const wireframe = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.8, 1.2),
    new THREE.MeshBasicMaterial({ color: '#8bd8ff', wireframe: true })
  );
  group.add(wireframe);

  return { group, wireframe };
}

function ModelCanvas({ wireframe, activeHotspot, onHotspotSelect }) {
  const canvasRef = useRef(null);
  const resourcesRef = useRef({});
  const callbackRef = useRef(onHotspotSelect);

  useEffect(() => {
    callbackRef.current = onHotspotSelect;
  }, [onHotspotSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(3, 2.8, 4.2);

    addBasicLights(scene);

    const { group, wireframe: wireframeMesh } = buildRobot();
    scene.add(group);
    wireframeMesh.visible = wireframe;

    const hotspotMeshes = hotspots.map((hotspot) => {
      const material = new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        emissive: '#0a1b27',
        emissiveIntensity: 0.4,
        metalness: 0.1,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 18), material);
      mesh.position.copy(hotspot.position);
      mesh.userData.id = hotspot.id;
      group.add(mesh);
      return mesh;
    });

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setPointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (event) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(hotspotMeshes, false);
      canvas.style.cursor = intersections.length > 0 ? 'pointer' : '';
    };

    const handlePointerDown = (event) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(hotspotMeshes, false);
      if (intersections.length > 0) {
        const id = intersections[0].object.userData.id;
        callbackRef.current(id);
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);

    const clock = new THREE.Clock();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      resourcesRef.current.animationFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    resourcesRef.current = {
      animationFrame: 0,
      renderer,
      controls,
      wireframeMesh,
      hotspotMeshes,
      cleanup: () => {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(resourcesRef.current.animationFrame);
        controls.dispose();
        renderer.dispose();
        canvas.style.cursor = '';
        group.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            object.material.dispose?.();
          }
        });
      }
    };

    return () => {
      resourcesRef.current.cleanup?.();
      resourcesRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (resourcesRef.current.wireframeMesh) {
      resourcesRef.current.wireframeMesh.visible = wireframe;
    }
  }, [wireframe]);

  useEffect(() => {
    if (!resourcesRef.current.hotspotMeshes) return;
    resourcesRef.current.hotspotMeshes.forEach((mesh) => {
      const isActive = mesh.userData.id === activeHotspot;
      mesh.material.color.set(isActive ? '#73f3ff' : '#f1f5f9');
      mesh.material.emissive.set(isActive ? '#1b9cd6' : '#0a1b27');
      mesh.material.emissiveIntensity = isActive ? 0.8 : 0.4;
      mesh.scale.setScalar(isActive ? 1.6 : 1);
    });
  }, [activeHotspot]);

  return <canvas ref={canvasRef} className="three-surface" role="presentation" />;
}

const armLengths = [120, 100, 80];
const basePosition = { x: 200, y: 260 };

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fabrik(target, base, lengths, { tolerance = 0.6, maxIterations = 25 } = {}) {
  const joints = new Array(lengths.length + 1);
  joints[0] = { ...base };
  for (let i = 0; i < lengths.length; i += 1) {
    joints[i + 1] = { x: joints[i].x + lengths[i], y: joints[i].y };
  }

  const totalLength = lengths.reduce((sum, len) => sum + len, 0);
  const targetDistance = distance(base, target);

  if (targetDistance >= totalLength) {
    const dirX = (target.x - base.x) / targetDistance;
    const dirY = (target.y - base.y) / targetDistance;
    for (let i = 0; i < lengths.length; i += 1) {
      joints[i + 1] = {
        x: joints[i].x + dirX * lengths[i],
        y: joints[i].y + dirY * lengths[i]
      };
    }
    return joints;
  }

  const baseCopy = { ...base };
  let diff = distance(joints[joints.length - 1], target);
  let iterations = 0;

  while (diff > tolerance && iterations < maxIterations) {
    iterations += 1;
    joints[joints.length - 1] = { ...target };
    for (let i = joints.length - 2; i >= 0; i -= 1) {
      const r = distance(joints[i + 1], joints[i]);
      const lambda = lengths[i] / r;
      joints[i] = {
        x: (1 - lambda) * joints[i + 1].x + lambda * joints[i].x,
        y: (1 - lambda) * joints[i + 1].y + lambda * joints[i].y
      };
    }

    joints[0] = { ...baseCopy };

    for (let i = 0; i < lengths.length; i += 1) {
      const r = distance(joints[i + 1], joints[i]);
      const lambda = lengths[i] / r;
      joints[i + 1] = {
        x: (1 - lambda) * joints[i].x + lambda * joints[i + 1].x,
        y: (1 - lambda) * joints[i].y + lambda * joints[i + 1].y
      };
    }

    diff = distance(joints[joints.length - 1], target);
  }

  return joints;
}

function IKPlayground() {
  const [target, setTarget] = useState({ x: 360, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [iterations, setIterations] = useState(18);
  const [tolerance, setTolerance] = useState(0.8);

  const solvedJoints = useMemo(
    () =>
      fabrik(target, basePosition, armLengths, {
        maxIterations: iterations,
        tolerance
      }),
    [target, iterations, tolerance]
  );

  const handlePointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clamp(event.clientX - bounds.left, 40, bounds.width - 40);
    const y = clamp(event.clientY - bounds.top, 40, bounds.height - 40);
    setTarget({ x, y });
  };

  return (
    <section className="section" id="ik">
      <div className="section__intro">
        <p className="eyebrow">Placeholder Feature</p>
        <h2>{placeholderCopy.sections.ik.title}</h2>
        <p>{placeholderCopy.sections.ik.body}</p>
        <div className="control-grid">
          <label>
            Iterations
            <input
              type="range"
              min="4"
              max="40"
              value={iterations}
              onChange={(event) => setIterations(Number(event.target.value))}
            />
            <span>{iterations}</span>
          </label>
          <label>
            Tolerance
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={tolerance}
              onChange={(event) => setTolerance(Number(event.target.value))}
            />
            <span>{tolerance.toFixed(1)} px</span>
          </label>
        </div>
      </div>
      <div className="section__visual">
        <div
          className="ik-canvas"
          role="application"
          aria-label="Inverse kinematics playground"
          onPointerDown={(event) => {
            setIsDragging(true);
            handlePointer(event);
          }}
          onPointerMove={(event) => {
            if (isDragging) handlePointer(event);
          }}
          onPointerUp={() => setIsDragging(false)}
          onPointerLeave={() => setIsDragging(false)}
        >
          <svg viewBox="0 0 400 300" width="100%" height="100%">
            <defs>
              <linearGradient id="arm" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#73f3ff" />
                <stop offset="100%" stopColor="#0f3c5c" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="300" rx="16" fill="#0b1621" />
            <circle cx={target.x} cy={target.y} r={12} fill="#f6a1ff" />
            {solvedJoints.slice(0, -1).map((joint, index) => {
              const next = solvedJoints[index + 1];
              return (
                <g key={`segment-${index}`}>
                  <line
                    x1={joint.x}
                    y1={joint.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="url(#arm)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <circle cx={joint.x} cy={joint.y} r={8} fill="#122735" stroke="#73f3ff" strokeWidth="2" />
                </g>
              );
            })}
            <circle
              cx={solvedJoints[solvedJoints.length - 1].x}
              cy={solvedJoints[solvedJoints.length - 1].y}
              r={10}
              fill="#73f3ff"
              stroke="#122735"
              strokeWidth="3"
            />
            <circle cx={basePosition.x} cy={basePosition.y} r={12} fill="#122735" stroke="#73f3ff" strokeWidth="3" />
          </svg>
        </div>
      </div>
    </section>
  );
}

const storySteps = [
  {
    id: 'baseline',
    title: 'Prototype Baseline',
    body: 'Introduce the form factor, mission, or competition. Highlight the hero visual and core specs.'
  },
  {
    id: 'sensors',
    title: 'Sensors Come Alive',
    body: 'Show perception coverage with cones, overlays, or sample captures as the narrative scrolls forward.'
  },
  {
    id: 'autonomy',
    title: 'Autonomy in Motion',
    body: 'End with a route, mission stats, or a key metric callout. Drop in video or metrics here later.'
  }
];

function StoryCanvas({ activeStep, motionDisabled }) {
  const canvasRef = useRef(null);
  const resourcesRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(3, 2.6, 4);

    addBasicLights(scene);

    const { group } = buildRobot();
    group.position.y = 0.2;
    scene.add(group);

    const conesGroup = new THREE.Group();
    for (let i = 0; i < 10; i += 1) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 3.2, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: '#73f3ff', transparent: true, opacity: 0.2 })
      );
      cone.position.set(0, 0.7, 0);
      cone.rotation.y = (i / 10) * Math.PI * 2;
      conesGroup.add(cone);
    }
    group.add(conesGroup);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.42, 64),
      new THREE.MeshStandardMaterial({ color: '#f6a1ff', emissive: '#f6a1ff', emissiveIntensity: 0.6 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: '#0b1621' }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.35;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;

    const clock = new THREE.Clock();
    let animationFrame = 0;
    const targetRotation = { value: -0.2 };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (!motionDisabled) {
        group.rotation.y += delta * 0.3;
      }
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotation.value, 0.08);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    resourcesRef.current = {
      renderer,
      controls,
      group,
      conesGroup,
      ring,
      targetRotation,
      cleanup: () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', resize);
        controls.dispose();
        renderer.dispose();
        group.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            object.material.dispose?.();
          }
        });
        ring.geometry.dispose();
        ring.material.dispose();
        ground.geometry.dispose();
        ground.material.dispose();
      }
    };

    return () => {
      resourcesRef.current.cleanup?.();
      resourcesRef.current = {};
    };
  }, [motionDisabled]);

  useEffect(() => {
    if (!resourcesRef.current.targetRotation) return;
    resourcesRef.current.targetRotation.value = -0.2 + activeStep * 0.4;
    if (resourcesRef.current.conesGroup) {
      resourcesRef.current.conesGroup.visible = activeStep >= 1;
    }
    if (resourcesRef.current.ring) {
      resourcesRef.current.ring.visible = activeStep === 2;
    }
    if (resourcesRef.current.group?.children?.[0]?.material) {
      const palette = ['#0f3c5c', '#123d66', '#1c4a73'];
      resourcesRef.current.group.children[0].material.color.set(palette[activeStep]);
    }
  }, [activeStep]);

  return <canvas ref={canvasRef} className="three-surface" role="presentation" />;
}

function HeroSection() {
  const motionDisabled = useReducedMotion();
  return (
    <section className="hero" id="top">
      <div className="hero__content">
        <p className="eyebrow">Placeholder Launch</p>
        <h1>{placeholderCopy.heroHeadline}</h1>
        <p className="lead">{placeholderCopy.heroSub}</p>
        <div className="cta-row">
          {placeholderCopy.heroCtas.map((cta) => (
            <button key={cta} type="button" className="cta">
              {cta}
            </button>
          ))}
        </div>
      </div>
      <div className="hero__visual">
        <HeroCanvas motionDisabled={motionDisabled} />
      </div>
    </section>
  );
}

function ModelShowcase() {
  const [wireframe, setWireframe] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(hotspots[0].id);
  const activeHotspotData = hotspots.find((hotspot) => hotspot.id === activeHotspot) ?? hotspots[0];

  return (
    <section className="section" id="model">
      <div className="section__intro">
        <p className="eyebrow">Placeholder Feature</p>
        <h2>{placeholderCopy.sections.model.title}</h2>
        <p>{placeholderCopy.sections.model.body}</p>
        <div className="toggle-group" role="group" aria-label="Wireframe toggle">
          <label>
            <input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} /> Wireframe overlay
          </label>
        </div>
        <div className="hotspot-legend" role="tablist">
          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              className={`hotspot-chip ${activeHotspot === hotspot.id ? 'hotspot-chip--active' : ''}`}
              onClick={() => setActiveHotspot(hotspot.id)}
              role="tab"
              aria-selected={activeHotspot === hotspot.id}
            >
              {hotspot.label}
            </button>
          ))}
        </div>
        <div className="hotspot-description" role="status">
          {activeHotspotData.description}
        </div>
      </div>
      <div className="section__visual">
        <ModelCanvas
          wireframe={wireframe}
          activeHotspot={activeHotspot}
          onHotspotSelect={(id) => setActiveHotspot(id)}
        />
      </div>
    </section>
  );
}

function ScrollyStory() {
  const containerRef = useRef(null);
  const motionDisabled = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const steps = Array.from(container.querySelectorAll('[data-step]'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveStep(index);
          });
      },
      {
        root: null,
        threshold: 0.6
      }
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="story" id="story" ref={containerRef}>
      <div className="story__sticky">
        <StoryCanvas activeStep={activeStep} motionDisabled={motionDisabled} />
      </div>
      <div className="story__steps">
        {storySteps.map((step, index) => (
          <article key={step.id} className="story-step" data-step data-index={index}>
            <p className="eyebrow">Step {index + 1}</p>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <div className="story-step__card">
              <div className="story-step__metric">
                <span className="story-step__number">{`${index + 1}.0×`}</span>
                <span className="story-step__label">Placeholder Metric</span>
              </div>
              <p className="story-step__note">Swap in data stories, mission stats, or quotes here.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div>
        <h4>Ready to add your robotics story?</h4>
        <p>Replace this footer with contact forms, Calendly embeds, or press kits.</p>
      </div>
      <button type="button" className="cta">
        Placeholder CTA
      </button>
    </footer>
  );
}

function Navigation() {
  return (
    <header className="nav">
      <div className="nav__logo">Your Robotics Brand</div>
      <nav>
        <a href="#model">Model Sandbox</a>
        <a href="#ik">IK Playground</a>
        <a href="#story">Story</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}

function App() {
  return (
    <div className="app">
      <Navigation />
      <main>
        <HeroSection />
        <ModelShowcase />
        <IKPlayground />
        <ScrollyStory />
      </main>
      <Footer />
    </div>
  );
}

export default App;
