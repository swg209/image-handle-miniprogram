Page({
  data: {
    tempFilePath: '', // 选择的图片路径
    compressedPath: '', // 压缩后的图片路径
    originalSize: 0, // 原始大小
    compressedSize: 0, // 压缩后大小
    compressQuality: 80, // 默认压缩质量
    isProcessing: false, // 是否处理中
    maxImageSize: 1280, // 最大图片尺寸
    
    // 格式化后的数据，用于显示
    originalSizeFormat: '0KB',
    compressedSizeFormat: '0KB',
    compressionRateFormat: '0%'
  },

  /**
   * 选择图片
   */
  chooseImage() {
    // 先添加振动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const originalSize = res.tempFiles[0].size;
        
        this.setData({
          tempFilePath,
          originalSize,
          compressedPath: '',
          compressedSize: 0
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
   * 调整压缩质量
   */
  sliderChange(e) {
    const newQuality = e.detail.value;
    
    // 仅当值变化超过一定范围时才震动
    if (Math.abs(newQuality - this.data.compressQuality) >= 5) {
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }
    }
    
    this.setData({
      compressQuality: newQuality
    });
  },

  /**
   * 压缩图片
   */
  compressImage() {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 添加振动反馈表示开始压缩
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'medium' });
    }
    
    this.setData({ isProcessing: true });

    // 使用canvas进行图片压缩
    const quality = this.data.compressQuality / 100;
    
    // 获取图片信息
    wx.getImageInfo({
      src: this.data.tempFilePath,
      success: (res) => {
        const imageWidth = res.width;
        const imageHeight = res.height;
        
        // 计算压缩后的尺寸（等比例缩小）
        let targetWidth = imageWidth;
        let targetHeight = imageHeight;
        
        // 如果图片尺寸超过最大值，按比例缩小
        const maxSize = this.data.maxImageSize;
        if (imageWidth > maxSize || imageHeight > maxSize) {
          if (imageWidth > imageHeight) {
            targetWidth = maxSize;
            targetHeight = Math.floor(imageHeight * (maxSize / imageWidth));
          } else {
            targetHeight = maxSize;
            targetWidth = Math.floor(imageWidth * (maxSize / imageHeight));
          }
        }
        
        // 创建Canvas上下文
        const query = wx.createSelectorQuery();
        query.select('#compressCanvas')
          .fields({ node: true, size: true })
          .exec((result) => {
            const canvas = result[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸为目标尺寸
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.onload = () => {
              // 清除画布并绘制图片（缩放到目标尺寸）
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              
              // 将canvas内容导出为图片
              wx.canvasToTempFilePath({
                canvas: canvas,
                quality: quality,
                fileType: 'jpg', // 指定为jpg格式，通常比png小
                success: (result) => {
                  // 获取压缩后文件大小
                  wx.getFileInfo({
                    filePath: result.tempFilePath,
                    success: (sizeRes) => {
                      // 检查压缩后的大小是否真的减小了
                      if (sizeRes.size >= this.data.originalSize) {
                        // 如果压缩后反而变大，尝试更低的质量
                        const lowerQuality = Math.max(quality * 0.7, 0.5);
                        wx.canvasToTempFilePath({
                          canvas: canvas,
                          quality: lowerQuality,
                          fileType: 'jpg',
                          success: (lowerResult) => {
                            wx.getFileInfo({
                              filePath: lowerResult.tempFilePath,
                              success: (lowerSizeRes) => {
                                this.finishCompression(lowerResult.tempFilePath, lowerSizeRes.size);
                              },
                              fail: (err) => {
                                this.handleCompressionError('获取文件信息失败');
                              }
                            });
                          },
                          fail: (err) => {
                            this.handleCompressionError('二次压缩失败');
                          }
                        });
                      } else {
                        // 正常情况：压缩成功且大小减小
                        this.finishCompression(result.tempFilePath, sizeRes.size);
                      }
                    },
                    fail: (err) => {
                      this.handleCompressionError('获取文件信息失败');
                    }
                  });
                },
                fail: (err) => {
                  this.handleCompressionError('压缩失败');
                }
              });
            };
            
            img.onerror = (err) => {
              this.handleCompressionError('图片加载失败');
            };
            
            // 设置图片源
            img.src = this.data.tempFilePath;
          });
      },
      fail: (err) => {
        this.handleCompressionError('获取图片信息失败');
      }
    });
  },

  /**
   * 完成压缩处理
   */
  finishCompression(filePath, fileSize) {
    // 计算压缩率，如果压缩效果显著，使用更强的震动
    const compressionRate = 100 - (fileSize / this.data.originalSize * 100);
    
    // 格式化数据用于显示
    const originalSizeFormat = (this.data.originalSize / 1024).toFixed(1) + 'KB';
    const compressedSizeFormat = (fileSize / 1024).toFixed(1) + 'KB';
    const compressionRateFormat = compressionRate.toFixed(1) + '%';
    
    this.setData({
      compressedPath: filePath,
      compressedSize: fileSize,
      isProcessing: false,
      // 设置格式化后的数据
      originalSizeFormat,
      compressedSizeFormat,
      compressionRateFormat
    });
    
    // 延迟一点，让UI先完成更新
    setTimeout(() => {
      // 根据压缩率提供不同的触觉反馈
      if (compressionRate > 50) {
        // 高压缩率，更强的反馈
        wx.vibrateShort({ type: 'heavy' });
        setTimeout(() => wx.vibrateShort({ type: 'medium' }), 100);
      } else {
        // 普通压缩率
        wx.vibrateShort({ type: 'medium' });
      }
      
      // 显示成功提示
      wx.showToast({
        title: '压缩成功',
        icon: 'success',
        duration: 2000
      });
    }, 200);
  },

  /**
   * 处理压缩错误
   */
  handleCompressionError(message) {
    console.error(message);
    this.setData({ isProcessing: false });
    
    // 错误震动反馈 - 两次短振动
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(() => wx.vibrateShort({ type: 'heavy' }), 100);
    }
    
    wx.showToast({
      title: message,
      icon: 'none'
    });
  },

  /**
   * 保存图片
   */
  saveImage() {
    if (!this.data.compressedPath) {
      wx.showToast({
        title: '请先压缩图片',
        icon: 'none'
      });
      return;
    }
    
    // 添加初始振动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.compressedPath,
      success: () => {
        // 添加成功振动反馈 - 两次振动
        setTimeout(() => {
          if (wx.vibrateShort) {
            wx.vibrateShort({ type: 'medium' });
            setTimeout(() => wx.vibrateShort({ type: 'light' }), 100);
          }
        }, 200);
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存失败', err);
        
        // 处理权限问题
        if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
          wx.showModal({
            title: '保存失败',
            content: '需要授权访问相册才能保存图片',
            confirmText: '去授权',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
          return;
        }
        
        // 失败振动反馈
        if (wx.vibrateShort) {
          wx.vibrateShort({ type: 'heavy' });
        }
        
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片压缩'
    });
  }
}) 