// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
const FormData = require('form-data')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到请求参数：', event);
  
  const { apiKey, imageBase64 } = event
  
  if (!apiKey || !imageBase64) {
    console.error('参数不完整', { apiKey: !!apiKey, imageBase64: !!imageBase64 });
    return {
      code: -1,
      msg: '参数不完整'
    }
  }

  try {
    console.log('开始处理图片...');
    
    // 设置FormData
    const formData = new FormData()
    
    // 添加图片数据，使用base64格式
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    formData.append('image_file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    })
    
    // 设置输出大小
    formData.append('size', 'auto')
    
    console.log('准备调用Remove.bg API...');
    
    // 发送请求到Remove.bg API
    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      },
      responseType: 'arraybuffer'
    })

    console.log('API调用成功，状态码:', response.status);
    
    // 转换结果为Base64
    const outputBase64 = Buffer.from(response.data).toString('base64')
    
    return {
      code: 0,
      data: outputBase64,
      msg: '抠图成功'
    }
  } catch (error) {
    console.error('抠图API调用失败', error);
    
    // 详细记录错误信息
    const errorResponse = error.response || {};
    const errorDetails = {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers: errorResponse.headers,
      message: error.message
    };
    
    console.error('错误详情:', errorDetails);
    
    return {
      code: -1,
      msg: error.message || '抠图失败',
      error: JSON.stringify(errorDetails)
    }
  }
} 