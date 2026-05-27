# League Studio Agent

League Studio Agent는 [League Studio 프로젝트](https://github.com/jyaniee/league-studio)에서 사용하는 플레이어 측 데이터 수집기입니다.

이 Agent는 선수 또는 테스트 클라이언트 PC에서 실행되며, Riot Live Client Data API를 통해 로컬 게임 클라이언트의 실시간 데이터를 읽고 필요한 이벤트 데이터를 수집합니다.

## Purpose

League Studio는 리그 오브 레전드 비공식 경기나 학교 대회에서도 방송용 오버레이를 사용할 수 있도록 만드는 프로젝트입니다.

기존 구조에서는 관전자 PC의 Live Client Data API를 통해 데이터를 수집하려 했지만, 관전자 환경에서는 `DragonKill` 등 일부 오브젝트 이벤트가 누락되는 문제가 확인되었습니다.

이를 보완하기 위해 플레이어 클라이언트 기준 Live Client Data API를 읽는 별도 Agent를 구성했습니다.

## Core Responsibilities

- 로컬 Live Client Data API 호출
- `allgamedata` 응답 수집
- `DragonKill`, `BaronKill`, `HeraldKill`, `HordeKill` 등 오브젝트 이벤트 추출
- `killerName` 기반 오브젝트 획득 팀 판별
- Live Client API 원본 이벤트를 서버 전송용 이벤트 형식으로 변환
- 드래곤 타입 정규화
- Agent 실행 상태 로그 출력
- 옵션 기반 League Studio Server 이벤트 전송

현재 단계에서는 콘솔 출력으로 이벤트 수집 결과를 확인할 수 있으며, `SEND_TO_SERVER=true` 설정 시 League Studio Server로 이벤트 전송을 시도합니다.

## Data Source

Agent는 아래 Riot Live Client Data API 엔드포인트를 사용합니다.

```txt
https://127.0.0.1:2999/liveclientdata/allgamedata
```
이 API는 리그 오브 레전드 게임 클라이언트가 실행 중이고, 실제 게임에 접속해 있는 상태에서 사용할 수 있습니다.

## Getting Started
### 1. Install dependencies
```bash
pnpm install
```
### 2. Create environment file
`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
```bash
cp .env.example .env
```
Windows PowerShell에서는 아래 명령어를 사용할 수 있습니다.
```powershell
Copy-Item .env.example .env
```
### 3. Run Agent
```Bash
pnpm dev
```

## Environment Variables
```env
LIVE_CLIENT_API_URL=https://127.0.0.1:2999/liveclientdata/allgamedata
POLL_INTERVAL_MS=1000
STATUS_LOG_INTERVAL_MS=10000
ALLOW_INSECURE_LOCAL_TLS=true

SEND_TO_SERVER=false
SERVER_INGEST_URL=http://localhost:3001/agent/objective-events
MATCH_ID=local-test-match
AGENT_ID=player-agent-1
```
| Name | Description |
| --- | --- |
| `LIVE_CLIENT_API_URL` | Riot Live Client Data API의 `allgamedata` 엔드포인트 |
| `POLL_INTERVAL_MS` | Live Client Data API를 조회하는 주기입니다. 단위는 ms입니다. |
| `STATUS_LOG_INTERVAL_MS` | Agent 실행 상태 로그를 출력하는 주기입니다. 단위는 ms입니다. |
| `ALLOW_INSECURE_LOCAL_TLS` | 로컬 Live Client API 호출 시 HTTPS 인증서 검증을 우회할지 여부입니다. |
| `SEND_TO_SERVER` | 수집한 오브젝트 이벤트를 League Studio Server로 전송할지 여부입니다. |
| `SERVER_INGEST_URL` | League Studio Server의 Agent 이벤트 수신 엔드포인트입니다. |
| `MATCH_ID` | 서버로 전송되는 이벤트 payload에 포함할 경기 식별자입니다. |
| `AGENT_ID` | 서버로 전송되는 이벤트 payload에 포함할 Agent 식별자입니다. |


## Example Output
Agent가 정상적으로 실행되고 Live Client API에 연결되면 다음과 같은 상태 로그가 출력됩니다.
```
[STATUS] Connected | polls: 9 | objective events: 2 | last event id: 3
[STATUS] Connected | polls: 19 | objective events: 2 | last event id: 3
```
오브젝트 이벤트가 감지되면 다음과 같이 출력됩니다.
```bash
[OBJECTIVE EVENT] {
  eventId: 14,
  eventTime: 834.3678588867188,
  objective: 'dragon',
  rawEventName: 'DragonKill',
  team: 'blue',
  killerName: 'JhAn',
  dragonType: 'hextech',
  rawDragonType: 'Hextech',
  stolen: false
}
```
공허 유충 이벤트는 Live Client API에서 `HordeKill`로 전달되며, Agent 내부에서는 `voidgrub`으로 변환됩니다.
```bash
[OBJECTIVE EVENT] {
  eventId: 3,
  eventTime: 76.77731323242188,
  objective: 'voidgrub',
  rawEventName: 'HordeKill',
  team: 'blue',
  killerName: 'JhAn',
  dragonType: undefined,
  rawDragonType: undefined,
  stolen: false
}
```
`SEND_TO_SERVER=true`인 경우 이벤트 전송에 성공하면 다음과 같은 로그가 출력됩니다.
```
[SEND] Objective event sent to server: 14
```

## Event Mapping
| Live Client Event | Agent Objective Type | 설명 |
| --- | --- | --- |
| `DragonKill` | `dragon` | 드래곤 처치 이벤트 |
| `BaronKill` | `baron` | 바론 처치 이벤트 |
| `HeraldKill` | `herald` | 협곡의 전령 처치 이벤트 |
| `HordeKill` | `voidgrub` | 공허 유충 처치 이벤트 |

## Dragon Type Mapping
| Live Client DragonType | Agent DragonType | 설명 |
| --- | --- | --- |
| `Air` | `cloud` | 바람 드래곤 |
| `Fire` | `infernal` | 화염 드래곤 |
| `Earth` | `mountain` | 대지 드래곤 |
| `Water` | `ocean` | 바다 드래곤 |
| `Hextech` | `hextech` | 마법공학 드래곤 |
| `Chemtech` | `chemtech` | 화학공학 드래곤 |
| `Elder` | `elder` | 장로 드래곤 |

## Related Repository
[League Studio](https://github.com/jyaniee/league-studio)
