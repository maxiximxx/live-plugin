# 小程序直播插件
## ✅ 使用方式

在页面的 WXML 文件中直接使用 `<live-plugin />` 组件，并传入以下属性：

```html
<live-plugin
  classId="{{classId}}"
  liveRoomId="{{liveRoomId}}"
  identity="{{identity}}"
  account="{{account}}"
  token="{{token}}"
  planId="{{planId}}"
/>
```

| 属性名        | 类型   | 是否必填  | 说明 
|---------------|--------|----------|------
| `classId`     | string | 是       | 教室 ID
| `liveRoomId`  | string | 是       | 直播间 ID
| `identity`    | string | 是       | 用户身份 1(学生) 2(助教) 3(讲师)
| `account`     | string | 是       | 用户账号
| `token`       | string | 是       | 用户token
| `planId`      | string | 否       | 计划ID 回放功能判断

## ❗特别注意
在使用插件前，需要调用插件导出的2个方法分别设置token和apiHost。调用时机是在插件初始化前，尽量在进入插件页面前或渲染插件前
```javascript
const plugin = requirePlugin('live-plugin')
plugin.setApiHost('apiHost')
plugin.setAccountToken('token')
```