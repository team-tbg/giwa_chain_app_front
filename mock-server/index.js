/**
 * 나드리 로컬 목(mock) 인증 서버 — 백엔드 완성 전, 로그인 흐름을 끝까지 테스트하기 위한 임시 서버.
 * 실제 검증은 하지 않고, 받은 구글/토스 토큰을 디코드해 성공 응답을 돌려준다.
 * 실행: node mock-server/index.js  → http://localhost:3000/v1
 * (docs/11 §1 /auth/social 응답 형태를 그대로 흉내 냄. 백엔드 참고용으로도 사용 가능.)
 */
const http = require('http');
const PORT = 3000;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => resolve(b));
  });
}
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  cors(res);
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  const path = (req.url || '').replace(/\/+$/, '');

  if (req.method === 'POST' && path.endsWith('/auth/social')) {
    const body = JSON.parse((await readBody(req)) || '{}');
    const claims = body.idToken ? decodeJwt(body.idToken) : {};
    const email = claims.email || '';
    // 구글 id_token을 디코드해 실제 이름/이메일을 응답에 넣어줌
    const nickname = claims.name || (email ? email.split('@')[0] : '나드리회원');
    console.log(`[mock] /auth/social provider=${body.provider} email=${email || '(none)'}`);
    res.writeHead(200);
    return res.end(
      JSON.stringify({
        accessToken: 'mock.access.' + Date.now(),
        refreshToken: 'mock.refresh.' + Date.now(),
        expiresIn: 3600,
        isNewUser: true,
        user: {
          id: 'usr_mock_1',
          nickname,
          provider: body.provider || 'google',
          wallet: { upid: 'naduri7.up', address: '0x7A3f9B21C4dE8f0a45B7c9E1D2380Fa6b19C4E27', network: 'GIWA' },
        },
      }),
    );
  }

  if (req.method === 'POST' && path.endsWith('/auth/refresh')) {
    res.writeHead(200);
    return res.end(JSON.stringify({ accessToken: 'mock.access.' + Date.now(), refreshToken: 'mock.refresh', expiresIn: 3600 }));
  }
  if (req.method === 'POST' && path.endsWith('/auth/logout')) {
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'mock 서버: 아직 없는 경로예요 (' + path + ')' } }));
});

server.listen(PORT, () => console.log(`[mock] 나드리 목 인증 서버 → http://localhost:${PORT}/v1`));
