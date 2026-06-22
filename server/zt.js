/**
 * ZeroTier 本地 API 客户端
 * 与 ZeroTier One 守护进程通信
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ZT_HOST = process.env.ZT_API_HOST || '127.0.0.1';
const ZT_PORT = process.env.ZT_API_PORT || '9993';
const ZT_DATA_DIR = process.env.ZT_DATA_DIR || '/var/lib/zerotier-one';

function getAuthToken() {
  try {
    return fs.readFileSync(path.join(ZT_DATA_DIR, 'authtoken.secret'), 'utf8').trim();
  } catch {
    return null;
  }
}

function ztRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const token = getAuthToken();
    const options = {
      hostname: ZT_HOST,
      port: parseInt(ZT_PORT, 10),
      path: apiPath,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    };
    if (token) options.headers['X-ZT1-Auth'] = token;
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('ZT API timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---- 公开 API ----
function getStatus()         { return ztRequest('GET', '/status'); }
function getPeers()          { return ztRequest('GET', '/peer'); }
function getNetworkList()    { return ztRequest('GET', '/network'); }
function getNetworkById(id)  { return ztRequest('GET', `/network/${id}`); }
function joinNetwork(id)     { return ztRequest('POST', `/network/${id}`); }
function leaveNetwork(id)    { return ztRequest('DELETE', `/network/${id}`); }

module.exports = {
  ztRequest, getAuthToken,
  getStatus, getPeers,
  getNetworkList, getNetworkById, joinNetwork, leaveNetwork,
  ZT_DATA_DIR,
};
