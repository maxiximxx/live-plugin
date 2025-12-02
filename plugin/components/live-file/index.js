import { getAttachments } from '../../service/index'
import { downloadFile, openFile } from '../../utils/handle-file'

// plugin/components/live-file/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 必须配置项：直播间ID
    liveRoomId: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    fileList: [], // 直播文档
  },

  lifetimes: {
    attached: function () {
      this.getAttachments()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 获取直播文档
    getAttachments: async function () {
      const res = await getAttachments({
        liveRoomId: this.properties.liveRoomId,
      })
      if (Array.isArray(res)) {
        const fileList = res.map((item) => {
          const { name, fileType, fileUrl, createTime } = item
          return {
            fileName: name,
            fileType,
            fileTime: createTime,
            fileUrl,
          }
        })
        this.setData({
          fileList,
        })
      }
    },
    onOpenFile: async function (e) {
      const { fileUrl } = e.currentTarget.dataset
      const res = await downloadFile(fileUrl)
      console.log(res)
      await openFile(res.tempFilePath ?? res.filePath)
    },
  },
})
