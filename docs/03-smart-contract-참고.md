# 스마트 컨트랙트 참고 (Uniswap)

> 참고 저장소:
> - Uniswap 조직: https://github.com/Uniswap
> - 컨트랙트 모노레포: https://github.com/Uniswap/contracts

## Uniswap/contracts 개요

"Collection of all Uniswap smart contracts" — Uniswap 프로토콜의 모든 스마트 컨트랙트를 관리하는 **모노레포**. 배포 설정·컴파일·패키지 관리를 담당한다.

- 언어 구성: Solidity(대부분), Rust, Python
- Foundry 기반 빌드/배포

## 저장소 구조

```
├── src/          - 스마트 컨트랙트 소스 코드
├── test/         - 테스트 파일
├── script/       - 배포 스크립트 및 CLI 도구
├── deployments/  - 배포 정보(주소 등) 저장소
├── lib/          - 의존성 라이브러리
└── broadcast/    - 배포 결과 로그
```

## 개발 환경 / 배포

- **Foundry** 설치 → `forge install` → `forge build`로 컴파일
- 배포 CLI: Node.js 18+, `just`, `cargo` 필요
- 코드 품질: pre-commit 훅 + Prettier 포매팅
- 기여 가이드: `CONTRIBUTING.md`

## 우리 프로젝트에서의 활용 포인트

- **AMM/DEX 트랙(Track 01 DeFi)** 을 고려한다면 Uniswap v2/v3/v4 컨트랙트 패턴이 핵심 참고 대상
- GIWA는 EVM 호환 L2이므로 Uniswap 컨트랙트를 **그대로 포팅/배포** 가능성이 높음
  - `deployments/` 구조를 참고해 GIWA 테스트넷/메인넷 배포 주소 관리 체계 구축
- 프론트 연동 관점:
  - Uniswap의 컨트랙트 ABI/주소를 기준으로 `viem`/`wagmi` 훅 구성
  - 라우터/풀/포지션 매니저 인터페이스를 참고해 스왑·유동성 UI 데이터 모델 설계

## 관련 Uniswap 저장소 (참고)

- `Uniswap/v4-core`, `Uniswap/v4-periphery` — 최신 v4 아키텍처(Hooks)
- `Uniswap/v3-core`, `Uniswap/v3-periphery` — v3 집중 유동성
- `Uniswap/sdk-core`, `Uniswap/v3-sdk`, `Uniswap/v4-sdk` — 프론트에서 쓰는 TS SDK
- `Uniswap/interface` — Uniswap 프론트엔드(웹 앱) 참고

> TODO: 우리가 DeFi 트랙으로 갈지 확정되면, 사용할 Uniswap 버전(v2/v3/v4)과 GIWA 배포 전략을 이 문서에 구체화.
