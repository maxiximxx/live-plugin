import { asyncDebounce, merge } from '../index';

const useInterceptorManager = () => {
  const handlers = [];
  const use = (fulfilled, rejected) => {
    handlers.push({ fulfilled, rejected });
    return handlers.length - 1;
  };
  return { handlers, use };
};

export const useFetch = (getRequestConfig) => {
  const interceptors = {
    request: useInterceptorManager(),
    response: useInterceptorManager(),
  };

  const dispatchRequest = fullRequestConfig => new Promise((resolve) => {
		const { host, url, method, header, timeout, data: requestData } = fullRequestConfig;
    wx.request({
      url: `${host}${url}`,
      method,
      header,
      timeout,
      data: requestData,
      complete: (result) => {
        const {
          data: responseData,
          cookies,
          errMsg: msg,
          statusCode: code,
          header: responseHeader,
        } = result;
        resolve({
          msg: msg || '',
          code: code || -1,
          errCode: '',
          data: responseData,
          cookies: cookies || [],
          header: responseHeader || {},
          requestConfig: fullRequestConfig,
        });
      },
    });
  });

  const core = async (requestConfig) => {
    let fullRequestConfig = requestConfig;
    // 请求拦截处理
    const requestInterceptorChain = interceptors.request.handlers;
    for (const { fulfilled: onFulfilled, rejected: onRejected } of requestInterceptorChain) {
      try {
        fullRequestConfig = await onFulfilled(fullRequestConfig);
      }
      catch (error) {
        return Promise.reject(onRejected ? (await onRejected(error)) || error : error);
      }
    }

    // 发送请求
    let fullResponseResult = await dispatchRequest(fullRequestConfig);

    // 响应拦截处理
    const responseInterceptorChain = interceptors.response.handlers;
    for (const { fulfilled: onFulfilled, rejected: onRejected } of responseInterceptorChain) {
      try {
        fullResponseResult = await onFulfilled(fullResponseResult);
      }
      catch (error) {
        return Promise.reject(onRejected ? (await onRejected(error)) || error : error);
      }
    }

    return fullResponseResult;
  };

  const request = (requestConfig) => {
    const fullRequestConfig = merge({ originalRequestConfig: requestConfig }, getRequestConfig(), requestConfig);
    if (!fullRequestConfig.isDebounce) return core(fullRequestConfig);
    return asyncDebounce(`Request:${requestConfig.url}`, () => core(fullRequestConfig));
  };

  const get = requestConfig => request({ isEncrypt: false, ...requestConfig, method: 'GET' });

  const post = requestConfig => request({ ...requestConfig, method: 'POST' });

  return {
    interceptors,
    request,
    get,
    post,
  };
};
