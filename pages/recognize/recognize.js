Page({
  data: {
    tempFilePath: '', // 选择的图片路径
    recognitionResult: null, // 识别结果
    isProcessing: false, // 是否处理中
    recognitionTypes: [
      { id: 'ocr', name: '文字识别', selected: true },
      { id: 'object', name: '物体识别', selected: false },
      { id: 'face', name: '人脸识别', selected: false }
    ]
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        this.setData({
          tempFilePath,
          recognitionResult: null
        });
      }
    });
  },

  /**
   * 切换识别类型
   */
  selectType(e) {
    const id = e.currentTarget.dataset.id;
    const types = this.data.recognitionTypes.map(type => {
      return {
        ...type,
        selected: type.id === id
      };
    });
    
    this.setData({ 
      recognitionTypes: types,
      recognitionResult: null
    });
  },

  /**
   * 开始识别
   */
  startRecognition() {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });

    // 获取当前选择的识别类型
    const selectedType = this.data.recognitionTypes.find(type => type.selected);
    
    // 实际应用中，这里需要调用云函数或第三方API进行识别
    // 这里我们模拟处理过程
    setTimeout(() => {
      // 模拟不同类型的识别结果
      let result = null;
      
      switch(selectedType.id) {
        case 'ocr':
          result = {
            type: 'ocr',
            text: '这是一段示例文字识别结果，实际应用中应替换为真实的识别内容。图片识别技术能够将图像中的文字转换为可编辑的文本格式。'
          };
          break;
        case 'object':
          result = {
            type: 'object',
            objects: [
              { name: '物体1', confidence: 0.95 },
              { name: '物体2', confidence: 0.87 },
              { name: '物体3', confidence: 0.72 }
            ]
          };
          break;
        case 'face':
          result = {
            type: 'face',
            faces: {
              count: 1,
              attributes: {
                gender: '男',
                age: '25-30',
                expression: '微笑'
              }
            }
          };
          break;
      }
      
      this.setData({
        recognitionResult: result,
        isProcessing: false
      });
    }, 2000);
  },

  /**
   * 复制识别结果文本
   */
  copyResult() {
    if (this.data.recognitionResult && this.data.recognitionResult.type === 'ocr') {
      wx.setClipboardData({
        data: this.data.recognitionResult.text,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片识别'
    });
  }
}) 