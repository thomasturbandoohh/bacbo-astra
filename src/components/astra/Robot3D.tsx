import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import type { Group, Mesh } from "three";

export type RobotMood = "scan" | "JOGADOR" | "CASA" | "EMPATE" | "off";
const BLUE = "#2f8cff", RED = "#ff3b3b", WHITE = "#e8eef7", DIM = "#475569";
const moodColor = (m: RobotMood) => (m === "CASA" ? RED : m === "EMPATE" ? WHITE : m === "off" ? DIM : BLUE);

function Bot({ mood }: { mood: RobotMood }) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const color = moodColor(mood);
  useFrame((st, delta) => {
    const t = st.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    if (root.current) root.current.position.y = Math.sin(t * 1.6) * 0.08;
    if (head.current) head.current.rotation.y = mood === "scan" ? Math.sin(t * 1.4) * 0.6 : head.current.rotation.y * Math.exp(-4 * dt);
    if (ring.current) ring.current.rotation.z += dt * (mood === "scan" ? 2.2 : 0.6);
  });
  return (
    <group ref={root}>
      <group ref={head} position={[0, 0.55, 0]}>
        <RoundedBox args={[1.5, 1.05, 1.1]} radius={0.3} smoothness={6}>
          <meshPhysicalMaterial color="#1b2330" metalness={0.6} roughness={0.25} clearcoat={1} />
        </RoundedBox>
        <RoundedBox args={[1.2, 0.55, 0.1]} radius={0.2} position={[0, 0.02, 0.53]}>
          <meshStandardMaterial color="#05080d" roughness={0.1} metalness={0.3} />
        </RoundedBox>
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x, 0.03, 0.6]}>
            <capsuleGeometry args={[0.08, mood === "scan" ? 0.04 : 0.14, 6, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.03, 0.03, 0.35]} /><meshStandardMaterial color="#8a94a6" metalness={0.8} /></mesh>
        <mesh position={[0, 0.92, 0]}><sphereGeometry args={[0.09, 20, 20]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} /></mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.18, 0.18, 0.12, 24]} /><meshStandardMaterial color="#2a3442" metalness={0.7} roughness={0.3} /></mesh>
        ))}
      </group>
      <mesh position={[0, -0.03, 0]}><cylinderGeometry args={[0.22, 0.26, 0.16, 24]} /><meshStandardMaterial color="#2a3442" metalness={0.7} roughness={0.3} /></mesh>
      <RoundedBox args={[1.05, 0.75, 0.8]} radius={0.25} position={[0, -0.45, 0]}>
        <meshPhysicalMaterial color="#1b2330" metalness={0.6} roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, -0.42, 0.41]}><circleGeometry args={[0.13, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} /></mesh>
      <mesh ref={ring} position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.025, 12, 64, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export default function Robot3D({ mood }: { mood: RobotMood }) {
  return (
    <div className="size-full">
      <Canvas camera={{ position: [0, 0.2, 4.2], fov: 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <pointLight position={[0, -1, 1.5]} intensity={6} color={moodColor(mood)} />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1.2} color={BLUE} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
          <Lightformer intensity={0.8} color={RED} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Bot mood={mood} />
      </Canvas>
    </div>
  );
}
