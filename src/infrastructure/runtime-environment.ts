/** Runtime capabilities are decided by the build, never by a URL or persisted flag. */
export const isDevelopmentSandbox =
  typeof __ATLAS_DEVELOPMENT_SANDBOX__ !== 'undefined' && __ATLAS_DEVELOPMENT_SANDBOX__;

/** Remote account services stay completely dormant in the development sandbox. */
export const remoteAccountServicesEnabled = !isDevelopmentSandbox;
