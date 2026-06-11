export type IoTDevice = {
  id: string;
  deviceKey: string;
  label: string;
  firebaseDeviceKey: string;
  guardianCount: number;
};

export type RegisterIoTPayload = {
  label: string;
  firebaseDeviceKey: string;
};

export type RegisterIoTResponse = {
  deviceId: string;
  deviceKey: string;
  label: string;
  firebaseDeviceKey: string;
};

export type SosRequest = {
  latitude: number;
  longitude: number;
};
