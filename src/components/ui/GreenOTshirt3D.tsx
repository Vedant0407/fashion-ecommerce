"use client";

import { Canvas } from "@react-three/fiber";
import {
  Center,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

function TshirtModel() {
  const { scene } = useGLTF("/greeno.tshirt.glb");

  return (
    <Center>
      <primitive
        object={scene}
        scale={0.72}
      />
    </Center>
  );
}

export default function GreenOTshirt3D() {
  return (
    <div className="greeno-3d">
      <Canvas
  camera={{
    position: [0, 0, 9],
    fov: 35,
  }}
  gl={{
    alpha: true,
    antialias: true,
  }}
  style={{
    background: "transparent",
  }}
>
        <Environment preset="studio" />

        <TshirtModel />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/greeno.tshirt.glb");