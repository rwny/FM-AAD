import * as THREE from 'three';

export function extractBimMetadata(object: THREE.Object3D) {
  const ud = object.userData || {};
  
  const specs: Record<string, any> = {};
  
  // Capture ALL IFC properties
  Object.keys(ud).forEach(key => {
    const val = ud[key];
    if (val === undefined || val === null) return;
    if (key === 'IfcEntityType' || key === 'GlobalId') return;
    const cleanKey = key.replace(/^Pset_\w+\./, '');
    specs[cleanKey] = val;
  });

  return {
    ifcType: ud.IfcEntityType,
    guid: ud.GlobalId,
    specs,
    manufacturer: ud['Pset_ManufacturerTypeInformation.Manufacturer'],
    model: ud['Pset_ManufacturerTypeInformation.ModelReference'],
    systemId: ud['Pset_Carrier.System_ID']
  };
}

