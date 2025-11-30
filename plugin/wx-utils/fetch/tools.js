/** 根据状态码获取错误提示 */
export const getErrorMsg = (statusCode, defaultMsg) => {
  switch (statusCode) {
    case 404:
      return 'Not Found'; // 请求地址不存在
    case 405:
      return 'Method Not Allowed'; // 请求方法不正确
    case 500:
      return defaultMsg || 'Internal Server Error'; // 服务器内部错误
    case 502:
      return 'Bad Gateway'; // 服务网关错误
    case 503:
      return 'Service Temporarily Unavailable'; // 服务暂时不可用
    case -1:
      return 'Request Failed'; // 请求错误
    case -2:
      return defaultMsg || 'Unknown Error'; // 未知错误
    default:
      return defaultMsg || 'Unknown Msg';
  }
};
