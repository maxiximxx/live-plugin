/**
 * 创建事件总线实例
 * @returns 事件总线对象，包含事件的订阅、发布、查询、删除等操作方法
 */
const useEventBus = () => {
  const all = new Map();

  return ({
  /** 存储的所有事件 */
    all,
    /**
     * 订阅指定事件
     * @param key 事件名称
     * @param callBack 事件触发时的回调函数
     */
    on: (key, callBack) => {
      const handlers = all.get(key) || [];
      handlers.push(callBack);
      all.set(key, handlers);
    },
    /**
     * 发布指定事件
     * @param key 事件名称
     * @param result 传递给回调函数的数据
     */
    emit: (key, result) => {
      const handlers = all.get(key) || [];
      handlers.forEach(handler => handler(result));
    },
    /**
     * 设置指定key的值
     * @param key 名称
     * @param value 值
     */
    set: (key, value) => { all.set(key, value); },
    /**
     * 获取指定key的值
     * @param key 名称
     * @returns 值
     */
    get: key => all.get(key) || null,
    /**
     * 检查是否存在指定事件的监听器
     * @param key 事件名称
     * @returns 如果存在返回true，否则返回false
     */
    has: key => all.has(key),
    /**
     * 删除指定事件的所有监听器
     * @param key 事件名称
     */
    delete: key => all.has(key) && all.delete(key),
  });
};

/** 事件总线实例 */
export const eventBus = useEventBus();

export default eventBus;
