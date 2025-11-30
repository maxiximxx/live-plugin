import { downloadFile, openFile } from '../../utils/handle-file'

// plugin/components/live-file/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    fileList: {
      type: Array,
      value: [],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    onOpenFile: async function (e) {
      const { index } = e.currentTarget.dataset
      const res = await downloadFile(
        'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf'
      )
      console.log(res)
      console.log(res)
      await openFile(res.tempFilePath ?? res.filePath)
    },
  },
})
