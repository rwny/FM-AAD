import { describe, it, expect } from 'vitest';
import { extractBimMetadata } from './bim-metadata';
import * as THREE from 'three';

describe('BIM Metadata Extraction', () => {
  it('should extract IFC metadata from Object3D userData', () => {
    const obj = new THREE.Object3D();
    obj.userData = {
      'IfcEntityType': 'IfcUnitaryEquipment',
      'GlobalId': '1234-5678',
      'Pset_AirConditioningUnit.NominalCoolingCapacity': 13300,
      'Pset_ElectricalDeviceCommon.NominalVoltage': 220,
      'Pset_ManufacturerTypeInformation.Manufacturer': 'Carrier',
      'Pset_ManufacturerTypeInformation.ModelReference': '42TGF0131CP'
    };

    const metadata = extractBimMetadata(obj);

    expect(metadata.ifcType).toBe('IfcUnitaryEquipment');
    expect(metadata.guid).toBe('1234-5678');
    expect(metadata.specs.capacity).toBe(13300);
    expect(metadata.specs.voltage).toBe(220);
    expect(metadata.manufacturer).toBe('Carrier');
    expect(metadata.model).toBe('42TGF0131CP');
  });

  it('should return empty specs if metadata is missing', () => {
    const obj = new THREE.Object3D();
    const metadata = extractBimMetadata(obj);
    expect(metadata.guid).toBeUndefined();
    expect(metadata.specs).toEqual({});
  });
});
