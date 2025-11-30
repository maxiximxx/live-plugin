import { isString } from './index.js';

/** 消息提示框 */
export const toast = (options) => {
  const currentOptions = isString(options) ? { title: options } : options;
  if (!currentOptions?.title) return;
  currentOptions.icon = currentOptions.icon ?? 'none'; // 默认不显示图标
  currentOptions.mask = currentOptions.mask ?? true; // 默认显示透明蒙层，防止触摸穿透
  wx.showToast(currentOptions);
};

/** 加载提示框（需要主动关闭） */
export const loading = (options) => {
  const currentOptions = isString(options) ? { title: options } : options;
  if (!currentOptions.title) return;
  currentOptions.mask = currentOptions.mask ?? true; // 默认显示透明蒙层，防止触摸穿透
  wx.showLoading(currentOptions);
};

/** 隐藏加载提示框 */
export const hideLoading = () => wx.hideLoading();

/** 模态框弹窗 */
export const modal = (
  title,
  content,
  callBack,
  extend
) =>
  wx.showModal({
    title,
    content,
    ...(extend ?? {}),
    ...(typeof callBack === 'function' ? {} : (callBack ?? {})),
    success: ({ confirm }) => {
      confirm && typeof callBack === 'function' && callBack();
    },
  });
