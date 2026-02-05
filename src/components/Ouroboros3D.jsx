import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, MeshWobbleMaterial, GradientTexture } from '@react-three/drei'
import * as THREE from 'three'

function RitualRing() {
    const ringRef = useRef()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        if (ringRef.current) {
            ringRef.current.rotation.z = t * 0.5
            ringRef.current.rotation.y = Math.sin(t * 0.2) * 0.2
        }
    })

    return (
        <group ref={ringRef}>
            {/* Outer Glow Ring */}
            <mesh>
                <torusGeometry args={[3, 0.05, 16, 100]} />
                <meshBasicMaterial color="#8e0000" transparent opacity={0.3} />
            </mesh>

            {/* Inner Pulsing Ring */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh>
                    <torusGeometry args={[2.8, 0.15, 16, 100]} />
                    <MeshDistortMaterial
                        color="#4B0082"
                        speed={2}
                        distort={0.4}
                        radius={1}
                        emissive="#8e0000"
                        emissiveIntensity={2}
                    />
                </mesh>
            </Float>

            {/* Central Core */}
            <mesh>
                <sphereGeometry args={[0.5, 32, 32]} />
                <MeshWobbleMaterial
                    color="#2a0052"
                    factor={0.6}
                    speed={3}
                    emissive="#ff0000"
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    )
}

export default function Ouroboros3D() {
    return (
        <div className="ouroboros-3d-container">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#8e0000" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4B0082" />
                <RitualRing />
            </Canvas>
            <style jsx>{`
        .ouroboros-3d-container {
          width: 300px;
          height: 300px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 5;
          filter: drop-shadow(0 0 20px rgba(142, 0, 0, 0.6));
        }
      `}</style>
        </div>
    )
}
