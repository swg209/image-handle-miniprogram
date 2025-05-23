Page({
  data: {
    tempFilePath: '', // 临时文件路径
    resultPath: '', // 结果图片路径
    isProcessing: false, // 是否正在处理
    processingStage: '', // 处理阶段
    uploadProgress: 0, // 上传进度
    downloadProgress: 0, // 下载进度
    useDemoMode: false, // 是否使用演示模式
    apiKey: '' // Remove.bg API Key
  },

  onLoad: function () {
    // 页面加载时的逻辑
    console.log('抠图页面加载完成');
    
    // 获取保存的API Key
    const apiKey = wx.getStorageSync('removebg_api_key');
    if (apiKey) {
      this.setData({ apiKey });
    }
  },

  // 选择图片
  chooseImage: function () {
    console.log('chooseImage函数被调用');
    const that = this;
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        console.log('选择图片成功', res.tempFiles[0].tempFilePath);
        that.setData({
          tempFilePath: res.tempFiles[0].tempFilePath,
          resultPath: '' // 清空之前的结果
        });
      },
      fail: function(err) {
        console.error('选择图片失败', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      },
      complete: function() {
        console.log('选择图片操作完成');
      }
    });
  },

  // 设置API Key
  setApiKey: function () {
    const that = this;
    wx.showModal({
      title: '设置API Key',
      content: '请输入您的Remove.bg API Key',
      editable: true,
      placeholderText: '例如: WRK325hCzGkc8zbyABYp2LkB',
      success: function (res) {
        if (res.confirm && res.content) {
          // 保存API Key
          wx.setStorageSync('removebg_api_key', res.content);
          that.setData({ apiKey: res.content });
          wx.showToast({
            title: 'API Key已保存',
            icon: 'success'
          });
        }
      }
    });
  },

  // 移除背景
  removeBackground: function () {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 检查API Key
    if (!this.data.apiKey) {
      wx.showModal({
        title: '需要API Key',
        content: '抠图功能需要Remove.bg的API Key，请先设置',
        confirmText: '设置',
        success: (res) => {
          if (res.confirm) {
            this.setApiKey();
          }
        }
      });
      return;
    }

    // 开启演示模式 (仅用于测试界面)
    if (this.data.useDemoMode) {
      this.runDemoMode();
      return;
    }

    this.setData({
      isProcessing: true,
      processingStage: '准备处理图片...',
      uploadProgress: 0,
      downloadProgress: 0
    });

    const that = this;

    // 读取图片并转为Base64
    wx.getFileSystemManager().readFile({
      filePath: this.data.tempFilePath,
      encoding: 'base64',
      success: function (res) {
        that.setData({
          processingStage: '图片读取成功，准备上传...',
          uploadProgress: 20
        });

        // 直接调用API
        that.tryDirectApiCall(res.data);
      },
      fail: function (error) {
        console.error('读取图片失败', error);
        that.setData({ isProcessing: false });
        wx.showToast({
          title: '读取图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 尝试直接调用Remove.bg API
  tryDirectApiCall: function (imageBase64) {
    const that = this;
    
    this.setData({
      processingStage: '正在调用抠图服务...',
      uploadProgress: 50,
      downloadProgress: 10
    });

    // 直接调用Remove.bg API
    wx.request({
      url: 'https://api.remove.bg/v1.0/removebg',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.data.apiKey
      },
      data: {
        image_file_b64: imageBase64,
        size: 'auto',
        format: 'png'
      },
      responseType: 'arraybuffer',  // 重要：设置响应类型为arraybuffer
      success: function(res) {
        console.log('API调用成功', res);
        
        // 检查是否成功
        if (res.statusCode === 200 && res.data) {
          that.setData({
            processingStage: '抠图完成，处理结果...',
            uploadProgress: 100,
            downloadProgress: 50
          });
          
          // 将arraybuffer转为base64
          const base64 = wx.arrayBufferToBase64(res.data);
          
          // 处理返回的结果
          that.processResult(base64);
        } else {
          console.error('API调用失败', res);
          
          // 尝试解析错误信息
          let errorMsg = '抠图失败';
          try {
            if (typeof res.data === 'string') {
              const errorJson = JSON.parse(res.data);
              if (errorJson.errors && errorJson.errors.length > 0) {
                errorMsg = errorJson.errors[0].title || '抠图失败';
              }
            }
          } catch (e) {
            console.error('解析错误信息失败', e);
          }
          
          that.showApiError(errorMsg);
        }
      },
      fail: function(err) {
        console.error('请求失败', err);
        
        // 提示用户可能需要在后台配置域名
        wx.showModal({
          title: 'API请求失败',
          content: '请求失败，可能原因：\n1. 网络问题\n2. 未在小程序管理后台添加API域名到request合法域名\n\n是否使用演示模式？',
          confirmText: '使用演示模式',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              that.setData({ useDemoMode: true });
              that.runDemoMode();
            } else {
              that.setData({ isProcessing: false });
            }
          }
        });
      },
      complete: function() {
        console.log('API请求完成');
      }
    });
  },
  
  // 显示API错误
  showApiError: function(errorMsg) {
    this.setData({ isProcessing: false });
    
    wx.showModal({
      title: 'API调用失败',
      content: errorMsg || '抠图失败，请重试',
      confirmText: '使用演示模式',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({ useDemoMode: true });
          this.runDemoMode();
        }
      }
    });
  },
  
  // 演示模式 - 模拟抠图结果
  runDemoMode: function() {
    const that = this;
    
    this.setData({
      isProcessing: true,
      processingStage: '模拟抠图处理中...',
      uploadProgress: 30,
      downloadProgress: 0
    });
    
    // 模拟上传和处理过程
    setTimeout(() => {
      that.setData({
        uploadProgress: 100,
        downloadProgress: 30,
        processingStage: '正在处理图像...'
      });
      
      setTimeout(() => {
        that.setData({
          downloadProgress: 70,
          processingStage: '生成透明背景...'
        });
        
        setTimeout(() => {
          that.setData({
            downloadProgress: 100,
            processingStage: '完成处理...'
          });
          
          // 使用原图模拟结果
          const tempFilePath = that.data.tempFilePath;
          
          that.setData({
            resultPath: tempFilePath,
            isProcessing: false
          });
          
          wx.showToast({
            title: '演示模式：抠图完成',
            icon: 'success'
          });
        }, 800);
      }, 1000);
    }, 1200);
  },

  // 处理结果
  processResult: function (base64Data) {
    const that = this;
    
    this.setData({
      processingStage: '保存处理结果...',
      downloadProgress: 80
    });

    const fs = wx.getFileSystemManager();
    const tempFilePath = `${wx.env.USER_DATA_PATH}/removebg_result_${Date.now()}.png`;

    try {
      fs.writeFile({
        filePath: tempFilePath,
        data: base64Data,
        encoding: 'base64',
        success: function () {
          console.log('图片保存成功', tempFilePath);
          
          // 确保UI更新
          setTimeout(() => {
            that.setData({
              resultPath: tempFilePath,
              isProcessing: false,
              downloadProgress: 100
            });
            
            wx.showToast({
              title: '抠图完成',
              icon: 'success'
            });
          }, 300);
        },
        fail: function (error) {
          console.error('保存图片失败', error);
          that.setData({ isProcessing: false });
          wx.showToast({
            title: '保存结果失败',
            icon: 'none'
          });
          
          // 尝试使用演示模式
          wx.showModal({
            title: '保存失败',
            content: '无法保存处理结果，是否使用演示模式？',
            confirmText: '使用演示模式',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                that.setData({ useDemoMode: true });
                that.runDemoMode();
              }
            }
          });
        }
      });
    } catch (e) {
      console.error('处理结果异常', e);
      that.setData({ isProcessing: false });
      wx.showToast({
        title: '处理结果失败',
        icon: 'none'
      });
    }
  },

  // 保存图片到相册
  saveImage: function () {
    if (!this.data.resultPath) {
      return;
    }

    const that = this;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultPath,
      success: function () {
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        });
      },
      fail: function (error) {
        console.error('保存到相册失败', error);
        // 如果是因为用户拒绝授权导致的失败
        if (error.errMsg.indexOf('auth deny') >= 0) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存到相册',
            confirmText: '去授权',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting({
                  success: function (settingRes) {
                    console.log('设置结果', settingRes);
                  }
                });
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  },
  
  // 切换演示模式
  toggleDemoMode: function() {
    this.setData({
      useDemoMode: !this.data.useDemoMode
    });
    
    wx.showToast({
      title: this.data.useDemoMode ? '已开启演示模式' : '已关闭演示模式',
      icon: 'none'
    });
  }
})