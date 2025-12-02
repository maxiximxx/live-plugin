# 直播H5 - 接口与 SDK 说明

## 概述

本文档说明直播H5中调用的接口和使用的第三方 SDK，包括接口触发时机、参数来源和 SDK 参数配置。

---

## 外部传入参数汇总

直播H5需要以下外部传入参数：

### URL 查询参数

| 参数名 | 类型 | 是否必填 | 说明 | 使用位置 |
|--------|------|----------|------|----------|
| `id` | `string` | 是 | 教室ID，从地址栏 `?id=xxx` 获取 | 获取教室信息接口、[获取用户信息](#1-获取用户信息)接口 |
| `role` | `string` | 是 | 用户角色，从地址栏 `?role=xxx` 获取（0=学生，1=讲师，2=助教）<br>**注意**：移动端仅支持学生（role=0），讲师和助教请使用PC端 | [获取用户信息](#1-获取用户信息)接口（转换为identity） |
| `account` | `string` | 否 | 用户账号，从地址栏 `?account=xxx` 获取 | [获取用户信息](#1-获取用户信息)接口（可选参数） |
| `token` | `string` | 是 | 来源token，从地址栏 `?token=xxx` 获取 | [获取用户信息](#1-获取用户信息)接口（作为请求头） |
| `planId` | `string` | 否 | 计划ID，从地址栏 `?planId=xxx` 获取，用于回放功能 | 回放功能判断 |

### Cookie 参数

| 参数名 | 类型 | 是否必填 | 说明 | 使用位置 |
|--------|------|----------|------|----------|
| `aui_live_room_id` | `string` | 是 | 直播间ID，从Cookie中解析获取 | 获取直播间详情接口 |

### localStorage 参数

| 参数名 | 类型 | 是否必填 | 说明 | 使用位置 |
|--------|------|----------|------|----------|
| `aui_classroom_uuid` | `string` | 否 | 设备ID，从localStorage获取，如果不存在则生成新的UUID并保存 | 获取IM Token接口 |

### sessionStorage 参数

| 参数名 | 类型 | 是否必填 | 说明 | 使用位置 |
|--------|------|----------|------|----------|
| `SOURCE_TOKEN` | `string` | 是 | 来源token，从URL参数 `token` 存储到sessionStorage | [获取用户信息](#1-获取用户信息)接口（作为请求头） |
| `PLAN_ID` | `string` | 否 | 计划ID，从URL参数 `planId` 存储到sessionStorage | 回放功能判断 |

---

## 接口调用（按执行顺序）

### 1. 获取用户信息

**触发时机**: 
- 登录流程中，在进入教室前调用

**接口信息**:
- **类型**: `GET`
- **URL**: `/live-application/api/v1/class/getUserInfoAndValid`

**请求参数**:
| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `classId` | `string` | URL查询参数 `id` | 教室ID，从地址栏 `?id=xxx` 获取 |
| `identity` | `string` | URL查询参数 `role` 转换 | 用户身份，从地址栏 `?role=xxx` 获取并转换为identity<br>**转换规则**：`role=0`(学生) → `identity='1'`，`role=1`(讲师) → `identity='3'`，`role=2`(助教) → `identity='2'` |
| `account` | `string` | URL查询参数 `account`（可选） | 用户账号，从地址栏 `?account=xxx` 获取 |
| `token` | `string` | sessionStorage的 `SOURCE_TOKEN` | 来源token，从地址栏 `?token=xxx` 获取，存储到sessionStorage后作为请求头 |

**返回数据**:
```typescript
{
  user_id: string;    // 用户ID
  user_name: string;  // 用户名称
  // ... 其他字段
}
```

---

### 2. 登录

**触发时机**: 
- [获取用户信息](#1-获取用户信息)后，进入教室前调用

**接口信息**:
- **类型**: `POST`
- **URL**: `/live-application/api/v1/class/login`

**请求参数**:
| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `username` | `string` | "[获取用户信息](#1-获取用户信息)"接口返回的 `user_name` | 用户名，来自 `/v1/class/getUserInfoAndValid` 接口返回的 `user_name` 字段 |
| `password` | `string` | 示例逻辑中与 `username` 相同 | 密码，当前示例逻辑中 `password = username`（实际开发应使用SSO/OAuth2等方案，请勿使用明文密码） |

**返回数据**:
```typescript
{
  token: string;   // 认证token
  expire: string;  // token过期时间
}
```

**说明**: 登录成功后，会将 `userId`、`userName`、`identity`、`authToken` 等信息保存到服务实例中，供后续接口使用。

---

### 3. 获取教室信息

**触发时机**: 
- 教室模块初始化时调用
- 用于获取教室的完整信息，包括播放地址、IM群组ID等

**接口调用流程**:
> **重要**: 这是一个业务流程，需要**按顺序调用两个接口**，然后将返回的数据合并。**不是选择其中一个，而是两个都必须调用**。

**步骤1 - 获取教室详情（内部接口）**:
- **类型**: `POST`
- **URL**: `/live-application/api/v1/class/get`

**请求参数**:

| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `id` | `string` | URL查询参数 `id` | 教室ID，从地址栏 `?id=xxx` 获取 |
| `user_id` | `string` | services 实例的 `this.userId` | 当前用户ID，在"登录"接口调用后设置到 services 实例中 |

**步骤2 - 获取直播间详情（外部接口）**:
- **类型**: `GET`
- **URL**: `/live-application/api/liveRooms/{liveRoomId}`

**请求参数**:

| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `liveRoomId` | `string` | Cookie中的 `aui_live_room_id` | 直播间ID，作为URL路径参数，从Cookie中解析获取 |

**数据合并**:
- 先调用步骤1获取教室基础信息
- 再调用步骤2获取直播间配置信息
- 将步骤2返回的字段合并到步骤1返回的对象中：
  - `liveIntroduce` (直播间简介)
  - `refreshEnabled` (是否开启评论审核)
  - `livePlaceholderEnabled` (是否开启直播垫片)
  - `livePlaceholderType` (垫片类型)
  - `livePlaceholderUrl` (垫片地址)
  - `liveRoomId` (直播间ID，来自步骤2的 `id` 字段)
  - `status` (课程状态)

**返回数据** (合并后的 `IClassroomInfo`):
```typescript
{
  id: string;                    // 教室ID
  liveRoomId: string;            // 直播间ID
  aliyunId?: string;              // 阿里云IM群组ID
  rongCloudId?: string;           // 融云IM群组ID
  teacherId: string;              // 教师ID
  teacherNick: string;            // 教师昵称
  assistantId?: string;           // 助教ID
  title: string;                  // 教室标题
  mode: ClassroomModeEnum;        // 教室模式（0=公开课，1=大班课）
  status: ClassroomStatusEnum;    // 教室状态
  notice: string;                 // 公告
  coverUrl: string;               // 封面图片
  liveIntroduce: string;         // 直播间简介（来自接口2）
  refreshEnabled: string;          // 是否开启评论审核（来自接口2）
  livePlaceholderEnabled: string; // 是否开启直播垫片（来自接口2）
  livePlaceholderType: string;    // 垫片类型（来自接口2）
  livePlaceholderUrl: string;      // 垫片地址（来自接口2）
  // 播放地址相关
  linkInfo?: {                    // 连麦信息（公开课/大班课）
    rtcPullUrl: string;
    rtcPushUrl: string;
    cdnPullInfo: {                // CDN拉流地址（用于构建cdnUrlMap）
      flvUrl: string;
      hlsUrl: string;
      rtsUrl: string;
      rtmpUrl: string;
      flvScreenUrl: string;        // 课件流地址
      hlsScreenUrl: string;
      rtsScreenUrl: string;
      rtmpScreenUrl: string;
    };
  };
  shadowLinkInfo?: {              // 混流信息（大班课）
    rtcPullUrl: string;
    rtcPushUrl: string;
    cdnPullInfo: {                // CDN拉流地址（用于构建cdnUrlMap）
      flvUrl: string;
      hlsUrl: string;
      rtsUrl: string;
      rtmpUrl: string;
      flvScreenUrl: string;
      hlsScreenUrl: string;
      rtsScreenUrl: string;
      rtmpScreenUrl: string;
    };
  };
  teacherLinkInfo?: {             // 教师流信息（大班课）
    rtcPullUrl: string;
    rtcPushUrl: string;
    cdnPullInfo: {                // CDN拉流地址（用于构建cdnUrlMap）
      flvUrl: string;
      hlsUrl: string;
      rtsUrl: string;
      rtmpUrl: string;
      flvScreenUrl: string;
      hlsScreenUrl: string;
      rtsScreenUrl: string;
      rtmpScreenUrl: string;
    };
  };
  // ... 其他字段
}
```

**说明**: 
- **必须同时调用两个接口**：先调用步骤1获取教室基础信息，再调用步骤2获取直播间配置，最后合并数据
- 步骤1返回：教室ID、教师信息、播放地址（`linkInfo`、`shadowLinkInfo`、`teacherLinkInfo`）、IM群组ID等
- 步骤2返回：直播间配置信息（简介、审核设置、垫片配置等）
- 合并后的完整对象用于后续的播放器初始化和IM服务初始化
- `linkInfo.cdnPullInfo`、`shadowLinkInfo.cdnPullInfo`、`teacherLinkInfo.cdnPullInfo` 用于构建播放器的 `cdnUrlMap` 参数

---

### 4. 获取IM Token

**触发时机**: 
- 初始化IM消息服务时调用
- 在获取教室信息成功后调用

**接口信息**:
- **类型**: `POST`
- **URL**: `/live-application/api/v2/class/token`

**请求参数**:
| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `user_id` | `string` | services 实例的 `this.userId` | 用户ID，在"登录"接口调用后设置到 services 实例中。如果调用时传入了 `userId` 参数则使用传入值，否则使用 `this.userId` |
| `device_type` | `string` | 固定值 `'web'` | 设备类型 |
| `device_id` | `string` | localStorage 的 `aui_classroom_uuid` | 设备ID，从 localStorage 获取 `aui_classroom_uuid`，如果不存在则生成新的 UUID 并保存到 localStorage |
| `im_server` | `string[]` | `getIMServer()` 函数返回 | IM服务器列表，根据配置文件中的 IM 服务配置返回（如 `['aliyunIMV2']`） |
| `role` | `string` | 调用时传入（可选） | 角色，管理员时为 `'admin'`，普通用户为 `undefined` |

**返回数据** (转换为驼峰命名):
```typescript
{
  aliyunIMV2: {
    appId: string;
    appSign: string;
    appToken: string;
    auth: {
      nonce: string;
      role: string;
      timestamp: number;
      userId: string;
    };
  };
  aliyunIMV1?: {
    accessToken: string;
    refreshToken: string;
  };
  rongCloud?: {
    accessToken: string;
  };
}
```

---

### 5. 获取直播间文件列表

**触发时机**: 
- 页面/模块初始化时
- 仅在切换到文件标签页时触发

**接口信息**:
- **类型**: `GET`
- **URL**: `/live-application/api/liveRoom/attachments`

**请求参数**:
| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `liveRoomId` | `string` | services 实例的 `this.liveRoomId` | 直播间ID，在"获取直播间详情"接口调用后设置到 services 实例中 |
| `pageIndex` | `number` | 固定值 `1` | 页码 |
| `pageSize` | `number` | 固定值 `1000` | 每页数量 |

**返回数据**:
```typescript
Array<{
  id: string;        // 文件ID
  name: string;      // 文件名称
  fileUrl: string;   // 文件下载地址
  createTime: string; // 创建时间
}>
```

---

### 6. 发送聊天消息

**触发时机**: 
- 用户在聊天输入框按 Enter 键时
- 需要满足条件: `allowChat === true` 且 `!groupMuted` 且 `!selfMuted`

**条件参数说明**:

1. **`allowChat`** - 是否允许聊天
   - **判断逻辑**: 当课程状态为 `0` 或 `1` 时为 `true`
   - **status 字段来源**: 来自"获取直播间详情"接口返回的 `status` 字段

2. **`groupMuted`** - 全员禁言状态
   - **来源**: IM SDK 的 `queryMuteStatus()` 方法（初始化时查询）或 IM SDK 的 `onMuteGroup`/`onUnmuteGroup` 事件（实时更新）

3. **`selfMuted`** - 个人禁言状态
   - **来源**: IM SDK 的 `queryMuteStatus()` 方法（初始化时查询）或 IM SDK 的 `onMuteUser`/`onUnmuteUser` 事件（实时更新，需判断是否为当前用户）

**接口信息**:
- **类型**: `POST`
- **URL**: `/live-application/api/liveRoom/comments`

**请求参数**:
| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `content` | `string` | 用户输入 | 消息内容，用户在聊天输入框中输入 |
| `identity` | `string` | services 实例的 `this.identity` | 用户身份标识，在"[获取用户信息](#1-获取用户信息)"接口调用后设置到 services 实例中 |
| `liveRoomId` | `string` | services 实例的 `this.liveRoomId` | 直播间ID，在"获取直播间详情"接口调用后设置到 services 实例中 |
| `userId` | `string` | services 实例的 `this.userId` | 用户ID，在"登录"接口调用后设置到 services 实例中 |
| `name` | `string` | services 实例的 `this.userName` | 用户名称，在"登录"接口调用后设置到 services 实例中 |

**返回数据**: 无特殊返回，成功时显示 toast 提示

---

## 完整执行流程

### 阶段1: 页面初始化与参数准备

1. **页面加载**
   - 从URL查询参数获取：`id`（教室ID）、`role`（用户角色）、`account`（可选，用户账号）、`token`（来源token）、`planId`（可选，计划ID）
   - **参数校验**：
     - 如果缺少 `id` 参数，显示错误提示"参数异常，请检查！"并停止后续流程
     - 如果缺少 `role` 参数，默认设置为 `0`（学生）
   - **角色校验**：检查 `role` 参数，移动端仅支持学生（`role=0`），如果为讲师（`role=1`）或助教（`role=2`），显示提示"只有学生才能在移动端登录"并退出
   - 从Cookie获取：`aui_live_room_id`（直播间ID）
   - 从localStorage获取：`aui_classroom_uuid`（设备ID，如果不存在则生成新的UUID）
   - 将 `token` 存储到 sessionStorage 的 `SOURCE_TOKEN`
   - 将 `planId` 存储到 sessionStorage 的 `PLAN_ID`（如果存在）
   - **role转identity**：将 `role` 转换为 `identity`（`role=0`→`identity='1'`，`role=1`→`identity='3'`，`role=2`→`identity='2'`）

### 阶段2: 用户认证与信息获取

2. **[获取用户信息](#1-获取用户信息)**（接口1）
   - 使用URL参数 `id`（教室ID）、转换后的 `identity`（从role转换）、`account`（可选）
   - 使用sessionStorage的 `SOURCE_TOKEN` 作为请求头
   - 返回：`user_id`、`user_name`
   - 将 `identity` 设置到 services 实例中

3. **登录**（接口2）
   - 使用"[获取用户信息](#1-获取用户信息)"接口返回的 `user_name` 作为 `username` 和 `password`
   - 返回：`token`、`expire`
   - 将 `userId`、`userName`、`authToken` 保存到 services 实例中

### 阶段3: 教室信息获取

4. **获取教室信息**（接口3）
   - **步骤1 - 获取教室详情**：
     - 使用URL参数 `id`（教室ID）
     - 使用services实例的 `userId`
     - 返回：教室基础信息（ID、教师信息、播放地址、IM群组ID等）
   
   - **步骤2 - 获取直播间详情**：
     - 使用Cookie中的 `aui_live_room_id`（直播间ID）
     - 返回：直播间配置信息（简介、审核设置、垫片配置等）
   
   - **数据合并**：
     - 将步骤2的字段合并到步骤1返回的对象中
     - 将 `liveRoomId` 设置到 services 实例中
     - 保存完整的 `classroomInfo` 到状态管理

### 阶段4: IM消息服务初始化

5. **获取IM Token**（接口4）
   - 使用services实例的 `userId`
   - 使用localStorage的 `aui_classroom_uuid`（设备ID）
   - 使用配置文件中的IM服务器列表
   - 返回：IM Token配置（aliyunIMV2、rongCloud等）
   - 配置IM SDK的Token

6. **初始化IM SDK**
   - 使用"获取教室信息"接口返回的 `aliyunId` 或 `rongCloudId`（群组ID）
   - 使用"获取IM Token"接口返回的Token配置
   - 使用services实例的 `userId`、`userName` 登录IM服务
   - 加入IM群组

### 阶段5: 播放器初始化

7. **构建播放地址映射（cdnUrlMap）**
   - 从 `classroomInfo` 中提取播放地址：
     - **公开课模式**：使用 `linkInfo.cdnPullInfo`
     - **大班课模式**：根据是否支持WebRTC，使用 `teacherLinkInfo.cdnPullInfo` 或 `shadowLinkInfo.cdnPullInfo`
   - 根据平台类型（移动端/PC端）和 `rtsFirst` 参数选择播放地址

8. **初始化播放器**
    - 使用构建好的 `cdnUrlMap`
    - 移动端优先选择 `hlsUrl`，PC端优先选择 `flvUrl`
    - 如果 `rtsFirst === true`，优先使用 `rtsUrl`
    - 特殊浏览器（夸克/UC）强制降级，不使用RTS

### 阶段6: 页面渲染与用户交互

9. **页面渲染**
    - **回放功能判断**：检查课程状态是否为已结束（`status === 2`）且存在 `PLAN_ID`，如果满足条件则显示回放组件，否则显示直播组件
    - 根据教室模式（公开课/大班课）渲染对应组件
    - 显示播放器、聊天面板、文件列表、简介等

10. **获取直播间文件列表**（接口5，切换到文件标签页时）
    - 使用services实例的 `liveRoomId`
    - 返回：文件列表
    - 显示在文件标签页

11. **用户操作 - 发送聊天消息**（接口6）
    - 用户在聊天输入框输入内容并按Enter键
    - 检查条件：`allowChat === true` 且 `!groupMuted` 且 `!selfMuted`
    - 使用用户输入的内容
    - 使用services实例的 `identity`、`liveRoomId`、`userId`、`userName`
    - 发送消息到服务器

### 阶段7: 实时消息监听

12. **IM消息监听**
    - 监听禁言/取消禁言消息，更新 `groupMuted` 和 `selfMuted` 状态

---

## 第三方 SDK 使用

### 1. 阿里云播放器 SDK (Aliplayer)

**SDK 文件**:
- 播放器 SDK: 通过 CDN 加载 `Aliplayer`
- RTS SDK: `https://g.alicdn.com/apsara-media-box/imp-web-rts-sdk/2.6.2/aliyun-rts-sdk.js`

**初始化时机**: 
- 播放器模块初始化且 `cdnUrlMap` 存在时
- 监听 `cdnUrlMap` 变化时触发

**`cdnUrlMap` 说明**:
- **类型**: `ICdnUrlMap`，是一个对象，包含两种流类型的播放地址映射
- **结构**:
  ```typescript
  {
    [SourceType.Material]?: {  // 课件流（屏幕共享）
      flvScreenUrl: string;
      hlsScreenUrl: string;
      rtsScreenUrl: string;
      // ... 其他格式URL
    };
    [SourceType.Camera]?: {     // 摄像头流
      flvUrl: string;
      hlsUrl: string;
      rtsUrl: string;
      // ... 其他格式URL
    };
  }
  ```
- **数据来源**: 从"获取教室信息"接口返回的 `classroomInfo` 中提取
  - **公开课模式**: `linkInfo.cdnPullInfo`
  - **大班课模式**: `teacherLinkInfo.cdnPullInfo` 或 `shadowLinkInfo.cdnPullInfo`

**SDK 参数配置**:

| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `id` | `string` | 传入参数 `id` | 播放器容器ID |
| `source` | `string` | 从 `cdnUrlMap` 计算得出 | 主播放地址 |
| `rtsFallbackSource` | `string` | 从 `cdnUrlMap` 计算得出 | RTS 降级地址 |
| `isLive` | `boolean` | 固定值 `true` | 直播模式 |
| `autoplay` | `boolean` | 固定值 `true` | 自动播放 |
| `useH5Prism` | `boolean` | 固定值 `true` | 使用H5播放内核 |
| `rtsSdkUrl` | `string` | 固定值 (见上方) | RTS SDK地址 |
| `controlBarVisibility` | `string` | 传入参数 `controlBarVisibility` 或默认值 | 控制栏可见性 |
| `onRtsFallback` | `function` | 传入参数 `onRtsFallback` | RTS降级回调 |

**播放地址 (`source`) 参数来源追踪**:

1. **公开课模式** (`PublicClass`):
   ```
   linkInfo.cdnPullInfo 
   → 来源: 获取教室信息接口返回的 classroomInfo.linkInfo.cdnPullInfo
   → 包含: flvUrl, hlsUrl, rtsUrl, rtmpUrl 等
   ```

2. **大班课模式** (`BigClass`):
   - **支持 WebRTC 时**:
     - 课件流: `teacherLinkInfo.cdnPullInfo` → `flvScreenUrl/hlsScreenUrl/rtsScreenUrl`
     - 摄像头流: `shadowLinkInfo.cdnPullInfo` 或 `teacherLinkInfo.cdnPullInfo` (根据是否有互动) → `flvUrl/hlsUrl/rtsUrl`
   - **不支持 WebRTC 时**:
     - 混流: `shadowLinkInfo.cdnPullInfo` → `flvScreenUrl/hlsScreenUrl`

3. **地址选择逻辑**:
   - 移动端优先: `hlsUrl` → `flvUrl` (降级)
   - PC端优先: `flvUrl` → `hlsUrl` (降级)
   - 如果 `rtsFirst === true`: 优先使用 `rtsUrl`
   - 特殊浏览器 (夸克/UC): 强制降级，不使用 RTS

---

### 2. AUIMessage SDK (IM 消息服务)

**SDK 类型** (根据配置启用):
- **阿里云 IM V2** (`aliyunIMV2`): 默认启用，primary
- **融云 IM** (`rongCloud`): 可选
- **阿里云 IM V1** (`aliyunIMV1`): 已废弃

**初始化时机**: 
- 在初始化IM消息服务时初始化
- 初始化时机: 获取教室信息成功后

**SDK 参数配置**:

#### 2.1 初始化参数 (构造函数)

| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `aliyunIMV2.enable` | `boolean` | 配置文件 | 是否启用阿里云IM V2 |
| `aliyunIMV2.primary` | `boolean` | 配置文件 | 是否为主消息服务 |
| `rongCloud.enable` | `boolean` | 配置文件 | 是否启用融云 |
| `rongCloud.appKey` | `string` | 配置文件 | 融云 AppKey |

#### 2.2 Token 配置

**调用时机**: "获取IM Token"接口返回后

**Token 来源**: 来自"获取IM Token"接口返回的数据

#### 2.3 登录参数

**调用时机**: Token配置和初始化成功后

**参数**:
| 参数名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `userId` | `string` | `userInfo.userId` | 用户ID |
| `userNick` | `string` | `userInfo.userName` | 用户昵称 |
| `userAvatar` | `string` | `userInfo.userAvatar` (可选) | 用户头像 |

#### 2.4 群组ID

**调用时机**: 登录成功后

**参数来源**:
- **阿里云 IM V2**: `classroomInfo.aliyunId` (从获取教室信息接口返回)
- **融云 IM**: `classroomInfo.rongCloudId` (从获取教室信息接口返回)
- **阿里云 IM V1**: `classroomInfo.aliyunId` (从获取教室信息接口返回)

---

## 数据流转图

```
外部传入参数
├── URL查询参数: id, role, account, token, planId
├── Cookie: aui_live_room_id
└── localStorage: aui_classroom_uuid

↓

阶段1: 参数准备
├── 存储 token → sessionStorage.SOURCE_TOKEN
└── 存储 planId → sessionStorage.PLAN_ID

↓

阶段2: 用户认证
├── 接口1: [获取用户信息](#1-获取用户信息)
│   ├── 输入: id, role, account, token
│   └── 输出: user_id, user_name
│   └── 设置: services.identity
│
└── 接口2: 登录
    ├── 输入: user_name (作为username和password)
    └── 输出: token, expire
    └── 设置: services.userId, services.userName, services.authToken

↓

阶段3: 教室信息获取
└── 接口3: 获取教室信息
    ├── 步骤1: 获取教室详情
    │   ├── 输入: id, userId
    │   └── 输出: 教室基础信息（播放地址、IM群组ID等）
    │
    └── 步骤2: 获取直播间详情
        ├── 输入: liveRoomId (Cookie)
        └── 输出: 直播间配置信息
        └── 合并数据 → classroomInfo
        └── 设置: services.liveRoomId

↓

阶段4: IM服务初始化
├── 接口4: 获取IM Token
│   ├── 输入: userId, deviceId, im_server
│   └── 输出: IM Token配置
│
└── 初始化IM SDK
    ├── 配置Token
    ├── 登录IM (userId, userName)
    └── 加入群组 (aliyunId/rongCloudId)

↓

阶段5: 播放器初始化
├── 构建cdnUrlMap
│   ├── 公开课: linkInfo.cdnPullInfo
│   └── 大班课: teacherLinkInfo.cdnPullInfo / shadowLinkInfo.cdnPullInfo
│
└── 初始化播放器
    ├── 选择播放地址（根据平台和rtsFirst）
    └── 开始播放

↓

阶段6: 页面渲染与用户交互
├── 渲染教室组件（公开课/大班课）
├── 接口5: 获取直播间文件列表（切换到文件标签页时）
│   ├── 输入: liveRoomId
│   └── 输出: 文件列表
│
└── 接口6: 发送聊天消息（用户操作）
    ├── 输入: content, identity, liveRoomId, userId, name
    └── 输出: 无

↓

阶段7: 实时消息监听
└── IM消息监听
    └── 禁言/取消禁言 → 更新状态
```

---

## 注意事项

1. **liveRoomId 获取顺序**:
   - 优先从Cookie中的 `aui_live_room_id` 获取
   - 如果不存在，从"获取直播间详情"接口返回的 `id` 字段设置到 services 实例中

2. **播放地址选择**:
   - 移动端优先使用 HLS，PC端优先使用 FLV
   - RTS 流需要浏览器支持，否则自动降级

3. **IM SDK 初始化**:
   - 必须在获取教室信息成功后初始化
   - 需要先获取 token，再登录，最后加入群组

4. **接口调用顺序**:
   - 必须按照上述流程顺序调用，不能跳过或颠倒顺序
   - 某些接口依赖前置接口返回的数据

5. **移动端限制**:
   - 移动端仅支持学生角色（`role=0`）
   - 讲师（`role=1`）和助教（`role=2`）在移动端会提示"只有学生才能在移动端登录"并退出

6. **role到identity转换规则**:
   - `role=0`（学生）→ `identity='1'`
   - `role=1`（讲师）→ `identity='3'`
   - `role=2`（助教）→ `identity='2'`

7. **回放功能**:
   - 触发条件：课程状态为已结束（`status === 2`）且 sessionStorage 中存在 `PLAN_ID`
   - 满足条件时显示回放组件，否则显示直播组件

8. **参数校验与错误处理**:
   - **必填参数校验**：`id`（教室ID）为必填，如果缺失会显示"参数异常，请检查！"并停止流程
   - **角色校验**：移动端仅支持学生角色，其他角色会提示并退出
   - **接口错误处理**：各接口调用失败时会显示相应的错误提示（如"消息发送失败"等）
