# react-beautiful-dnd

드래그 앤 드롭 라이브러리. 입력 장치의 이벤트를 드래그 동작으로 바꾸고, 목록 안과 목록 사이의 이동을 계산한다.

## Language

### 입력

**Sensor**:
한 종류의 입력 장치(mouse, touch, keyboard)가 보내는 이벤트를 드래그 동작으로 바꾸는 hook.
_Avoid_: input handler, drag handle (drag handle은 사용자가 잡는 요소)

**Lock**:
한 번에 하나의 드래그만 허용하기 위한 독점 권한. 드래그를 시작하려는 Sensor가 먼저 얻어야 한다.
_Avoid_: mutex, claim

**Capture**:
Sensor가 드래그 시작 이벤트를 기다리는 상태. 드래그가 끝나면 다시 Capture로 돌아간다.
_Avoid_: listening, armed

**Phase**:
mouse와 touch Sensor가 한 번의 드래그 동안 거치는 단계. IDLE, PENDING, DRAGGING 중 하나다.
_Avoid_: state, stage

**Pending drag**:
Lock은 얻었지만 아직 요소를 들어 올리지 않은 Phase. mouse는 이동 임계값, touch는 long press 시간을 넘기면 끝난다.
_Avoid_: pre-drag state

**Stop**:
Lock이 해제되어 Sensor가 Capture로 돌아가는 동작. 드래그 결과(drop, cancel)는 포함하지 않는다.
_Avoid_: end, finish

**Cancel**:
Stop과 함께 진행 중인 드래그를 원래 위치로 되돌리는 동작.
_Avoid_: abort (Pending drag를 버릴 때의 actions 이름으로만 쓴다)
