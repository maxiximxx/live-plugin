import { useFetch } from './fetch';
import { getErrorMsg } from './tools';
import eventBus from '../event-bus';
import { cloneDeep } from '../index.js';
import { hideLoading, loading, toast } from '../native';

const SUCCESS_STATUS_CODES = [200];

const getRequestConfig = () => ({
  host: wx.getStorageSync('API_HOST'),
  method: 'GET',
  header: {},
  timeout: 10000,
  isDebounce: true,
  isShowErrorHint: true,
  isShowLoading: false,
  loadingText: '加载中',
  passStatusCodes: [],
});

const useBaseFetch = () => {
  const fetch = useFetch(getRequestConfig);
  /** 加载中的弹窗数量 */
  let loadingNum = 0;

  /** 请求拦截基础数据处理 */
  fetch.interceptors.request.use(async (config) => {
    const currentConfig = cloneDeep(config);

    const accountToken = wx.getStorageSync('ACCOUNT_TOKEN');
    accountToken && (currentConfig.header.token = accountToken);

    currentConfig.data = currentConfig.data || {};

    return currentConfig;
  });

  /** 请求拦截loading弹窗处理 */
  fetch.interceptors.request.use((config) => {
    if (!config.isShowLoading) return config;
    !loadingNum && loading(config.loadingText);
    loadingNum++;
    return config;
  });

  /** 响应拦截loading弹窗处理 */
  fetch.interceptors.response.use((result) => {
    if (!result.requestConfig.isShowLoading) return result;
    loadingNum--;
    !loadingNum && hideLoading();
    return result;
  });

  /** 响应拦截基础数据处理 */
  fetch.interceptors.response.use((result) => {
    const statusCode = result.code ?? -1;

    if (statusCode !== 200) {
      return {
        code: statusCode,
        errCode: '',
        msg: getErrorMsg(statusCode, result.data?.msg || result.data?.errMessage),
        data: null,
        header: result.header,
        cookies: result.cookies,
        requestConfig: result.requestConfig,
      };
    }

    const responseData = result.data ?? {};
    const responseMsg = responseData.errMessage;
    const responseStatusCode = responseData.success ? statusCode : -2;

    return {
      code: responseStatusCode,
      errCode: responseData.errCode ?? '',
      msg: responseMsg,
      data: responseData,
      header: result.header,
      cookies: result.cookies,
      requestConfig: result.requestConfig,
    };
  });

  /** 响应拦截通用数据处理 */
  fetch.interceptors.response.use((result) => {
    return { ...result, data: result.data?.data ?? null };
  });

  /** 响应拦截401状态码处理 */
  fetch.interceptors.response.use(async (result) => {
    if (result.code !== 401 || result.requestConfig.passStatusCodes.includes(401) || !result.requestConfig.isLogin) return result;
    /** 触发账号授权登录 */
    eventBus.emit('AccountAuthorizationLogin');
    return result;
  });

  /** 响应拦截其他状态码处理 */
  fetch.interceptors.response.use((result) => {
    if (SUCCESS_STATUS_CODES.includes(result.code)) return result;

    if (result.requestConfig.passStatusCodes.includes(result.code)) return result;

    result.requestConfig.isShowErrorHint && toast(result.msg);

    return result;
  });

  return {
    request: fetch.request,
    get: fetch.get,
    post: fetch.post,
  };
};

export const baseFetch = useBaseFetch();
