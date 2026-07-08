import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = 5000;
const FALLBACK_API_BASE_URL = 'https://pg-web-app-production.up.railway.app/api';
const FALLBACK_LAN_HOST = '192.168.4.60';

function getExpoExtra() {
  const constants = Constants as any;
  return constants.expoConfig?.extra || constants.manifest?.extra || {};
}

function getExpoHost() {
  const constants = Constants as any;
  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri ||
    constants.manifest?.debuggerHost ||
    constants.manifest?.hostUri ||
    '';

  if (typeof hostUri !== 'string' || !hostUri) return '';

  const withoutProtocol = hostUri.replace(/^[a-zA-Z]+:\/\//, '');
  return withoutProtocol.includes(':')
    ? withoutProtocol.split(':')[0]
    : withoutProtocol;
}

function getApiHost() {
  const configuredHost = getExpoExtra().apiHost;
  if (typeof configuredHost === 'string' && configuredHost.trim()) {
    return configuredHost.trim();
  }

  if (Platform.OS === 'android' && !getExpoHost()) {
    return '10.0.2.2';
  }

  return getExpoHost() || FALLBACK_LAN_HOST;
}

function getApiBaseUrl() {
  const configuredBaseUrl = getExpoExtra().apiBaseUrl;
  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
    return configuredBaseUrl.trim().replace(/\/$/, '');
  }

  const host = getApiHost();
  if (!host || host === FALLBACK_LAN_HOST) {
    return FALLBACK_API_BASE_URL;
  }

  return `http://${host}:${getApiPort()}/api`;
}

function getApiPort() {
  const configuredPort = getExpoExtra().apiPort;
  return configuredPort ? Number(configuredPort) : DEFAULT_API_PORT;
}

export const API_BASE_URL = getApiBaseUrl();

console.log('[API] Base URL:', API_BASE_URL);
