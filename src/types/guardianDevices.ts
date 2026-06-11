export type GuardianDevice = {
  id: string;
  deviceKey: string;
  label: string;
};

export type CreateDevicePayload = {
  deviceKey: string;
  label: string;
};

export type UpdateDevicePayload = {
  label: string;
};
