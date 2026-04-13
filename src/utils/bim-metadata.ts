import * as THREE from 'three';

export function extractBimMetadata(object: THREE.Object3D) {
  const ud = object.userData || {};
  
  const specs: Record<string, any> = {};
  
  // Extract standardized Psets
  if (ud['Pset_AirConditioningUnit.NominalCoolingCapacity'] !== undefined) {
    specs.capacity = ud['Pset_AirConditioningUnit.NominalCoolingCapacity'];
  }
  if (ud['Pset_ElectricalDeviceCommon.NominalVoltage'] !== undefined) {
    specs.voltage = ud['Pset_ElectricalDeviceCommon.NominalVoltage'];
  }
  if (ud['Pset_ElectricalDeviceCommon.NominalFrequency'] !== undefined) {
    specs.frequency = ud['Pset_ElectricalDeviceCommon.NominalFrequency'];
  }
  if (ud['Pset_ElectricalDeviceCommon.NumberofPhases'] !== undefined) {
    specs.phases = ud['Pset_ElectricalDeviceCommon.NumberofPhases'];
  }
  if (ud['Pset_ElectricalDeviceCommon.PowerConsumption'] !== undefined) {
    specs.power = ud['Pset_ElectricalDeviceCommon.PowerConsumption'];
  }

  return {
    ifcType: ud.IfcEntityType,
    guid: ud.GlobalId,
    specs,
    manufacturer: ud['Pset_ManufacturerTypeInformation.Manufacturer'],
    model: ud['Pset_ManufacturerTypeInformation.ModelReference'],
    systemId: ud['Pset_Carrier.System_ID']
  };
}

