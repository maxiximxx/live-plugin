import { getAttachments } from '../../service/index'
import { downloadFile, openFile } from '../../utils/handle-file'

// plugin/components/live-file/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 必须配置项：教室ID
    classId: {
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
        classId: this.properties.classId,
      })
      if (res && Array.isArray(res.docInfos)) {
        const fileList = res.docInfos.map((item) => {
          const fileInfo = item.docInfos ? JSON.parse(item.docInfos) : {}
          const { name: fileName, fileType, docId: fileId, params } = fileInfo
          return {
            fileId,
            fileName,
            fileType,
            fileTime: item.createdAt,
            fileUrl: params.backupResultUrls[0],
          }
        })
        this.setData({
          fileList,
        })
        console.log(fileList)
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
