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
- Agent 실행 상태 로그 출력
- 추후 League Studio Server로 이벤트 데이터 전송

현재 단계에서는 서버 전송 전에 콘솔 출력 기반으로 이벤트 수집 가능 여부를 검증합니다.

## Data Source

Agent는 아래 Riot Live Client Data API 엔드포인트를 사용합니다.

```txt
https://127.0.0.1:2999/liveclientdata/allgamedata
```
이 API는 리그 오브 레전드 게임 클라이언트가 실행 중이고, 실제 게임에 접속해 있는 상태에서 사용할 수 있습니다.

## Getting Stated
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
```PowerShell
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
```
| Name                       | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `LIVE_CLIENT_API_URL`      | Live Client Data API endpoint                         |
| `POLL_INTERVAL_MS`         | API polling interval in milliseconds                  |
| `STATUS_LOG_INTERVAL_MS`   | Status log output interval in milliseconds            |
| `ALLOW_INSECURE_LOCAL_TLS` | Allows local HTTPS certificate bypass for development |


## Example Output
Agent가 정상적으로 실행되고 Live Client API에 연결되면 다음과 같은 상태 로그가 출력됩니다.
```
[STATUS] Connected | polls: 9 | objective events: 2 | last event id: 3
[STATUS] Connected | polls: 19 | objective events: 2 | last event id: 3
```
오브젝트 이벤트가 감지되면 다음과 같이 출력됩니다.
```json
[OBJECTIVE EVENT] {
  eventId: 25,
  eventName: 'DragonKill',
  eventTime: 552.2943725585938,
  killerName: 'JhAn',
  dragonType: 'Water'
}
```

## Related Repository
League Studio 메인 리포지토리:
https://github.com/jyaniee/league-studio
