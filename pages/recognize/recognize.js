/**
 * 注意：使用此功能前，请在微信开发者工具中配置以下域名：
 * request合法域名: https://ark.cn-beijing.volces.com
 * 
 * 配置路径：微信开发者工具 -> 详情 -> 本地设置 -> 项目配置 -> 服务器域名
 * 或在微信公众平台 -> 开发 -> 开发管理 -> 开发设置 -> 服务器域名 中配置
 * 
 * 开发测试时可勾选"不校验合法域名..."选项临时使用
 */

Page({
  data: {
    tempFilePath: '', // 选择的图片路径
    isProcessing: false, // 是否处理中
    recognitionResult: '', // 识别结果
    errorMessage: '', // 错误信息
    apiKey: '' // API密钥
  },

  /**
   * 选择图片
   */
  chooseImage() {
    // 添加振动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        this.setData({
          tempFilePath,
          recognitionResult: '',
          errorMessage: ''
        });
        
        // 添加震动反馈表示成功选择图片
        setTimeout(() => {
          if (wx.vibrateShort) {
            wx.vibrateShort({ type: 'medium' });
          }
        }, 200);
      }
    });
  },

  /**
   * 设置API密钥
   */
  setApiKey() {
    wx.showModal({
      title: '设置API密钥',
      content: '请输入火山引擎API密钥',
      editable: true,
      placeholderText: '例如: 3986dec3-90fc-4f1f-82a1-5bcd383ad3fd',
      success: (res) => {
        if (res.confirm && res.content) {
          // 保存API密钥
          wx.setStorageSync('ark_api_key', res.content);
          this.setData({ apiKey: res.content });
          wx.showToast({
            title: 'API密钥已保存',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 识别图片
   */
  recognizeImage() {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 检查API密钥
    if (!this.data.apiKey) {
      wx.showModal({
        title: '需要API密钥',
        content: '图片识别功能需要火山引擎API密钥，请先设置',
        confirmText: '设置',
        success: (res) => {
          if (res.confirm) {
            this.setApiKey();
          }
        }
      });
      return;
    }

    // 添加振动反馈表示开始识别
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'medium' });
    }
    
    this.setData({ 
      isProcessing: true,
      errorMessage: '' 
    });

    // 将图片转为base64
    this.imageToBase64(this.data.tempFilePath).then(base64 => {
      // 调用火山引擎API
      this.callArkAPI(base64);
    }).catch(error => {
      this.setData({
        isProcessing: false,
        errorMessage: '图片转换失败: ' + error.message
      });
    });
  },

  /**
   * 将图片转为base64格式
   */
  imageToBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: res => {
          resolve(res.data);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  },

  /**
   * 调用火山引擎API
   */
  callArkAPI(base64Image) {
    // 构建请求数据
    const requestData = {
      model: "ep-20250523172130-lfnsc",
      messages: [
        {
          content: [
            {
              text: "图片主要讲了什么?",
              type: "text"
            },
            {
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              },
              type: "image_url"
            }
          ],
          role: "user"
        }
      ]
    };

    // 发送请求到火山引擎API
    wx.request({
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.data.apiKey}`
      },
      data: requestData,
      success: (res) => {
        // 处理响应
        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
          const content = res.data.choices[0].message.content;
          this.setData({
            recognitionResult: content,
            isProcessing: false
          });
          
          // 成功识别的振动反馈
          if (wx.vibrateShort) {
            wx.vibrateShort({ type: 'heavy' });
          }
        } else {
          let errorMsg = '识别失败';
          if (res.data && res.data.error) {
            errorMsg += ': ' + res.data.error.message;
          }
          this.setData({
            errorMessage: errorMsg,
            isProcessing: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          errorMessage: '网络请求失败: ' + err.errMsg,
          isProcessing: false
        });
      }
    });
  },

  /**
   * 复制识别结果
   */
  copyResult() {
    if (this.data.recognitionResult) {
      wx.setClipboardData({
        data: this.data.recognitionResult,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
          
          // 添加振动反馈
          if (wx.vibrateShort) {
            wx.vibrateShort({ type: 'light' });
          }
        }
      });
    }
  },

  /**
   * 重置识别
   */
  resetRecognition() {
    this.setData({
      recognitionResult: '',
      errorMessage: ''
    });
    
    // 添加振动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片识别'
    });
    
    // 获取保存的API密钥
    const apiKey = wx.getStorageSync('ark_api_key');
    if (apiKey) {
      this.setData({ apiKey });
    }
  }
}) 