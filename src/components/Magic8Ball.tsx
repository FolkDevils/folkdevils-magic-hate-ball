"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import gsap from "gsap";

// Define a custom interface for the GLTF result.
// Replaced 'any' with 'unknown' for asset extras.
interface GLTFResult {
  scene: THREE.Scene;
  scenes: THREE.Scene[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: { version: string; [key: string]: unknown };
}

const Magic8Ball: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null);
  const frameRef = useRef<number | null>(null);
  const ballRef = useRef<THREE.Object3D | null>(null); // Entire ball
  const dieRef = useRef<THREE.Object3D | null>(null);  // The die with the answer texture

  // Manual Orientation Controls: we only need the value.
  const [eulerX] = useState(75);
  const [eulerY] = useState(340);
  const [eulerZ] = useState(0);

  // State for the question input
  const [question, setQuestion] = useState("");

  // Loader helper functions with explicit types and annotated callbacks
  const loadModel = (url: string): Promise<GLTFResult> =>
    new Promise<GLTFResult>(
      (
        resolve: (result: GLTFResult) => void,
        reject: (reason: unknown) => void
      ) => {
        new GLTFLoader().load(
          url,
          (gltf: GLTFResult) => resolve(gltf),
          undefined,
          reject
        );
      }
    );

  const loadTexture = (url: string): Promise<THREE.Texture> =>
    new Promise<THREE.Texture>(
      (
        resolve: (texture: THREE.Texture) => void,
        reject: (reason: unknown) => void
      ) => {
        new THREE.TextureLoader().load(
          url,
          (texture: THREE.Texture) => resolve(texture),
          undefined,
          reject
        );
      }
    );

  const loadEnv = (url: string): Promise<THREE.Texture> =>
    new Promise<THREE.Texture>(
      (
        resolve: (texture: THREE.Texture) => void,
        reject: (reason: unknown) => void
      ) => {
        new RGBELoader().load(
          url,
          (texture: THREE.Texture) => resolve(texture),
          undefined,
          reject
        );
      }
    );

  // Hard-coded initial orientation for the die.
  const initialOrientation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(75),
      THREE.MathUtils.degToRad(55),
      THREE.MathUtils.degToRad(0)
    )
  );

  // Define valid orientations for the die.
  const validOrientations: THREE.Quaternion[] = [
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(75),
        THREE.MathUtils.degToRad(340),
        THREE.MathUtils.degToRad(0)
      )
    ),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(75),
        THREE.MathUtils.degToRad(55),
        THREE.MathUtils.degToRad(180)
      )
    ),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(75),
        THREE.MathUtils.degToRad(127),
        THREE.MathUtils.degToRad(180)
      )
    ),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(75),
        THREE.MathUtils.degToRad(198),
        THREE.MathUtils.degToRad(180)
      )
    ),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(75),
        THREE.MathUtils.degToRad(270),
        THREE.MathUtils.degToRad(180)
      )
    ),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(75),
        THREE.MathUtils.degToRad(340),
        THREE.MathUtils.degToRad(180)
      )
    ),
  ];

  // Update the die's orientation in real time based on manual controls.
  useEffect(() => {
    if (dieRef.current) {
      const newQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(eulerX),
          THREE.MathUtils.degToRad(eulerY),
          THREE.MathUtils.degToRad(eulerZ)
        )
      );
      dieRef.current.quaternion.copy(newQuat);
    }
  }, [eulerX, eulerY, eulerZ]);

  const initializeThree = async () => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 1.4);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Ensure transparent background
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    } else {
      document.body.appendChild(renderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 20, 10);
    pointLight.position.set(3, 3, 6);
    scene.add(pointLight);

    await addBall();
    startRendering();

    window.addEventListener("resize", resize);
  };

  const addBall = async () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const modelData: GLTFResult = await loadModel("/models/magic8ball2.glb");
    const topTexture: THREE.Texture = await loadTexture("/textures/magic8ball-top.jpg");
    const bottomTexture: THREE.Texture = await loadTexture("/textures/magic8ball-bottom.jpg");
    bottomTexture.colorSpace = THREE.SRGBColorSpace;
    bottomTexture.flipY = false;
    const dieTexture: THREE.Texture = await loadTexture("/textures/magic8ball-die.jpg");
    dieTexture.flipY = false;
    const envMap: THREE.Texture = await loadEnv("/envs/empty_warehouse_01_1k.hdr");
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    const ball = modelData.scene;
    ballRef.current = ball; // Save entire ball reference

    // Assume ball.children[7] is the die that shows the answers.
    const die = ball.children[7] as THREE.Mesh;
    die.position.y = -0.635;
    die.rotation.y = THREE.MathUtils.degToRad(55);
    die.rotation.x = THREE.MathUtils.degToRad(40);
    dieRef.current = die; // Save die reference

    // Immediately set the die's orientation to the initial orientation.
    if (dieRef.current) {
      dieRef.current.quaternion.copy(initialOrientation);
    }

    const windowChild = ball.children[4] as THREE.Mesh;

    // Cast children to THREE.Mesh before assigning material.
    (ball.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
      fog: false,
      envMap: envMap,
      envMapIntensity: 0.1,
      map: topTexture,
      roughness: 0,
      side: THREE.DoubleSide,
    });

    (ball.children[1] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
      fog: false,
      envMap: envMap,
      envMapIntensity: 0.1,
      map: bottomTexture,
      roughness: 0,
      side: THREE.DoubleSide,
    });

    windowChild.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      fog: false,
      opacity: 0.1,
      roughness: 0,
      side: THREE.DoubleSide,
      transparent: true,
    });

    (die as THREE.Mesh).material = new THREE.MeshStandardMaterial({
      map: dieTexture,
      side: THREE.DoubleSide,
    });

    const flatBlackMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      fog: false,
      side: THREE.DoubleSide,
    });
    const shinyBlackMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      fog: false,
      roughness: 0,
      side: THREE.DoubleSide,
    });

    (ball.children[6] as THREE.Mesh).material = flatBlackMaterial;
    (ball.children[2] as THREE.Mesh).material = shinyBlackMaterial;
    (ball.children[3] as THREE.Mesh).material = shinyBlackMaterial;
    (ball.children[5] as THREE.Mesh).material = shinyBlackMaterial;

    // Set initial rotation for the entire ball.
    ball.rotation.x = THREE.MathUtils.degToRad(90);
    ball.rotation.z = THREE.MathUtils.degToRad(0); // start at 0
    scene.add(ball);

    // After 1 second, animate rotation.z to 180°
    setTimeout(() => {
      gsap.to(ball.rotation, {
        duration: 4,
        z: THREE.MathUtils.degToRad(180),
        ease: "power2.inOut",
      });
    }, 1000);
  };

  const renderScene = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      frameRef.current = requestAnimationFrame(renderScene);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const startRendering = () => {
    renderScene();
  };

  const resize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  // When "Ask" is clicked, randomly select one valid orientation.
  const handleAsk = () => {
    if (!ballRef.current || !dieRef.current) return;
    const targetOrientation =
      validOrientations[Math.floor(Math.random() * validOrientations.length)];
    gsap.to(dieRef.current.quaternion, {
      duration: 4,
      x: targetOrientation.x,
      y: targetOrientation.y,
      z: targetOrientation.z,
      w: targetOrientation.w,
      ease: "power2.inOut",
    });
    // Animate the entire ball: rotate its Y axis by 20 degrees, then yoyo back.
    gsap.to(ballRef.current.rotation, {
      duration: 1.5,
      z: ballRef.current.rotation.z + THREE.MathUtils.degToRad(-45),
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
    gsap.to((dieRef.current as THREE.Mesh).position, {
      duration: 1,
      y: -0.55,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });

    setQuestion("");
  };

  useEffect(() => {
    initializeThree();
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-screen h-screen">
      {/* Form container using Tailwind classes for absolute positioning */}
      <div className="absolute bottom-[100px] w-full z-50">
        <div className="flex space-x-4 w-full flex items-center justify-center">
          <input
            type="text"
            placeholder="Ask your question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setQuestion("");
              }
            }}
            className="p-2 border border-gray-300 w-3/5 max-w-[500px] px-8 py-4 text-black font-rubik rounded-full"
          />
          <button
            className="font-[700] font-rubik p-2 px-8 py-4 text-xl w-fit border-none rounded-full uppercase transition-colors bg-[#ffd000] text-[#440031] hover:bg-[#fff720] hover:text-[#440031]"
            onClick={handleAsk}
          >
            Ask
          </button>
        </div>
      </div>

      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className="absolute top-[-50px] left-0 w-full h-full z-0 pointer-events-none"
      />
    </div>
  );
};

export default Magic8Ball;
