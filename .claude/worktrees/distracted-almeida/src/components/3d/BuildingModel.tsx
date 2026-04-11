import { useGLTF, Html } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Room, ACAsset } from '../../types/bim'

// Material Colors
const COLORS = {
  structure: '#c7b9b4',      // Structure/ST- default color
  architecture: '#475569',   // Architecture/XR- default color
  room: '#e2e8f0',           // Room default color
  roomSelected: '#f97316',   // Room selected color
  roomFloorAC: '#fa8072',    // Room floor when AC selected (salmon)
  pipe: '#71797E',           // Pipe default color (same as old structure)
  pipeELE: '#ef4444',        // Electrical pipe
  pipeREF: '#3b82f6',        // Refrigerant pipe
  pipeDRN: '#ffe760',        // Drain pipe
  furniture: '#f97316',      // Furniture selected
  highlight: '#eeeeee',      // AC selection highlight (tubes & spheres)
  status: {
    normal: '#10b981',       // 🟢 Emerald 500
    faulty: '#f43f5e',       // 🔴 Rose 500
    maintenance: '#f59e0b',  // 🟡 Amber 500
    warning: '#f59e0b',      // 🟡 Amber 500
    default: '#0ea5e9',      // Default Blue
  }
}

interface BuildingModelProps {
url: string;
activeMode: string;
selectedRoomId?: string | null;
clipFloor?: number | null;
onRoomsFound?: (rooms: Room[]) => void;
onACFound?: (assets: ACAsset[]) => void;
onRoomClick?: (roomId: string | null) => void;
buildingData: any;
finalACAssets: ACAsset[];
}

interface RoomLabelData extends Room {
position: THREE.Vector3;
isVisible: boolean;
}

interface ACLabelData {
id: string;
position: THREE.Vector3;
status?: string;
isVisible?: boolean;
isSelfIssue?: boolean;
}

export function BuildingModel({ url, activeMode, selectedRoomId, clipFloor, onRoomsFound, onACFound, onRoomClick, buildingData, finalACAssets }: BuildingModelProps) {
const { scene } = useGLTF(url)
const { camera } = useThree()
const clonedScene = useMemo(() => scene.clone(), [scene])
const [roomLabels, setRoomLabels] = useState<RoomLabelData[]>([])
const [selectedLabel, setSelectedLabel] = useState<ACLabelData | null>(null)
const [issueIcons, setIssueIcons] = useState<ACLabelData[]>([])
const [visibleRoomLabels, setVisibleRoomLabels] = useState<RoomLabelData[]>([])
const [selectedACWireframe, setSelectedACWireframe] = useState<THREE.Object3D | null>(null)

const allFurniture = useMemo(() => {
  const assets: any[] = [];
  if (!buildingData || !buildingData.floors) return assets;
  
  const floorsArray = Array.isArray(buildingData.floors) 
    ? buildingData.floors 
    : Object.entries(buildingData.floors).map(([num, data]: [string, any]) => ({ floor: parseInt(num), ...data }));

  floorsArray.forEach((f: any) => {
    const floorNum = f.floor || (parseInt(f.name?.replace('FLOOR ', '')) || 1);
    if (f.rooms && Array.isArray(f.rooms)) {
      f.rooms.forEach((r: any) => {
        if (r.assets && Array.isArray(r.assets)) {
          r.assets.forEach((a: any) => {
            assets.push({ ...a, room: r.id, floor: floorNum });
          });
        }
      });
    }
  });
  return assets;
}, [buildingData]);

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'normal') return COLORS.status.normal
  if (s === 'faulty') return COLORS.status.faulty
  if (s === 'maintenance' || s === 'warning') return COLORS.status.maintenance
  return COLORS.status.default
}

// Update visible room labels based on camera position
const updateVisibleRoomLabels = () => {
  if (!camera || roomLabels.length === 0) return;
  
  const cameraY = camera.position.y;
  const FLOOR_2_THRESHOLD = 2.8; // Same threshold used in the model
  
  let filteredRooms: RoomLabelData[];
  if (cameraY >= FLOOR_2_THRESHOLD) {
    // Camera above 2nd floor - show only 2nd floor rooms
    filteredRooms = roomLabels.filter(r => r.floor === 2);
  } else {
    // Camera below 2nd floor - show only 1st floor rooms
    filteredRooms = roomLabels.filter(r => r.floor === 1);
  }
  
  // Apply clip floor filter if active
  if (clipFloor !== null && clipFloor !== undefined) {
    filteredRooms = filteredRooms.filter(r => r.floor <= clipFloor);
  }
  
  setVisibleRoomLabels(filteredRooms);
}

// Initial Scene Setup
useEffect(() => {
  if (clonedScene) {
    clonedScene.position.set(0, 0, 0)
    clonedScene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clonedScene)
    const center = new THREE.Vector3()
    box.getCenter(center)
    clonedScene.position.x = -center.x
    clonedScene.position.z = -center.z
    clonedScene.updateMatrixWorld(true)

    const foundRooms: Room[] = []
    const foundACRaw: { mesh: THREE.Mesh, nameLower: string, suffix: string, type: string }[] = []
    const labels: RoomLabelData[] = []

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        const nameLower = child.name.toLowerCase()

        if (nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')) {
          const suffix = nameLower.split('-')[1] || ''
          const type = nameLower.startsWith('fcu-') ? 'FCU' : 'CDU'
          
          // Initial status check
          let status = 'Normal';
          if (buildingData && buildingData.floors) {
              const floorsArray = Array.isArray(buildingData.floors) 
                ? buildingData.floors 
                : Object.values(buildingData.floors);

              floorsArray.forEach((f: any) => {
                if (f.rooms && Array.isArray(f.rooms)) {
                  f.rooms.forEach((r: any) => {
                    if (r.assets && Array.isArray(r.assets)) {
                      r.assets.forEach((a: any) => {
                        if (a.id && a.id.toLowerCase() === nameLower) {
                          status = a.status || a.currentStatus || 'Normal';
                        }
                      });
                    }
                  });
                }
              });
          }
          child.userData.status = status;
          foundACRaw.push({ mesh: child, nameLower, suffix, type })
        }

        if (nameLower.startsWith('rm-')) {
          const roomName = child.name.toLowerCase();
          
          // Handle rm-xx-floor objects
          if (roomName.endsWith('-floor')) {
            const roomNumberStr = roomName.replace('rm-', '').replace('-floor', '');
            const roomNumber = parseInt(roomNumberStr);
            
            if (!isNaN(roomNumber)) {
              child.castShadow = false;
              child.receiveShadow = true;
              child.visible = false; // Hidden by default, shown in AC mode when matching
            }
          }
          // Handle rm-xx-ceiling objects - hide in AC mode
          else if (roomName.endsWith('-ceiling')) {
            child.castShadow = false;
            child.receiveShadow = true;
            child.visible = true; // Visible by default
          }
          // Handle regular rm-xx objects
          else if (!roomName.includes('-floor') && !roomName.includes('-ceiling')) {
            const roomNumberStr = child.name.replace('rm-', '')
            const roomNumber = parseInt(roomNumberStr)
            if (roomNumber >= 1000) {
              child.visible = false
              child.raycast = () => null
            } else if (!isNaN(roomNumber)) {
              // Room objects should not cast shadow
              child.castShadow = false
              child.receiveShadow = true
              
              const roomBox = new THREE.Box3().setFromObject(child)
              const roomCenter = new THREE.Vector3()
              roomBox.getCenter(roomCenter)
              
              // Position label at floor level + 1.0 (instead of centroid)
              const labelPosition = new THREE.Vector3(
                roomCenter.x,
                roomBox.min.y + 1.0, // Floor level + 1.0
                roomCenter.z
              )
              
              const roomData = { id: nameLower, number: roomNumberStr, floor: parseInt(roomNumberStr.charAt(0)), name: `Room ${roomNumberStr}` }
              foundRooms.push(roomData)
              labels.push({ ...roomData, position: labelPosition, isVisible: true })
            }
          }
        }
      }
    })

    const foundACFinal: ACAsset[] = foundACRaw.map(item => ({
      id: item.nameLower,
      name: `${item.type} ${item.suffix || ''}`,
      type: item.type as 'FCU' | 'CDU',
      brand: 'System Default',
      model: 'BIM-Model-V1',
      capacity: 'Auto-detected',
      status: item.mesh.userData.status as any,
      lastService: '2026-03-10',
      nextService: 'Pending'
    }));

    setRoomLabels(labels)
    if (onRoomsFound) onRoomsFound(foundRooms.sort((a, b) => a.number.localeCompare(b.number)))
    if (onACFound) onACFound(foundACFinal)
  }
}, [clonedScene, onRoomsFound, onACFound, buildingData])

// Update Materials and Visibility
useEffect(() => {
  let activeLabel: ACLabelData | null = null
  const cleanSelectedId = selectedRoomId?.toLowerCase().replace(/\./g, '');
  
  // Resolve Peer ID if AC is selected
  let peerId: string | null = null;
  if (cleanSelectedId && (cleanSelectedId.startsWith('fcu-') || cleanSelectedId.startsWith('cdu-'))) {
    const parts = cleanSelectedId.split('-');
    const prefix = parts[0] === 'fcu' ? 'cdu' : 'fcu';
    peerId = `${prefix}-${parts.slice(1).join('-')}`;
  }

  const issues: ACLabelData[] = []

  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const nameLower = child.name.toLowerCase()
      const cleanName = nameLower.replace(/\./g, '');
      
      // Match either primary or peer
      const isSelected = !!(cleanSelectedId && cleanName === cleanSelectedId);
      const isPeerSelected = !!(peerId && cleanName === peerId);
      const isPartofSelection = isSelected || isPeerSelected;
      
      const isAC = nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')
      const isRoom = nameLower.startsWith('rm-')
      const isFur = nameLower.startsWith('lf-') || nameLower.startsWith('bf-')
      const isStruc = nameLower.startsWith('xr-struc') || nameLower.startsWith('st-')
      const isArch = nameLower.startsWith('xr-') && !isStruc
      const isPipe = nameLower.startsWith('pipe-')

      // Parse pipe type and associated AC set
      let pipeType: 'ELE' | 'REF' | 'DRN' | null = null;
      let pipeACSet: string | null = null;
      if (isPipe) {
        const pipeParts = nameLower.split('-');
        if (pipeParts.length >= 2) {
          const typePart = pipeParts[1].toUpperCase();
          if (typePart === 'ELE') pipeType = 'ELE';
          else if (typePart === 'REF') pipeType = 'REF';
          else if (typePart === 'DRN') pipeType = 'DRN';
          // Get the AC set identifier (room + level) e.g., "101-1" from "pipe-ele-101-1"
          if (pipeParts.length >= 3) {
            pipeACSet = pipeParts.slice(2).join('-');
          }
        }
      }

      // Check if this pipe belongs to the selected AC set
      let isSelectedPipe = false;
      let selectedPipeColor = COLORS.pipe; // Default structure color
      if (isPipe && pipeACSet && cleanSelectedId) {
        // Extract AC set from selected ID (e.g., "fcu-101-1" → "101-1")
        const selectedParts = cleanSelectedId.split('-');
        if (selectedParts.length >= 2) {
          const selectedACSet = selectedParts.slice(1).join('-');
          if (pipeACSet === selectedACSet) {
            isSelectedPipe = true;
            if (pipeType === 'ELE') selectedPipeColor = COLORS.pipeELE;
            else if (pipeType === 'REF') selectedPipeColor = COLORS.pipeREF;
            else if (pipeType === 'DRN') selectedPipeColor = COLORS.pipeDRN;
          }
        }
      }

      // Remove old selection outlines if any
      if (child.userData.isOutline) {
        child.visible = false;
        return;
      }

      // Handle Selection Visual (Outline Mesh)
      const existingOutline = child.children.find(c => c.userData.isOutline);
      if (existingOutline) {
        existingOutline.visible = isPartofSelection;
      } else if (isPartofSelection && (isAC || isFur)) {
        // Create Selection Frame (Blender-like)
        const outlineGeo = child.geometry.clone();
        const outlineMat = new THREE.MeshBasicMaterial({ 
          color: '#ffffff', 
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.5
        });
        const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
        outlineMesh.scale.multiplyScalar(1.05); // Slightly larger
        outlineMesh.userData.isOutline = true;
        child.add(outlineMesh);
      }

      // Floor Visibility Logic
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = new THREE.Vector3();
      meshBox.getCenter(meshCenter);
      const yFloor = meshCenter.y > 2.8 ? 2 : 1;

      let meshFloor = yFloor; // Use Y-coordinate as baseline
      
      if (isRoom) {
        meshFloor = parseInt(nameLower.replace('rm-', '').charAt(0));
      } else if (nameLower.startsWith('st-')) {
        const numPart = nameLower.replace('st-', '').split(/[^0-9]/)[0];
        const num = parseInt(numPart);
        if (!isNaN(num)) {
          meshFloor = Math.floor(num / 1000);
          if (meshFloor === 0) meshFloor = 1; 
        }
      } else if (isFur) {
        const asset = allFurniture.find(a => a.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanName);
        if (asset) meshFloor = asset.floor;
      } else if (isAC) {
        // Robust AC floor detection: Check hyphen or dot
        const parts = nameLower.split(/[-.]/);
        if (parts.length > 1) {
          const possibleRoom = parts[1];
          const floorChar = possibleRoom.charAt(0);
          if (floorChar === '1' || floorChar === '2') {
            meshFloor = parseInt(floorChar);
          }
        }
      }

      const isVisible = (clipFloor !== null && clipFloor !== undefined) ? (meshFloor <= clipFloor) : true;
      child.visible = isVisible;

      const materialConfig = {
        side: THREE.DoubleSide,
      }

      if (isAC) {
        // Dynamic status color from finalACAssets
        const liveAsset = (finalACAssets || []).find(a => a.id.toLowerCase() === cleanName);
        const status = liveAsset?.status || child.userData.status || 'Normal';
        const systemStatus = (liveAsset as any)?.systemStatus || status;
        const statusColor = getStatusColor(status);
        
        if (systemStatus === 'Faulty' || systemStatus === 'Maintenance') {
          const acBox = new THREE.Box3().setFromObject(child)
          const acCenter = new THREE.Vector3()
          acBox.getCenter(acCenter)
          
          const isSelf = status !== 'Normal';
          const iconPos = acCenter.clone();
          
          // If it's the actual faulty unit, float the triangle above
          if (isSelf) {
            iconPos.y += 0.5;
          }
          // Otherwise (peer unit), keep the small dot at the object center/origin
          
          issues.push({ 
            id: cleanName, 
            position: iconPos, 
            status: systemStatus,
            isVisible: isVisible,
            isSelfIssue: isSelf
          })
        }

        if (isSelected) {
          const acBox = new THREE.Box3().setFromObject(child)
          const acCenter = new THREE.Vector3()
          acBox.getCenter(acCenter)
          activeLabel = { id: child.name.toUpperCase(), position: acCenter }
        }
        child.material = new THREE.MeshStandardMaterial({
          ...materialConfig,
          roughness: 0.5, metalness: 0.2, transparent: activeMode !== 'AC',
          opacity: activeMode === 'AC' ? 1.0 : 0.1,
          color: statusColor,
          emissive: '#000000',
          emissiveIntensity: 0,
        })
        child.raycast = (activeMode === 'AC' && child.visible) ? THREE.Mesh.prototype.raycast : () => null
      }
      
      else if (isFur) {
        const assetData = allFurniture.find(a => a.id.toLowerCase().replace(/\./g, '') === cleanName)
        const statusColor = getStatusColor(assetData?.status || assetData?.currentStatus || 'Normal')
        
        if (isSelected) {
          const furBox = new THREE.Box3().setFromObject(child)
          const furCenter = new THREE.Vector3()
          furBox.getCenter(furCenter)
          activeLabel = { id: (assetData?.id || child.name).toUpperCase(), position: furCenter }
        }

        child.material = new THREE.MeshStandardMaterial({
          ...materialConfig,
          roughness: 0.7, metalness: 0.1, transparent: activeMode !== 'Fur',
          opacity: activeMode === 'Fur' ? 1.0 : 0.05,
          color: isSelected ? COLORS.furniture : statusColor,
          emissive: isSelected ? COLORS.furniture : '#000000',
          emissiveIntensity: isSelected ? 0.5 : 0,
        })
        child.raycast = (activeMode === 'Fur' && child.visible) ? THREE.Mesh.prototype.raycast : () => null
        
        if (activeMode !== 'Fur' && !isSelected) {
            child.visible = child.visible && activeMode === 'AR';
        }
      }

      else if (isRoom) {
        // Check if this is a floor object (rm-xx-floor)
        const isFloorObject = nameLower.endsWith('-floor');
        
        // Extract room number from selected AC (e.g., "fcu-201-1" → "201")
        let isRoomFloorForSelectedAC = false;
        if (cleanSelectedId && (cleanSelectedId.startsWith('fcu-') || cleanSelectedId.startsWith('cdu-'))) {
          const acParts = cleanSelectedId.split('-');
          if (acParts.length >= 2) {
            const acRoomNumber = acParts[1]; // "201"
            
            if (isFloorObject) {
              const roomNumber = nameLower.replace('rm-', '').replace('-floor', '');
              isRoomFloorForSelectedAC = acRoomNumber === roomNumber;
            } else {
              const roomNumber = nameLower.replace('rm-', '');
              isRoomFloorForSelectedAC = acRoomNumber === roomNumber;
            }
          }
        }

        if (isFloorObject) {
          // Floor objects: show only when matching AC, y+0.1, no transparency
          // Only adjust position once by storing original
          if (!child.userData.originalY) {
            child.userData.originalY = child.position.y;
          }
          child.position.y = child.userData.originalY + 0.1; // Lift by 0.1 from original
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            transparent: false,
            roughness: 0.9,
            metalness: 0,
            depthWrite: true,
            color: isRoomFloorForSelectedAC ? COLORS.roomFloorAC : '#c7b9b4',
            opacity: 1.0,
            emissive: isRoomFloorForSelectedAC ? COLORS.roomFloorAC : '#000000',
            emissiveIntensity: isRoomFloorForSelectedAC ? 0.2 : 0,
          });
          child.visible = activeMode === 'AC' ? isRoomFloorForSelectedAC : false;
          child.raycast = () => null;
        } else if (nameLower.endsWith('-ceiling')) {
          // Ceiling objects: hide in AC mode
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            transparent: true,
            roughness: 0.9,
            metalness: 0,
            depthWrite: false,
            color: COLORS.room,
            opacity: activeMode === 'AC' ? 0.0 : 0.3,
            emissive: '#000000',
            emissiveIntensity: 0,
          });
          child.visible = activeMode !== 'AC';
          child.raycast = () => null;
        } else {
          // Regular room objects (rm-xx) - no highlighting effect
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            transparent: true, roughness: 0.9, metalness: 0, depthWrite: false,
            color: COLORS.room,
            opacity: isSelected ? 0.9 : 0.1,
            emissive: isSelected ? COLORS.roomSelected : '#000000',
            emissiveIntensity: isSelected ? 0.2 : 0,
          })
          child.raycast = (activeMode === 'AR' && child.visible) ? THREE.Mesh.prototype.raycast : () => null
        }
      }

      else if (isStruc) {
        child.material = new THREE.MeshStandardMaterial({ 
          ...materialConfig,
          color: COLORS.structure,
          roughness: 0.8, 
          metalness: 0.2,
          transparent: false,
          opacity: 1.0
        })
        child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
      }

      else if (isArch) {
        child.material = new THREE.MeshStandardMaterial({ 
          ...materialConfig,
          color: COLORS.architecture, 
          roughness: 0.9, 
          metalness: 0,
          transparent: true,
          opacity: (activeMode === 'Fur' || activeMode === 'AC') ? 0.3 : 1.0
        })
        child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
      }

      // Pipe objects - transparent by default, solid and colored when AC selected
      else if (isPipe) {
        child.material = new THREE.MeshStandardMaterial({
          ...materialConfig,
          color: isSelectedPipe ? selectedPipeColor : COLORS.pipe,
          roughness: 0.6,
          metalness: 0.3,
          transparent: isSelectedPipe ? false : true,
          opacity: isSelectedPipe ? 1.0 : 0.15,
          emissive: '#000000',
          emissiveIntensity: 0,
        })
        child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
      }
    }
  })
  
  // Create wireframe highlight for selected AC system (FCU-CDU pair with same room+level)
  if (cleanSelectedId && (cleanSelectedId.startsWith('fcu-') || cleanSelectedId.startsWith('cdu-'))) {
    // Extract full identifier after type (e.g., "fcu-201-1" → "201-1")
    const acParts = cleanSelectedId.split('-');
    const selectedIdentifier = acParts.length >= 3 ? acParts.slice(1).join('-') : null; // "201-1"
    
    // Find all AC meshes with the same room+level identifier
    const matchingMeshes: THREE.Mesh[] = [];
    clonedScene.traverse((child: any) => {
      if (child.isMesh && child.name) {
        const childName = child.name.toLowerCase();
        if ((childName.startsWith('fcu-') || childName.startsWith('cdu-'))) {
          const childParts = childName.split('-');
          if (childParts.length >= 3) {
            const childIdentifier = childParts.slice(1).join('-'); // "201-1"
            if (childIdentifier === selectedIdentifier) {
              matchingMeshes.push(child as THREE.Mesh);
            }
          }
        }
      }
    });
    
    // Remove old wireframes if exist
    if (selectedACWireframe) {
      if (selectedACWireframe instanceof THREE.Group) {
        clonedScene.remove(selectedACWireframe);
        selectedACWireframe.traverse((obj) => {
          if (obj instanceof THREE.LineSegments) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
          }
        });
      }
    }
    
    // Create wireframe group for all matching AC devices
    const wireframeGroup = new THREE.Group();
    
    matchingMeshes.forEach((mesh) => {
      if (mesh.geometry) {
        // Clone geometry and apply mesh scale to vertices before creating tubes
        const originalGeometry = mesh.geometry.clone();
        originalGeometry.scale(mesh.scale.x, mesh.scale.y, mesh.scale.z);
        
        // Create tube-based wireframe for real thickness
        const edgesGeo = new THREE.EdgesGeometry(originalGeometry, 15);
        const positions = edgesGeo.attributes.position;
        
        // Track unique vertices for sphere joints
        const uniqueVertices = new Map<string, THREE.Vector3>();
        
        // Extract edge pairs and create tubes
        for (let i = 0; i < positions.count; i += 2) {
          const start = new THREE.Vector3(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
          );
          const end = new THREE.Vector3(
            positions.getX(i + 1),
            positions.getY(i + 1),
            positions.getZ(i + 1)
          );
          
          // Store unique vertices
          const startKey = `${start.x.toFixed(3)},${start.y.toFixed(3)},${start.z.toFixed(3)}`;
          const endKey = `${end.x.toFixed(3)},${end.y.toFixed(3)},${end.z.toFixed(3)}`;
          
          if (!uniqueVertices.has(startKey)) {
            uniqueVertices.set(startKey, start);
          }
          if (!uniqueVertices.has(endKey)) {
            uniqueVertices.set(endKey, end);
          }
          
          // Create line curve for this edge
          const lineCurve = new THREE.LineCurve3(start, end);
          
          // Create tube geometry along the edge
          const tubeGeo = new THREE.TubeGeometry(lineCurve, 1, 0.02, 6, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: COLORS.highlight,
            roughness: 0.4,
            metalness: 0,
            emissive: COLORS.highlight,
            emissiveIntensity: 0.3,
          });
          
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          tubeMesh.position.copy(mesh.position);
          tubeMesh.rotation.copy(mesh.rotation);
          // Don't apply scale here - tubes already have correct size from scaled geometry
          tubeMesh.raycast = () => null;
          wireframeGroup.add(tubeMesh);
        }
        
        // Create spheres at vertex intersections
        const sphereGeo = new THREE.SphereGeometry(0.02, 8, 6); // tube radius (0.02) * 1.0
        const sphereMat = new THREE.MeshStandardMaterial({
          color: COLORS.highlight,
          roughness: 0.3,
          metalness: 0,
          emissive: COLORS.highlight,
          emissiveIntensity: 0.4,
        });
        
        uniqueVertices.forEach((vertex) => {
          const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
          // Apply same transformation as tube: position + rotation from mesh
          sphereMesh.position.copy(vertex);
          sphereMesh.position.applyEuler(mesh.rotation);
          sphereMesh.position.add(mesh.position);
          sphereMesh.raycast = () => null;
          wireframeGroup.add(sphereMesh);
        });
        
        // Clean up cloned geometry
        originalGeometry.dispose();
      }
    });
    
    if (wireframeGroup.children.length > 0) {
      clonedScene.add(wireframeGroup);
      setSelectedACWireframe(wireframeGroup);
    }
  } else {
    // Remove wireframe when no AC selected
    if (selectedACWireframe) {
      if (selectedACWireframe instanceof THREE.Group) {
        clonedScene.remove(selectedACWireframe);
        selectedACWireframe.traverse((obj) => {
          if (obj instanceof THREE.LineSegments) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
          }
        });
      }
      setSelectedACWireframe(null);
    }
  }
  
  setSelectedLabel(activeLabel)
  setIssueIcons(activeMode === 'AC' ? issues : [])
}, [clonedScene, selectedRoomId, activeMode, clipFloor, allFurniture, finalACAssets])

return (
  <group onPointerDown={(e) => { 
    e.stopPropagation(); 
    const clickedName = e.object.name.toLowerCase();
    
    // Update room labels visibility on any click
    if (activeMode === 'AC') {
      updateVisibleRoomLabels();
    }
    
    // Only update selection if clicking on actual assets (AC, Room, Furniture)
    // Ignore clicks on structure, architecture, pipes, and other non-asset objects
    const isAC = clickedName.startsWith('fcu-') || clickedName.startsWith('cdu-');
    const isRoom = clickedName.startsWith('rm-');
    const isFur = clickedName.startsWith('lf-') || clickedName.startsWith('bf-');
    
    if (isAC || isRoom || isFur) {
      onRoomClick?.(clickedName);
    }
    // If clicking on non-asset, keep current selection (do nothing)
  }}>
    <primitive object={clonedScene} />
    
    {/* Room labels - AR mode */}
    {activeMode === 'AR' && roomLabels.filter(r => !clipFloor || r.floor === clipFloor || (clipFloor === 2 && r.floor <= 2)).map((room) => (
      <Html key={room.id} position={room.position} className="pointer-events-none transition-all duration-300">
        <div className={`px-2 py-1 rounded-[4px] text-[10px] font-black shadow-xl whitespace-nowrap transition-all -translate-x-1/2 ${room.id === selectedRoomId ? 'text-slate-900 bg-white scale-110 z-50 ring-2 ring-indigo-50' : 'text-slate-800 bg-white/95 border border-slate-200'}`}>
          {room.number}
        </div>
      </Html>
    ))}
    
    {/* Room labels - AC mode (large text, no border, transparent, camera-based visibility) */}
    {activeMode === 'AC' && visibleRoomLabels.map((room) => (
      <Html key={room.id} position={room.position} className="pointer-events-none">
        <div className="text-[24px] font-black text-slate-800 whitespace-nowrap -translate-x-1/2" style={{ opacity: 0.25 }}>
          {room.number}
        </div>
      </Html>
    ))}
    {(activeMode === 'AC' || activeMode === 'Fur') && selectedLabel && (
      <Html position={selectedLabel.position} className="pointer-events-none">
        <div className="px-2 py-1 bg-white text-slate-900 text-[10px] font-black rounded-[4px] shadow-xl whitespace-nowrap transition-all -translate-x-1/2 scale-110 z-50 ring-2 ring-indigo-500">
          {selectedLabel.id}
        </div>
      </Html>
    )}

    {activeMode === 'AC' && issueIcons.filter(issue => issue.isVisible).map((issue) => (
      <Html key={issue.id} position={issue.position} className="pointer-events-none">
        <div className="flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full mb-2">
          <div className={`relative flex items-center justify-center`}>
            {issue.isSelfIssue ? (
              /* 🔻 Triangle with White Border for self-issue */
              <div className="relative flex flex-col items-center animate-bounce">
                  {/* Outer Pulse */}
                  <div className={`absolute -top-1 w-8 h-8 rounded-full animate-ping opacity-40 ${issue.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  
                  {/* Downward Triangle SVG */}
                  <svg width="22" height="20" viewBox="0 0 22 20" className="drop-shadow-xl overflow-visible">
                    <path 
                      d="M2 2 L20 2 L11 17 Z" 
                      fill={issue.status === 'Faulty' ? '#e11d48' : '#d97706'} 
                      stroke="white" 
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
              </div>
            ) : (
              /* 🟠 Small static dot for peer-issue */
              <div className={`relative w-2 h-2 rounded-full border border-white shadow-lg opacity-80 ${
                issue.status === 'Faulty' ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
            )}
          </div>
        </div>
      </Html>
    ))}
  </group>
)
}

useGLTF.preload('/models/ar15-302.glb')
