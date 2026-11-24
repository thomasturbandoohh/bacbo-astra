import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { DiceFace } from "@/lib/signal";

interface DieProps {
  value: DiceFace;
  color: string;
  position: [number, number, number];
  rolling: boolean;
}

// Rotations [x, y, z] to expose each target face to the front camera (z+)
const DICE_ROTATIONS: Record<DiceFace, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, Math.PI / 2, 0],
  3: [-Math.PI / 2, 0, 0],
  4: [Math.PI / 2, 0, 0],
  5: [0, -Math.PI / 2, 0],
  6: [Math.PI, 0, 0],
};

function Die({ value, color, position, rolling }: DieProps) {
  const meshRef = useRef<THREE.Group>(null);
  const targetRotation = useMemo(() => DICE_ROTATIONS[value] ?? [0, 0, 0], [value]);
  const rx = targetRotation[0] ?? 0;
  const ry = targetRotation[1] ?? 0;
  const rz = targetRotation[2] ?? 0;

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);

    if (rolling) {
      // Tumbling physics-like rotation
      meshRef.current.rotation.x += dt * 7;
      meshRef.current.rotation.y += dt * 9;
      meshRef.current.rotation.z += dt * 5;
      meshRef.current.position.y = position[1] + Math.abs(Math.sin(t * 12)) * 0.45;
    } else {
      // Smooth interpolation to target face
      meshRef.current.rotation.x += (rx - meshRef.current.rotation.x) * (dt * 8);
      meshRef.current.rotation.y += (ry - meshRef.current.rotation.y) * (dt * 8);
      meshRef.current.rotation.z += (rz - meshRef.current.rotation.z) * (dt * 8);
      meshRef.current.position.y += (position[1] - meshRef.current.position.y) * (dt * 8);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Main Die Body */}
      <RoundedBox args={[0.82, 0.82, 0.82]} radius={0.16} smoothness={6}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.15}
          metalness={0.08}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          reflectivity={0.9}
        />
      </RoundedBox>

      {/* Face 1 (Front: z = +0.42) */}
      <Pip position={[0, 0, 0.42]} />

      {/* Face 6 (Back: z = -0.42) */}
      <Pip position={[-0.24, -0.24, -0.42]} />
      <Pip position={[-0.24, 0, -0.42]} />
      <Pip position={[-0.24, 0.24, -0.42]} />
      <Pip position={[0.24, -0.24, -0.42]} />
      <Pip position={[0.24, 0, -0.42]} />
      <Pip position={[0.24, 0.24, -0.42]} />

      {/* Face 2 (Right: x = +0.42) */}
      <Pip position={[0.42, -0.22, -0.22]} rotation={[0, Math.PI / 2, 0]} />
      <Pip position={[0.42, 0.22, 0.22]} rotation={[0, Math.PI / 2, 0]} />

      {/* Face 5 (Left: x = -0.42) */}
      <Pip position={[-0.42, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Pip position={[-0.42, -0.22, -0.22]} rotation={[0, -Math.PI / 2, 0]} />
      <Pip position={[-0.42, 0.22, 0.22]} rotation={[0, -Math.PI / 2, 0]} />
      <Pip position={[-0.42, 0.22, -0.22]} rotation={[0, -Math.PI / 2, 0]} />
      <Pip position={[-0.42, -0.22, 0.22]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Face 3 (Top: y = +0.42) */}
      <Pip position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Pip position={[-0.22, 0.42, -0.22]} rotation={[Math.PI / 2, 0, 0]} />
      <Pip position={[0.22, 0.42, 0.22]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Face 4 (Bottom: y = -0.42) */}
      <Pip position={[-0.22, -0.42, -0.22]} rotation={[-Math.PI / 2, 0, 0]} />
      <Pip position={[0.22, -0.42, -0.22]} rotation={[-Math.PI / 2, 0, 0]} />
      <Pip position={[-0.22, -0.42, 0.22]} rotation={[-Math.PI / 2, 0, 0]} />
      <Pip position={[0.22, -0.42, 0.22]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

function Pip({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <circleGeometry args={[0.082, 24]} />
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
    </mesh>
  );
}

interface BacBoDice3DProps {
  playerDice: [DiceFace, DiceFace];
  bankerDice: [DiceFace, DiceFace];
  rolling?: boolean;
}

export default function BacBoDice3D({
  playerDice,
  bankerDice,
  rolling = false,
}: BacBoDice3DProps) {
  const pSum = playerDice[0] + playerDice[1];
  const bSum = bankerDice[0] + bankerDice[1];

  return (
    <div className="relative w-full rounded-3xl border border-white/10 bg-gradient-to-b from-black/80 via-black/90 to-background/95 p-3.5 shadow-2xl overflow-hidden">
      {/* Header with Bac Bo Score Badge */}
      <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-black tracking-wider text-blue-400">JOGADOR</span>
          <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-xs font-black text-blue-300">
            {rolling ? "?" : pSum}
          </span>
        </div>

        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          MESA BAC BO · 4 DADOS 3D
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-300">
            {rolling ? "?" : bSum}
          </span>
          <span className="text-xs font-black tracking-wider text-rose-400">CASA</span>
          <span className="size-2.5 rounded-full bg-rose-500 animate-pulse" />
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div className="h-36 w-full">
        <Canvas camera={{ position: [0, 1.8, 4.4], fov: 38 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[4, 7, 5]} intensity={2.2} castShadow />
          <directionalLight position={[-4, 4, 3]} intensity={1.4} color="#60a5fa" />
          <directionalLight position={[4, -2, -3]} intensity={0.9} color="#f43f5e" />

          {/* Player Dice (2 Blue Dice on Left) */}
          <Die value={playerDice[0]} color="#1d4ed8" position={[-1.65, 0, 0]} rolling={rolling} />
          <Die value={playerDice[1]} color="#2563eb" position={[-0.55, 0, 0]} rolling={rolling} />

          {/* Banker Dice (2 Red Dice on Right) */}
          <Die value={bankerDice[0]} color="#dc2626" position={[0.55, 0, 0]} rolling={rolling} />
          <Die value={bankerDice[1]} color="#b91c1c" position={[1.65, 0, 0]} rolling={rolling} />
        </Canvas>
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-muted-foreground font-medium">
        <span>2 Dados Azuis (Player)</span>
        <span className="text-emerald-400 font-bold">Empate no total = WIN ⚪</span>
        <span>2 Dados Vermelhos (Banker)</span>
      </div>
    </div>
  );
}
